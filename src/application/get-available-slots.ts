import { BookingError, type ServiceType } from "@/domain/entities/Booking";
import type { AvailabilityRepository } from "@/domain/repositories/AvailabilityRepository";
import type { BookingRepository } from "@/domain/repositories/BookingRepository";
import type { CalendarSync } from "@/domain/repositories/CalendarSync";
import { availableSlots, openHoursForDate, parseISODate, shopNow, type ShopSchedule } from "@/domain/services/scheduling";
import type { TimeSlot } from "@/domain/value-objects/TimeSlot";

export interface SchedulingDeps {
  repo: BookingRepository;
  availability: AvailabilityRepository;
  schedule: ShopSchedule;
  /** Calendario externo cuyas horas ocupadas no se ofrecen. Si falla, se ignora (no bloquea la agenda). */
  calendar?: CalendarSync;
  now?: () => Date;
}

export function makeGetAvailableSlots({ repo, availability, schedule, calendar, now = () => new Date() }: SchedulingDeps) {
  return async function getAvailableSlots(input: { date: string; service: ServiceType }): Promise<TimeSlot[]> {
    const durationMin = schedule.serviceDuration[input.service];
    if (durationMin === undefined) throw new BookingError("INVALID_SERVICE");
    if (!parseISODate(input.date)) throw new BookingError("INVALID_DATE");
    const [av, booked, external] = await Promise.all([
      availability.get(),
      repo.findByDate(input.date),
      calendar?.busy(input.date).catch((e) => {
        console.error("[calendar busy]", e);
        return [];
      }) ?? [],
    ]);
    return availableSlots({
      hours: openHoursForDate(av, input.date, schedule.slotMinutes),
      slotMinutes: schedule.slotMinutes,
      date: input.date,
      durationMin,
      booked: [...booked, ...external],
      now: shopNow(now(), schedule.timeZone),
    });
  };
}
