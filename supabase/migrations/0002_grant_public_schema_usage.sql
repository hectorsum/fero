-- Los proyectos nuevos de Supabase no conceden USAGE sobre el esquema public a los roles
-- de la Data API. Sin esto, anon no puede insertar citas ni llamar a get_booked_slots
-- ("permission denied for schema public"). Los permisos por tabla/función siguen siendo
-- los de 0001: anon solo INSERT en bookings (con RLS) y EXECUTE en get_booked_slots.
grant usage on schema public to anon, authenticated;
