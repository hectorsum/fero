import type { RateLimiter } from "@/domain/repositories/RateLimiter";

/** Limitador en memoria con la misma semántica que consume_rate_limit (ventana fija). Para tests. */
export class MemoryRateLimiter implements RateLimiter {
  private readonly windows = new Map<string, { start: number; count: number }>();

  constructor(private readonly now: () => number = Date.now) {}

  async consume(key: string, max: number, windowSeconds: number): Promise<number> {
    const t = this.now();
    const windowMs = windowSeconds * 1000;
    const w = this.windows.get(key);
    const cur = !w || w.start + windowMs <= t ? { start: t, count: 1 } : { start: w.start, count: w.count + 1 };
    this.windows.set(key, cur);
    return cur.count > max ? Math.max(1, Math.ceil((cur.start + windowMs - t) / 1000)) : 0;
  }
}
