import type { HumanVerifier } from "@/domain/repositories/HumanVerifier";

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
/** Los tokens de Turnstile miden como mucho 2048 caracteres. */
const MAX_TOKEN_LENGTH = 2048;

/**
 * Cloudflare Turnstile. Falla cerrado: sin clave secreta en producción, o si Cloudflare no responde,
 * rechaza. Solo en desarrollo y sin clave deja pasar (con un aviso).
 */
export class TurnstileVerifier implements HumanVerifier {
  constructor(
    private readonly secret: string | undefined = process.env.TURNSTILE_SECRET_KEY,
    private readonly production: boolean = process.env.NODE_ENV === "production",
  ) {}

  async verify(token: string, ip: string): Promise<boolean> {
    if (!this.secret) {
      if (this.production) {
        console.error("[turnstile] Falta TURNSTILE_SECRET_KEY: se rechazan todas las reservas.");
        return false;
      }
      console.warn("[turnstile] Sin TURNSTILE_SECRET_KEY: verificación omitida (solo en desarrollo).");
      return true;
    }
    if (!token || token.length > MAX_TOKEN_LENGTH) return false;

    const body = new URLSearchParams({ secret: this.secret, response: token });
    if (ip && ip !== "unknown") body.set("remoteip", ip);
    try {
      const res = await fetch(SITEVERIFY, { method: "POST", body, cache: "no-store", signal: AbortSignal.timeout(5000) });
      const json = (await res.json().catch(() => ({}))) as { success?: unknown; "error-codes"?: unknown };
      if (json.success === true) return true;
      console.warn("[turnstile] token rechazado", json["error-codes"]);
      return false;
    } catch (e) {
      console.error("[turnstile] no se pudo verificar", e);
      return false;
    }
  }
}
