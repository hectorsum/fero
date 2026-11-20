-- Panel administrativo: quién es admin, disponibilidad editable y rate limit del login.

-- ─── Admins ────────────────────────────────────────────────────────────────────────
-- Un usuario autenticado NO es admin por defecto (el registro público de Supabase Auth
-- podría estar activo). Solo los user_id de esta tabla pueden editar la disponibilidad.
-- Se llena con scripts/create-user.mjs (service role).
create table public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;
revoke all on table public.admins from anon, authenticated;
grant all on table public.admins to service_role;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ─── Disponibilidad ────────────────────────────────────────────────────────────────
-- Una sola fila. `week`: { "0".."6": { open, blocks: [["09:00","12:00"], …] } } (0 = domingo).
-- `overrides`: { "YYYY-MM-DD": { closed?, blocked?: ["10:00", …] } }.
-- La forma se valida en la app (src/domain/entities/Availability.ts); aquí solo el tipo y tamaño.
create table public.availability (
  id         smallint primary key default 1 check (id = 1),
  week       jsonb not null check (jsonb_typeof(week) = 'object'),
  overrides  jsonb not null default '{}'::jsonb check (jsonb_typeof(overrides) = 'object' and pg_column_size(overrides) < 65536),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

insert into public.availability (id, week) values (1, '{
  "0": {"open": false, "blocks": []},
  "1": {"open": true, "blocks": [["09:00","12:00"],["14:00","21:00"]]},
  "2": {"open": true, "blocks": [["09:00","12:00"],["14:00","21:00"]]},
  "3": {"open": true, "blocks": [["09:00","12:00"],["14:00","21:00"]]},
  "4": {"open": true, "blocks": [["09:00","12:00"],["14:00","21:00"]]},
  "5": {"open": true, "blocks": [["09:00","12:00"],["14:00","21:00"]]},
  "6": {"open": true, "blocks": [["09:00","12:00"],["14:00","21:00"]]}
}'::jsonb);

alter table public.availability enable row level security;
revoke all on table public.availability from anon, authenticated;
grant select, update (week, overrides, updated_at, updated_by) on table public.availability to authenticated;

create policy "admins leen la disponibilidad"
  on public.availability for select to authenticated
  using (public.is_admin());

create policy "admins editan la disponibilidad"
  on public.availability for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Lectura pública (la agenda la necesita para ofrecer horarios). No contiene datos personales.
create or replace function public.get_availability()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object('week', a.week, 'overrides', a.overrides)
  from public.availability a
  where a.id = 1;
$$;

revoke all on function public.get_availability() from public;
grant execute on function public.get_availability() to anon, authenticated;

-- Los días de atención ahora los define el admin: se quita la regla fija «domingo cerrado».
-- (Se busca por definición porque el nombre lo generó Postgres.)
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.bookings'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%isodow%'
  loop
    execute format('alter table public.bookings drop constraint %I', c.conname);
  end loop;
end $$;

-- ─── Rate limit del login ──────────────────────────────────────────────────────────
-- Ventana fija por clave. Las claves son hashes SHA-256 (hex) calculados en el servidor:
-- no se guardan IPs ni correos en claro.
create table public.login_attempts (
  key          text primary key check (key ~ '^[0-9a-f]{64}$'),
  window_start timestamptz not null default now(),
  attempts     integer not null default 0
);

alter table public.login_attempts enable row level security;
revoke all on table public.login_attempts from anon, authenticated;

-- Registra un intento y devuelve los segundos que faltan para poder reintentar (0 = permitido).
-- Los límites se acotan aquí para que un cliente no pueda pedir ventanas absurdas.
create or replace function public.consume_login_attempt(p_key text, p_max integer, p_window_seconds integer)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_max    integer := least(greatest(coalesce(p_max, 5), 1), 50);
  v_window interval := make_interval(secs => least(greatest(coalesce(p_window_seconds, 900), 60), 3600));
  v_row    public.login_attempts;
begin
  if p_key is null or p_key !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid key' using errcode = '22023';
  end if;

  delete from public.login_attempts where window_start < now() - interval '1 day';

  insert into public.login_attempts as la (key, window_start, attempts)
  values (p_key, now(), 1)
  on conflict (key) do update
    set window_start = case when la.window_start + v_window <= now() then now() else la.window_start end,
        attempts     = case when la.window_start + v_window <= now() then 1 else la.attempts + 1 end
  returning * into v_row;

  if v_row.attempts > v_max then
    return greatest(1, ceil(extract(epoch from (v_row.window_start + v_window - now())))::integer);
  end if;
  return 0;
end;
$$;

revoke all on function public.consume_login_attempt(text, integer, integer) from public;
grant execute on function public.consume_login_attempt(text, integer, integer) to anon, authenticated;
