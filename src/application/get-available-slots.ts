import { BookingError, type ServiceType } from "@/domain/entities/Booking";
import type { BookingRepository } from "@/domain/repositories/BookingRepository";
import { availableSlots, parseISODate, shopNow, type ShopSchedule } from "@/domain/services/scheduling";
import type { TimeSlot } from "@/domain/value-objects/TimeSlot";

export interface SchedulingDeps {
  repo: BookingRepository;
  schedule: ShopSchedule;
  now?: () => Date;
}

export function makeGetAvailableSlots({ repo, schedule, now = () => new Date() }: SchedulingDeps) {
  return async function getAvailableSlots(input: { date: string; service: ServiceType }): Promise<TimeSlot[]> {
    const durationMin = schedule.serviceDuration[input.service];
    if (durationMin === undefined) throw new BookingError("INVALID_SERVICE");
    if (!parseISODate(input.date)) throw new BookingError("INVALID_DATE");
    const booked = await repo.findByDate(input.date);
    return availableSlots({ schedule, date: input.date, durationMin, booked, now: shopNow(now(), schedule.timeZone) });
  };
}
