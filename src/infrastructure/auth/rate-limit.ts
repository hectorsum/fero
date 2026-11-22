import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/infrastructure/supabase/database.types";
import { clientIp, hashKey } from "@/infrastructure/security/rate-limit";

export { clientIp };

export const LOGIN_WINDOW_SECONDS = 15 * 60;
/** Intentos por IP + correo en la ventana (frena fuerza bruta contra una cuenta). */
export const LOGIN_MAX_PER_ACCOUNT = 5;
/** Intentos por IP en la ventana, con cualquier correo (frena barridos de cuentas). */
export const LOGIN_MAX_PER_IP = 20;

/**
 * Consume un intento de login. Devuelve los segundos de espera si se superó algún límite (0 = permitido).
 * Si la base no responde, falla cerrado (no permite el intento).
 */
export async function consumeLoginAttempt(db: SupabaseClient<Database>, ip: string, email: string): Promise<number> {
  const checks = [
    { key: hashKey(`login:ip:${ip}`), max: LOGIN_MAX_PER_IP },
    { key: hashKey(`login:acct:${ip}:${email}`), max: LOGIN_MAX_PER_ACCOUNT },
  ];
  let wait = 0;
  for (const c of checks) {
    const { data, error } = await db.rpc("consume_login_attempt", { p_key: c.key, p_max: c.max, p_window_seconds: LOGIN_WINDOW_SECONDS });
    if (error) {
      console.error("[rate-limit]", error.code, error.message);
      return 60;
    }
    wait = Math.max(wait, data ?? 0);
  }
  return wait;
}
