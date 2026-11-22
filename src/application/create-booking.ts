import {
  BookingError,
  isServiceType,
  MAX_ACTIVE_BOOKINGS_PER_CONTACT,
  MAX_NOTES_LENGTH,
  type Booking,
  type ServiceType,
} from "@/domain/entities/Booking";
import { countActiveBookings } from "@/domain/services/booking-limits";
import { parseISODate, shopNow } from "@/domain/services/scheduling";
import { createContactInfo, type ContactInfo } from "@/domain/value-objects/ContactInfo";
import { isTimeSlot, type TimeSlot } from "@/domain/value-objects/TimeSlot";
import { makeGetAvailableSlots, type SchedulingDeps } from "./get-available-slots";

/** Entrada sin confiar (p. ej. desde un formulario / Server Action). */
export interface CreateBookingInput {
  service: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
  notes?: string;
}

export interface ParsedBookingInput {
  service: ServiceType;
  date: string;
  time: TimeSlot;
  contact: ContactInfo;
  notes: string;
}

/** Valida y normaliza la entrada; lanza BookingError / InvalidContactInfoError. */
export function parseBookingInput(input: CreateBookingInput): ParsedBookingInput {
  if (!isServiceType(input.service)) throw new BookingError("INVALID_SERVICE");
  if (!parseISODate(input.date)) throw new BookingError("INVALID_DATE");
  if (!isTimeSlot(input.time)) throw new BookingError("INVALID_TIME");
  const contact = createContactInfo(input);
  const notes = input.notes?.trim() ?? "";
  if (notes.length > MAX_NOTES_LENGTH) throw new BookingError("INVALID_NOTES");
  return { service: input.service, date: input.date, time: input.time, contact, notes };
}

export function makeCreateBooking(deps: SchedulingDeps) {
  const getAvailableSlots = makeGetAvailableSlots(deps);
  const now = deps.now ?? (() => new Date());

  return async function createBooking(raw: CreateBookingInput): Promise<Booking> {
    const input = parseBookingInput(raw);
    const { contact, notes } = input;

    const today = shopNow(now(), deps.schedule.timeZone);
    const upcoming = await deps.repo.findUpcomingContacts(today.date);
    if (countActiveBookings(upcoming, contact, today) >= MAX_ACTIVE_BOOKINGS_PER_CONTACT) {
      throw new BookingError("TOO_MANY_ACTIVE_BOOKINGS");
    }

    const slots = await getAvailableSlots({ date: input.date, service: input.service });
    if (!slots.includes(input.time)) throw new BookingError("SLOT_UNAVAILABLE");

    return deps.repo.create({
      service: input.service,
      date: input.date,
      time: input.time,
      durationMin: deps.schedule.serviceDuration[input.service],
      contact,
      notes,
    });
  };
}
