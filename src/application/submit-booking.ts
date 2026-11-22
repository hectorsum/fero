import type { Booking } from "@/domain/entities/Booking";
import type { HumanVerifier } from "@/domain/repositories/HumanVerifier";
import type { ContactInfo } from "@/domain/value-objects/ContactInfo";
import { parseBookingInput, type CreateBookingInput } from "./create-booking";

/** Tiempo mínimo entre abrir el asistente y confirmar: un humano no lo hace en menos. */
export const MIN_ELAPSED_MS = 3000;

export interface SubmitBookingInput extends CreateBookingInput {
  /** Token de un solo uso del CAPTCHA. */
  captchaToken: string;
  /** Honeypot: campo oculto que una persona deja vacío. */
  website: string;
  /** Milisegundos desde que se abrió el asistente. */
  elapsedMs: number;
}

export type SubmissionErrorCode = "SPAM" | "RATE_LIMITED" | "CAPTCHA_FAILED";

export class SubmissionError extends Error {
  constructor(readonly code: SubmissionErrorCode) {
    super(code);
    this.name = "SubmissionError";
  }
}

export interface SubmitBookingDeps {
  createBooking: (input: CreateBookingInput) => Promise<Booking>;
  verifier: HumanVerifier;
  limits: {
    /** false si la IP superó su límite de reservas. */
    ip(ip: string): Promise<boolean>;
    /** false si el teléfono o el correo superaron su límite de reservas. */
    contact(contact: ContactInfo): Promise<boolean>;
  };
}

export type SubmitBookingResult = { status: "created"; booking: Booking } | { status: "ignored" };

/**
 * Filtros anti-spam antes de crear la cita, del más barato al más caro:
 * honeypot/tiempo → límite por IP → CAPTCHA → validación → límites por teléfono/correo → caso de uso.
 */
export function makeSubmitBooking({ createBooking, verifier, limits }: SubmitBookingDeps) {
  return async function submitBooking(input: SubmitBookingInput, ctx: { ip: string }): Promise<SubmitBookingResult> {
    // Un bot que rellena el honeypot recibe "ok" para que no sepa que fue descartado.
    if (input.website.trim() !== "") return { status: "ignored" };
    if (!Number.isFinite(input.elapsedMs) || input.elapsedMs < MIN_ELAPSED_MS) throw new SubmissionError("SPAM");

    if (!(await limits.ip(ctx.ip))) throw new SubmissionError("RATE_LIMITED");
    if (!(await verifier.verify(input.captchaToken, ctx.ip))) throw new SubmissionError("CAPTCHA_FAILED");

    const { contact } = parseBookingInput(input);
    if (!(await limits.contact(contact))) throw new SubmissionError("RATE_LIMITED");

    return { status: "created", booking: await createBooking(input) };
  };
}
