-- La anon key es pública: con el INSERT de 0001 cualquiera podía crear citas llamando a Supabase
-- directamente, saltándose el CAPTCHA y los límites del servidor. Desde ahora solo el servidor
-- (service_role, que salta RLS) inserta citas. anon conserva get_booked_slots y get_availability.
revoke insert on table public.bookings from anon;
drop policy if exists "anon puede crear citas" on public.bookings;

grant insert on table public.bookings to service_role;
