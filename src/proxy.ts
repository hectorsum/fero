import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/infrastructure/supabase/proxy";

/**
 * Validación optimista de rutas:
 *  - /admin sin sesión de admin → /login
 *  - /login con sesión de admin → /admin
 * La autorización real se repite en el layout de /admin, en cada Server Action y en RLS.
 */
export async function proxy(request: NextRequest) {
  const { response, isAdmin } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const redirect = (to: string) => {
    const res = NextResponse.redirect(new URL(to, request.url));
    // Conserva las cookies de sesión refrescadas.
    response().cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  if (pathname.startsWith("/admin") && !isAdmin) return redirect("/login");
  if (pathname === "/login" && isAdmin) return redirect("/admin");

  const res = response();
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
