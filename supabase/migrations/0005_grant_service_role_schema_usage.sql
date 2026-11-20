-- Igual que 0002, pero para service_role: sin USAGE sobre public, el servidor no puede leer
-- google_calendar_connection ni guardar google_event_id ("permission denied for schema public").
-- Los permisos por tabla siguen siendo los de 0003/0004.
grant usage on schema public to service_role;
