"use server";

import { after } from "next/server";
import { makeCreateBooking, type CreateBookingInput } from "@/application/create-booking";
import { makeGetAvailableSlots } from "@/application/get-available-slots";
import { BookingError, isServiceType, type BookingErrorCode, type ServiceType } from "@/domain/entities/Booking";
import { InvalidContactInfoError } from "@/domain/value-objects/ContactInfo";
import type { TimeSlot } from "@/domain/value-objects/TimeSlot";
import { SHOP_SCHEDULE, SHOP_TIMEZONE } from "@/infrastructure/config/shop";
import { GoogleCalendarConnectionRepo } from "@/infrastructure/google/GoogleCalendarConnection";
import { GoogleCalendarSync } from "@/infrastructure/google/GoogleCalendarSync";
import { isGoogleConfigured } from "@/infrastructure/google/oauth";
import { ResendBookingNotifier, resendEnv } from "@/infrastructure/email/ResendBookingNotifier";
import { createServiceClient } from "@/infrastructure/supabase/service";
import { createAnonClient } from "@/infrastructure/supabase/anon";
import { SupabaseAvailabilityRepository } from "@/infrastructure/supabase/SupabaseAvailabilityRepository";
import { SupabaseBookingRepository } from "@/infrastructure/supabase/SupabaseBookingRepository";

export type ActionErrorCode = BookingErrorCode | "INVALID_CONTACT" | "UNKNOWN";
export type ActionResult<T> = ({ ok: true } & T) | { ok: false; code: ActionErrorCode; message: string };

const MESSAGES: Record<ActionErrorCode, string> = {
  SLOT_UNAVAILABLE: "Ese horario ya no está disponible. Elige otro, por favor.",
  INVALID_SERVICE: "El servicio elegido no es válido.",
  INVALID_DATE: "La fecha elegida no es válida.",
  INVALID_TIME: "La hora elegida no es válida.",
  INVALID_NOTES: "Las notas son demasiado largas (máximo 1000 caracteres).",
  INVALID_CONTACT: "Revisa tu nombre, teléfono y correo.",
  UNKNOWN: "No pudimos completar la operación. Inténtalo de nuevo en unos minutos.",
};

async function deps() {
  // Siempre como visitante anónimo: con la sesión de admin abierta, el rol sería authenticated
  // y la base (a propósito) solo deja crear citas a anon.
  const db = createAnonClient();
  // La conexión de Google solo es legible con service_role; las citas y la disponibilidad van con anon (RLS).
  const service = isGoogleConfigured() ? createServiceClient() : null;
  const calendar = service ? new GoogleCalendarSync(new GoogleCalendarConnectionRepo(service), SHOP_TIMEZONE) : undefined;
  return {
    repo: new SupabaseBookingRepository(db),
    availability: new SupabaseAvailabilityRepository(db),
    schedule: SHOP_SCHEDULE,
    calendar,
    service,
  };
}

function fail(e: unknown): { ok: false; code: ActionErrorCode; message: string } {
  const code: ActionErrorCode =
    e instanceof BookingError ? e.code : e instanceof InvalidContactInfoError ? "INVALID_CONTACT" : "UNKNOWN";
  if (code === "UNKNOWN") console.error("[booking action]", e);
  return { ok: false, code, message: MESSAGES[code] };
}

/** Los argumentos llegan del cliente: no confiamos en sus tipos. */
const str = (v: unknown) => (typeof v === "string" ? v : "");

export async function getAvailableSlotsAction(input: {
  date: string;
  service: ServiceType;
}): Promise<ActionResult<{ slots: TimeSlot[] }>> {
  try {
    const getAvailableSlots = makeGetAvailableSlots(await deps());
    const service = str(input?.service);
    if (!isServiceType(service)) throw new BookingError("INVALID_SERVICE");
    return { ok: true, slots: await getAvailableSlots({ date: str(input?.date), service }) };
  } catch (e) {
    return fail(e);
  }
}

export async function createBookingAction(input: CreateBookingInput): Promise<ActionResult<{ id: string }>> {
  try {
    const d = await deps();
    const createBooking = makeCreateBooking(d);
    const booking = await createBooking({
      service: str(input?.service),
      date: str(input?.date),
      time: str(input?.time),
      name: str(input?.name),
      phone: str(input?.phone),
      email: str(input?.email),
      notes: str(input?.notes),
    });
    // El aviso por correo y el evento en Google se crean después de responder: la cita ya está guardada y un fallo de Google
    // no debe afectar al cliente (queda registrado en el panel).
    const { calendar, service } = d;
    const mail = resendEnv();
    if (mail) {
      after(async () => {
        try {
          await new ResendBookingNotifier(mail).bookingCreated(booking);
        } catch (e) {
          console.error("[booking email]", e);
        }
      });
    }
    if (calendar && service) {
      after(async () => {
        try {
          const eventId = await calendar.createEvent(booking);
          if (eventId) await service.from("bookings").update({ google_event_id: eventId }).eq("id", booking.id);
        } catch (e) {
          console.error("[google event]", e);
        }
      });
    }
    return { ok: true, id: booking.id };
  } catch (e) {
    return fail(e);
  }
}

