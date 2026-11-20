import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getAdmin } from "@/infrastructure/auth/session";
import { GoogleCalendarConnectionRepo } from "@/infrastructure/google/GoogleCalendarConnection";
import { exchangeCode, fetchEmail, OAUTH_COOKIE } from "@/infrastructure/google/oauth";
import { createServiceClient } from "@/infrastructure/supabase/service";

const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/** Vuelta del OAuth de Google: valida state, canjea el código y guarda el refresh token cifrado. */
export async function GET(request: NextRequest) {
  const done = (q: string) => {
    const res = NextResponse.redirect(new URL(`/admin?google=${q}`, request.url));
    res.cookies.set(OAUTH_COOKIE, "", { path: "/admin/google", maxAge: 0 });
    return res;
  };

  const admin = await getAdmin();
  if (!admin) return NextResponse.redirect(new URL("/login", request.url));

  const params = request.nextUrl.searchParams;
  if (params.get("error")) return done("denied");

  const [cookieState, verifier] = (request.cookies.get(OAUTH_COOKIE)?.value ?? "").split(".");
  const state = params.get("state") ?? "";
  const code = params.get("code") ?? "";
  if (!cookieState || !verifier || !same(cookieState, state) || !code || code.length > 2048) return done("invalid");

  try {
    const redirectUri = new URL("/admin/google/callback", request.nextUrl.origin).toString();
    const tokens = await exchangeCode({ code, verifier, redirectUri });
    if (!tokens.hasCalendarScopes) return done("scopes");
    if (!tokens.refreshToken) return done("no_refresh");
    const email = await fetchEmail(tokens.accessToken);
    await new GoogleCalendarConnectionRepo(createServiceClient()).save({ email, refreshToken: tokens.refreshToken, userId: admin.user.id });
    return done("connected");
  } catch (e) {
    console.error("[google callback]", e);
    return done("error");
  }
}
