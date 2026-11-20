import { createHash } from "node:crypto";
import { headers } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/infrastructure/supabase/database.types";

export const LOGIN_WINDOW_SECONDS = 15 * 60;
/** Intentos por IP + correo en la ventana (frena fuerza bruta contra una cuenta). */
export const LOGIN_MAX_PER_ACCOUNT = 5;
/** Intentos por IP en la ventana, con cualquier correo (frena barridos de cuentas). */
export const LOGIN_MAX_PER_IP = 20;

const hash = (s: string) => createHash("sha256").update(s).digest("hex");

/** IP del cliente. En Vercel x-forwarded-for la fija la plataforma; el primer valor es el cliente. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (fwd || h.get("x-real-ip") || "unknown").slice(0, 64);
}

/**
 * Consume un intento de login. Devuelve los segundos de espera si se superó algún límite (0 = permitido).
 * Si la base no responde, falla cerrado (no permite el intento).
 */
export async function consumeLoginAttempt(db: SupabaseClient<Database>, ip: string, email: string): Promise<number> {
  const checks = [
    { key: hash(`login:ip:${ip}`), max: LOGIN_MAX_PER_IP },
    { key: hash(`login:acct:${ip}:${email}`), max: LOGIN_MAX_PER_ACCOUNT },
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
