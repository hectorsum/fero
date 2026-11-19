import type { ContactInfo } from "../value-objects/ContactInfo";
import type { TimeSlot } from "../value-objects/TimeSlot";

export type BookingMode = "corte" | "tatuaje";

export const SERVICE_TYPES = ["completo", "barba", "corte"] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const isServiceType = (v: string): v is ServiceType => (SERVICE_TYPES as readonly string[]).includes(v);

export interface Booking {
  id: string;
  service: ServiceType;
  /** Fecha local "YYYY-MM-DD". */
  date: string;
  time: TimeSlot;
  durationMin: number;
  contact: ContactInfo;
  notes: string;
  createdAt: Date;
}

export type NewBooking = Omit<Booking, "id" | "createdAt">;

export type BookingErrorCode = "INVALID_SERVICE" | "INVALID_DATE" | "INVALID_TIME" | "SLOT_UNAVAILABLE";

export class BookingError extends Error {
  constructor(readonly code: BookingErrorCode, message: string = code) {
    super(message);
    this.name = "BookingError";
  }
}
