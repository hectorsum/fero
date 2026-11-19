import { createBrowserClient as createSsrBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { supabaseEnv } from "./env";

/**
 * Cliente para el navegador. Hoy la app accede a Supabase solo desde Server Actions
 * (ver ./server.ts); este cliente queda disponible para futuras lecturas públicas.
 */
export function createBrowserClient() {
  const { url, anonKey } = supabaseEnv();
  return createSsrBrowserClient<Database>(url, anonKey);
}
