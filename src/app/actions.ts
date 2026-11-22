"use server";

import { after } from "next/server";
import { makeCreateBooking, type CreateBookingInput } from "@/application/create-booking";
import { makeGetAvailableSlots } from "@/application/get-available-slots";
import { makeSubmitBooking, SubmissionError, type SubmitBookingInput } from "@/application/submit-booking";
import { BookingError, isServiceType, type Booking, type BookingErrorCode, type ServiceType } from "@/domain/entities/Booking";
import { InvalidContactInfoError } from "@/domain/value-objects/ContactInfo";
import type { TimeSlot } from "@/domain/value-objects/TimeSlot";
import { SHOP_SCHEDULE, SHOP_TIMEZONE } from "@/infrastructure/config/shop";
import { resendEnv } from "@/infrastructure/email/resend";
import { ResendBookingNotifier } from "@/infrastructure/email/ResendBookingNotifier";
import { ResendCustomerNotifier } from "@/infrastructure/email/ResendCustomerNotifier";
import { GoogleCalendarConnectionRepo } from "@/infrastructure/google/GoogleCalendarConnection";
import { GoogleCalendarSync } from "@/infrastructure/google/GoogleCalendarSync";
import { isGoogleConfigured } from "@/infrastructure/google/oauth";
import { allowBookingForContact, allowBookingFromIp, allowSlotsQuery, clientIp } from "@/infrastructure/security/rate-limit";
import { SupabaseRateLimiter } from "@/infrastructure/security/SupabaseRateLimiter";
import { TurnstileVerifier } from "@/infrastructure/security/TurnstileVerifier";
import { createAnonClient } from "@/infrastructure/supabase/anon";
import { createServiceClient } from "@/infrastructure/supabase/service";
import { SupabaseAvailabilityRepository } from "@/infrastructure/supabase/SupabaseAvailabilityRepository";
import { SupabaseBookingRepository } from "@/infrastructure/supabase/SupabaseBookingRepository";

export type ActionErrorCode = BookingErrorCode | "INVALID_CONTACT" | "CAPTCHA_FAILED" | "RATE_LIMITED" | "UNKNOWN";
export type ActionResult<T> = ({ ok: true } & T) | { ok: false; code: ActionErrorCode; message: string };

const MESSAGES: Record<ActionErrorCode, string> = {
  SLOT_UNAVAILABLE: "Ese horario ya no está disponible. Elige otro, por favor.",
  INVALID_SERVICE: "El servicio elegido no es válido.",
  INVALID_DATE: "La fecha elegida no es válida.",
  INVALID_TIME: "La hora elegida no es válida.",
  INVALID_NOTES: "Las notas son demasiado largas (máximo 1000 caracteres).",
  INVALID_CONTACT: "Revisa tu nombre, teléfono y correo.",
  TOO_MANY_ACTIVE_BOOKINGS: "Ya tienes citas pendientes con estos datos. Si necesitas otra, escríbenos por WhatsApp.",
  CAPTCHA_FAILED: "No pudimos verificar que eres una persona. Vuelve a intentarlo.",
  RATE_LIMITED: "Demasiados intentos. Espera un momento y vuelve a intentarlo.",
  UNKNOWN: "No pudimos completar la operación. Inténtalo de nuevo en unos minutos.",
};

function deps() {
  // Lecturas públicas (horarios ocupados, disponibilidad) como visitante anónimo, aunque el navegador
  // tenga una sesión de admin. Escrituras y datos de contacto solo con service_role: la base ya no
  // deja insertar citas a anon (0006), así nadie se salta el CAPTCHA y los límites con la anon key.
  // createServiceClient lanza si falta SUPABASE_SERVICE_ROLE_KEY.
  const anon = createAnonClient();
  const service = createServiceClient();
  const calendar = isGoogleConfigured() ? new GoogleCalendarSync(new GoogleCalendarConnectionRepo(service), SHOP_TIMEZONE) : undefined;
  return {
    repo: new SupabaseBookingRepository(anon, service),
    availability: new SupabaseAvailabilityRepository(anon),
    schedule: SHOP_SCHEDULE,
    calendar,
    service,
    limiter: new SupabaseRateLimiter(service),
  };
}

function fail(e: unknown): { ok: false; code: ActionErrorCode; message: string } {
  let code: ActionErrorCode = "UNKNOWN";
  if (e instanceof BookingError) code = e.code;
  else if (e instanceof InvalidContactInfoError) code = "INVALID_CONTACT";
  else if (e instanceof SubmissionError) code = e.code === "SPAM" ? "UNKNOWN" : e.code;
  // Solo errores inesperados al log; sin datos del cliente.
  if (code === "UNKNOWN" && !(e instanceof SubmissionError)) console.error("[booking action]", e);
  return { ok: false, code, message: MESSAGES[code] };
}

/** Los argumentos llegan del cliente: no confiamos en sus tipos. */
const str = (v: unknown) => (typeof v === "string" ? v : "");
const num = (v: unknown) => (typeof v === "number" ? v : NaN);

export async function getAvailableSlotsAction(input: {
  date: string;
  service: ServiceType;
}): Promise<ActionResult<{ slots: TimeSlot[] }>> {
  try {
    const d = deps();
    if (!(await allowSlotsQuery(d.limiter, await clientIp()))) throw new SubmissionError("RATE_LIMITED");
    const getAvailableSlots = makeGetAvailableSlots(d);
    const service = str(input?.service);
    if (!isServiceType(service)) throw new BookingError("INVALID_SERVICE");
    return { ok: true, slots: await getAvailableSlots({ date: str(input?.date), service }) };
  } catch (e) {
    return fail(e);
  }
}

export type CreateBookingActionInput = CreateBookingInput & Pick<SubmitBookingInput, "captchaToken" | "website" | "elapsedMs">;

export async function createBookingAction(input: CreateBookingActionInput): Promise<ActionResult<{ id: string }>> {
  try {
    const d = deps();
    const submitBooking = makeSubmitBooking({
      createBooking: makeCreateBooking(d),
      verifier: new TurnstileVerifier(),
      limits: {
        ip: (ip) => allowBookingFromIp(d.limiter, ip),
        contact: (c) => allowBookingForContact(d.limiter, c),
      },
    });
    const res = await submitBooking(
      {
        service: str(input?.service),
        date: str(input?.date),
        time: str(input?.time),
        name: str(input?.name),
        phone: str(input?.phone),
        email: str(input?.email),
        notes: str(input?.notes),
        captchaToken: str(input?.captchaToken),
        website: str(input?.website),
        elapsedMs: num(input?.elapsedMs),
      },
      { ip: await clientIp() },
    );
    if (res.status === "ignored") return { ok: true, id: crypto.randomUUID() };
    afterBookingCreated(res.booking, d);
    return { ok: true, id: res.booking.id };
  } catch (e) {
    return fail(e);
  }
}

/**
 * Correos (admin y cliente) y evento de Google se hacen después de responder: la cita ya está guardada
 * y un fallo externo no debe afectar al cliente (queda en los logs / en el panel).
 */
function afterBookingCreated(booking: Booking, { calendar, service }: ReturnType<typeof deps>) {
  const mail = resendEnv();
  if (mail) {
    after(async () => {
      try {
        await new ResendBookingNotifier(mail).bookingCreated(booking);
      } catch (e) {
        console.error("[booking email]", e);
      }
    });
    after(async () => {
      try {
        await new ResendCustomerNotifier(mail).bookingConfirmed(booking);
      } catch (e) {
        console.error("[customer email]", e);
      }
    });
  }
  if (calendar) {
    after(async () => {
      try {
        const eventId = await calendar.createEvent(booking);
        if (eventId) await service.from("bookings").update({ google_event_id: eventId }).eq("id", booking.id);
      } catch (e) {
        console.error("[google event]", e);
      }
    });
  }
}
