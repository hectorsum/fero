import type { SupabaseClient } from "@supabase/supabase-js";
import type { RateLimiter } from "@/domain/repositories/RateLimiter";
import type { Database } from "@/infrastructure/supabase/database.types";

/** Espera que se impone si la base no responde: el limitador falla cerrado. */
const FAIL_CLOSED_SECONDS = 60;

/** Usa la RPC consume_rate_limit (solo service_role). */
export class SupabaseRateLimiter implements RateLimiter {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async consume(key: string, max: number, windowSeconds: number): Promise<number> {
    try {
      const { data, error } = await this.db.rpc("consume_rate_limit", { p_key: key, p_max: max, p_window_seconds: windowSeconds });
      if (error) {
        console.error("[rate-limit]", error.code, error.message);
        return FAIL_CLOSED_SECONDS;
      }
      return data ?? 0;
    } catch (e) {
      console.error("[rate-limit]", e);
      return FAIL_CLOSED_SECONDS;
    }
  }
}
