import type { BookedSlot, Booking, NewBooking } from "../entities/Booking";

export interface BookingRepository {
  create(booking: NewBooking): Promise<Booking>;
  /** Horarios ocupados (citas confirmadas) de una fecha local "YYYY-MM-DD". */
  findByDate(date: string): Promise<BookedSlot[]>;
}
