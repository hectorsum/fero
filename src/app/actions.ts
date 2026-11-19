"use server";

import { makeCreateBooking, type CreateBookingInput } from "@/application/create-booking";
import { makeGetAvailableSlots } from "@/application/get-available-slots";
import { BookingError, isServiceType, type BookingErrorCode, type ServiceType } from "@/domain/entities/Booking";
import { InvalidContactInfoError } from "@/domain/value-objects/ContactInfo";
import type { TimeSlot } from "@/domain/value-objects/TimeSlot";
import { SHOP_SCHEDULE } from "@/infrastructure/config/shop";
import { createServerClient } from "@/infrastructure/supabase/server";
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
  return { repo: new SupabaseBookingRepository(await createServerClient()), schedule: SHOP_SCHEDULE };
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
    const createBooking = makeCreateBooking(await deps());
    const booking = await createBooking({
      service: str(input?.service),
      date: str(input?.date),
      time: str(input?.time),
      name: str(input?.name),
      phone: str(input?.phone),
      email: str(input?.email),
      notes: str(input?.notes),
    });
    return { ok: true, id: booking.id };
  } catch (e) {
    return fail(e);
  }
}
