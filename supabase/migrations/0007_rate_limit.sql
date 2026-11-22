-- Limitador genérico de ventana fija para el servidor (reservas y consulta de horarios).
-- Reutiliza la tabla de 0003 (claves SHA-256, nunca datos en claro); consume_login_attempt sigue igual.
-- Admite ventanas de hasta 1 día (p. ej. 3 reservas por teléfono al día).
create or replace function public.consume_rate_limit(p_key text, p_max integer, p_window_seconds integer)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_max    integer := least(greatest(coalesce(p_max, 5), 1), 1000);
  v_window interval := make_interval(secs => least(greatest(coalesce(p_window_seconds, 3600), 60), 86400));
  v_row    public.login_attempts;
begin
  if p_key is null or p_key !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid key' using errcode = '22023';
  end if;

  -- Ninguna ventana supera 1 día: lo anterior ya caducó.
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

-- Solo el servidor: si anon pudiera llamarla, podría agotar los límites de otros.
revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;
