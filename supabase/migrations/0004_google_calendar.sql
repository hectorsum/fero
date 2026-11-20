-- Conexión con Google Calendar del admin (una sola cuenta).
-- El refresh token se guarda cifrado (AES-256-GCM, clave GOOGLE_TOKEN_ENCRYPTION_KEY en el servidor).
-- Solo el servidor (service_role) lee o escribe esta tabla: ni anon ni authenticated tienen acceso.
create table public.google_calendar_connection (
  id                smallint primary key default 1 check (id = 1),
  email             text not null check (char_length(email) <= 254),
  refresh_token_enc text not null check (char_length(refresh_token_enc) <= 4096),
  calendar_id       text not null default 'primary' check (char_length(calendar_id) <= 256),
  sync_events       boolean not null default true,
  respect_busy      boolean not null default true,
  connected_at      timestamptz not null default now(),
  connected_by      uuid references auth.users (id) on delete set null,
  -- Último fallo al hablar con Google (p. ej. acceso revocado); se muestra en el panel.
  last_error        text check (char_length(last_error) <= 500),
  last_error_at     timestamptz
);

alter table public.google_calendar_connection enable row level security;
revoke all on table public.google_calendar_connection from anon, authenticated;
grant all on table public.google_calendar_connection to service_role;

-- Id del evento creado en Google para cada cita (para trazabilidad / futuras cancelaciones).
alter table public.bookings add column google_event_id text check (char_length(google_event_id) <= 1024);
grant select, update (google_event_id) on table public.bookings to service_role;
