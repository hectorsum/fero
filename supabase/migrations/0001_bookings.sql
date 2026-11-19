-- Citas de corte/grooming. El flujo de tatuaje va por WhatsApp y no se guarda aquí.

create extension if not exists btree_gist;

create table public.bookings (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(btrim(name)) between 1 and 120),
  phone        text not null check (char_length(btrim(phone)) between 1 and 40),
  email        text not null check (char_length(email) <= 254 and email ~ '.+@.+\..+'),
  notes        text not null default '' check (char_length(notes) <= 1000),
  service      text not null check (service in ('completo', 'barba', 'corte')),
  date         date not null check (extract(isodow from date) <> 7), -- domingo cerrado
  time         time not null,
  duration_min integer not null check (duration_min between 1 and 480),
  status       text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_at   timestamptz not null default now(),

  -- Ninguna cita confirmada puede cruzarse con otra (p. ej. "completo" 09:00–11:00 y "corte" 10:00).
  constraint bookings_no_overlap exclude using gist (
    tsrange(date + time, date + time + duration_min * interval '1 minute') with &&
  ) where (status = 'confirmed')
);

-- Evita la doble reserva de la misma fecha+hora. Parcial para que una cita cancelada libere su horario.
create unique index bookings_date_time_confirmed_key
  on public.bookings (date, time)
  where status = 'confirmed';

-- RLS: el rol anónimo solo puede insertar citas confirmadas; no puede leer, editar ni borrar.
alter table public.bookings enable row level security;

revoke all on table public.bookings from anon, authenticated;
grant insert on table public.bookings to anon;

create policy "anon puede crear citas"
  on public.bookings
  for insert
  to anon
  with check (status = 'confirmed');

-- Horarios ocupados de un día, sin datos personales.
create or replace function public.get_booked_slots(p_date date)
returns table ("date" date, "time" time, duration_min integer)
language sql
stable
security definer
set search_path = ''
as $$
  select b.date, b.time, b.duration_min
  from public.bookings b
  where b.date = p_date
    and b.status = 'confirmed'
  order by b.time;
$$;

revoke all on function public.get_booked_slots(date) from public;
grant execute on function public.get_booked_slots(date) to anon, authenticated;
