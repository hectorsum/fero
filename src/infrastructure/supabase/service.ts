import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { supabaseEnv } from "./env";

/**
 * Cliente con la service role key: salta RLS. SOLO para código de servidor que ya validó permisos
 * (o que no expone datos al cliente), como leer la conexión de Google Calendar.
 * La clave nunca debe llevar el prefijo NEXT_PUBLIC_.
 */
export function createServiceClient() {
  const { url } = supabaseEnv();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY (ver .env.example).");
  return createClient<Database>(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
