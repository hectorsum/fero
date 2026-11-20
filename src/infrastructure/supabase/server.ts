import { createServerClient as createSsrServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { supabaseEnv } from "./env";

/** Cliente para Server Components / Server Actions. Separado de ./client.ts porque usa next/headers. */
export async function createServerClient() {
  // cookies() primero: marca la ruta como dinámica antes de cualquier error de configuración,
  // para que Next no intente pre-generar páginas que dependen de la sesión.
  const cookieStore = await cookies();
  const { url, anonKey } = supabaseEnv();
  return createSsrServerClient<Database>(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Llamado desde un Server Component: no se pueden escribir cookies. Sin auth, no aplica.
        }
      },
    },
  });
}
