import { BookingError, isServiceType, MAX_NOTES_LENGTH, type Booking } from "@/domain/entities/Booking";
import { parseISODate } from "@/domain/services/scheduling";
import { createContactInfo } from "@/domain/value-objects/ContactInfo";
import { isTimeSlot } from "@/domain/value-objects/TimeSlot";
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

export function makeCreateBooking(deps: SchedulingDeps) {
  const getAvailableSlots = makeGetAvailableSlots(deps);

  return async function createBooking(input: CreateBookingInput): Promise<Booking> {
    if (!isServiceType(input.service)) throw new BookingError("INVALID_SERVICE");
    if (!parseISODate(input.date)) throw new BookingError("INVALID_DATE");
    if (!isTimeSlot(input.time)) throw new BookingError("INVALID_TIME");
    const contact = createContactInfo(input);
    const notes = input.notes?.trim() ?? "";
    if (notes.length > MAX_NOTES_LENGTH) throw new BookingError("INVALID_NOTES");

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
