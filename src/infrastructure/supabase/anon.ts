import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { supabaseEnv } from "./env";

/**
 * Cliente anónimo sin cookies: actúa siempre como visitante (rol anon), aunque el navegador
 * tenga una sesión de admin abierta. Para el flujo público de reservas, cuyos permisos
 * (RLS / grants) están pensados para anon.
 */
export function createAnonClient() {
  const { url, anonKey } = supabaseEnv();
  return createClient<Database>(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
}
