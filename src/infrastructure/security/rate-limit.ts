import { createHash } from "node:crypto";
import { headers } from "next/headers";
import type { RateLimiter } from "@/domain/repositories/RateLimiter";
import { emailKey, phoneKey, type ContactInfo } from "@/domain/value-objects/ContactInfo";

const HOUR = 60 * 60;
const DAY = 24 * HOUR;

/** Límites del flujo público de reservas. */
export const BOOKING_RATE_LIMITS = {
  /** Crear cita, por IP. */
  createPerIp: { max: 5, windowSeconds: HOUR },
  /** Crear cita, por teléfono (solo dígitos). */
  createPerPhone: { max: 3, windowSeconds: DAY },
  /** Crear cita, por correo (minúsculas). */
  createPerEmail: { max: 3, windowSeconds: DAY },
  /** Consultar horarios, por IP. */
  slotsPerIp: { max: 60, windowSeconds: 10 * 60 },
} as const;

/** Las claves se guardan hasheadas: la base nunca ve IPs, teléfonos ni correos en claro. */
export const hashKey = (s: string) => createHash("sha256").update(s).digest("hex");

/** IP del cliente. En Vercel x-forwarded-for la fija la plataforma; el primer valor es el cliente. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (fwd || h.get("x-real-ip") || "unknown").slice(0, 64);
}

async function allow(limiter: RateLimiter, key: string, limit: { max: number; windowSeconds: number }) {
  const wait = await limiter.consume(hashKey(key), limit.max, limit.windowSeconds);
  // Solo el tipo de límite (la parte antes del valor), nunca la IP, el teléfono ni el correo.
  if (wait > 0) console.warn(`[rate-limit] límite alcanzado: ${key.split(":").slice(0, 2).join(":")} (espera ${wait}s)`);
  return wait === 0;
}

export const allowBookingFromIp = (limiter: RateLimiter, ip: string) => allow(limiter, `booking:ip:${ip}`, BOOKING_RATE_LIMITS.createPerIp);

export async function allowBookingForContact(limiter: RateLimiter, contact: Pick<ContactInfo, "phone" | "email">) {
  // Se consumen ambos contadores aunque el primero ya falle, para no dar pistas por tiempos.
  const [phone, email] = await Promise.all([
    allow(limiter, `booking:phone:${phoneKey(contact.phone)}`, BOOKING_RATE_LIMITS.createPerPhone),
    allow(limiter, `booking:email:${emailKey(contact.email)}`, BOOKING_RATE_LIMITS.createPerEmail),
  ]);
  return phone && email;
}

export const allowSlotsQuery = (limiter: RateLimiter, ip: string) => allow(limiter, `slots:ip:${ip}`, BOOKING_RATE_LIMITS.slotsPerIp);
