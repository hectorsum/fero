import { NextResponse, type NextRequest } from "next/server";
import { getAdmin } from "@/infrastructure/auth/session";
import { authUrl, googleEnv, isGoogleConfigured, newAuthRequest, OAUTH_COOKIE } from "@/infrastructure/google/oauth";

/** Inicia el OAuth de Google para el admin (state anti-CSRF + PKCE en cookie httpOnly). */
export async function GET(request: NextRequest) {
  const back = (q: string) => NextResponse.redirect(new URL(`/admin?google=${q}`, request.url));
  if (!(await getAdmin())) return NextResponse.redirect(new URL("/login", request.url));
  const env = googleEnv();
  if (!env || !isGoogleConfigured()) return back("not_configured");

  const { state, verifier, challenge } = newAuthRequest();
  const redirectUri = new URL("/admin/google/callback", request.nextUrl.origin).toString();
  const res = NextResponse.redirect(authUrl({ clientId: env.clientId, redirectUri, state, challenge }));
  res.cookies.set(OAUTH_COOKIE, `${state}.${verifier}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin/google",
    maxAge: 600,
  });
  return res;
}
