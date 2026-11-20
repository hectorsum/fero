import { createHash, randomBytes } from "node:crypto";

/** Crear eventos + consultar disponibilidad; email para mostrar qué cuenta está conectada. */
export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.freebusy",
];

/** Cookie httpOnly con state + PKCE verifier durante el OAuth. */
export const OAUTH_COOKIE = "fero_google_oauth";

export function googleEnv() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

/** ¿Están todas las variables necesarias para la integración? */
export const isGoogleConfigured = () =>
  !!googleEnv() && !!process.env.GOOGLE_TOKEN_ENCRYPTION_KEY && !!process.env.SUPABASE_SERVICE_ROLE_KEY;

export class GoogleAuthError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "GoogleAuthError";
  }
}

const b64url = (b: Buffer) => b.toString("base64url");

/** state anti-CSRF + PKCE. */
export function newAuthRequest() {
  const state = b64url(randomBytes(32));
  const verifier = b64url(randomBytes(48));
  const challenge = b64url(createHash("sha256").update(verifier).digest());
  return { state, verifier, challenge };
}

export function authUrl(p: { clientId: string; redirectUri: string; state: string; challenge: string }) {
  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.search = new URLSearchParams({
    client_id: p.clientId,
    redirect_uri: p.redirectUri,
    response_type: "code",
    scope: GOOGLE_SCOPES.join(" "),
    access_type: "offline",
    // Fuerza a Google a devolver un refresh token aunque ya se haya autorizado antes.
    prompt: "consent",
    include_granted_scopes: "true",
    state: p.state,
    code_challenge: p.challenge,
    code_challenge_method: "S256",
  }).toString();
  return u.toString();
}

async function tokenRequest(body: Record<string, string>) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new GoogleAuthError(String(json.error ?? res.status), String(json.error_description ?? "token request failed"));
  return json;
}

export async function exchangeCode(p: { code: string; verifier: string; redirectUri: string }) {
  const env = googleEnv();
  if (!env) throw new GoogleAuthError("not_configured", "Google no está configurado.");
  const json = await tokenRequest({
    code: p.code,
    code_verifier: p.verifier,
    client_id: env.clientId,
    client_secret: env.clientSecret,
    redirect_uri: p.redirectUri,
    grant_type: "authorization_code",
  });
  const scopes = String(json.scope ?? "").split(" ");
  return {
    accessToken: String(json.access_token ?? ""),
    refreshToken: typeof json.refresh_token === "string" ? json.refresh_token : null,
    hasCalendarScopes: GOOGLE_SCOPES.filter((s) => s.includes("calendar")).every((s) => scopes.includes(s)),
  };
}

// Cache de access tokens por instancia (Fluid Compute reutiliza instancias). Clave = hash del refresh token.
const cache = new Map<string, { token: string; exp: number }>();

export async function accessTokenFor(refreshToken: string): Promise<string> {
  const k = createHash("sha256").update(refreshToken).digest("hex");
  const hit = cache.get(k);
  if (hit && hit.exp > Date.now() + 60_000) return hit.token;
  const env = googleEnv();
  if (!env) throw new GoogleAuthError("not_configured", "Google no está configurado.");
  const json = await tokenRequest({
    refresh_token: refreshToken,
    client_id: env.clientId,
    client_secret: env.clientSecret,
    grant_type: "refresh_token",
  });
  const token = String(json.access_token ?? "");
  cache.set(k, { token, exp: Date.now() + Number(json.expires_in ?? 3600) * 1000 });
  return token;
}

export async function revokeToken(token: string) {
  await fetch("https://oauth2.googleapis.com/revoke", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token }),
  }).catch(() => undefined);
}

/** Correo de la cuenta conectada (endpoint OpenID userinfo). */
export async function fetchEmail(accessToken: string): Promise<string> {
  const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) throw new GoogleAuthError("userinfo", `userinfo ${res.status}`);
  const json = (await res.json()) as { email?: unknown };
  return typeof json.email === "string" ? json.email.slice(0, 254) : "";
}
