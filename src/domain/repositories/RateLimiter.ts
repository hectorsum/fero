/** Limitador de ventana fija. */
export interface RateLimiter {
  /** Registra un uso de `key` y devuelve los segundos de espera si se superó `max` en la ventana (0 = permitido). */
  consume(key: string, max: number, windowSeconds: number): Promise<number>;
}
