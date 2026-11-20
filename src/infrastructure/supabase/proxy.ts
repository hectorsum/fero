import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";
import { supabaseEnv } from "./env";

/**
 * Refresca la sesión de Supabase (cookies) en el proxy y dice si quien navega es admin.
 * Patrón de @supabase/ssr: las cookies se copian a la request y a la respuesta.
 */
export async function updateSession(request: NextRequest) {
  const { url, anonKey } = supabaseEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getUser consulta a Supabase Auth: detecta sesiones cerradas o revocadas aunque el JWT siga
  // firmado y sin expirar. Debe ser la misma verificación que hace la página (requireAdmin);
  // si el proxy fuera más permisivo, /login → /admin → /login entraría en un bucle.
  const { data } = await supabase.auth.getUser();
  let isAdmin = false;
  if (data?.user) {
    const { data: admin } = await supabase.rpc("is_admin");
    isAdmin = admin === true;
  }

  return { response: () => response, isAdmin };
}
