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

  // getClaims valida la firma del JWT (no basta con leer la cookie).
  const { data } = await supabase.auth.getClaims();
  let isAdmin = false;
  if (data?.claims?.sub) {
    const { data: admin } = await supabase.rpc("is_admin");
    isAdmin = admin === true;
  }

  return { response: () => response, isAdmin };
}
