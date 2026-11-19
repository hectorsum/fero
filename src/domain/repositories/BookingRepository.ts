import type { Booking, NewBooking } from "../entities/Booking";

export interface BookingRepository {
  create(booking: NewBooking): Promise<Booking>;
  /** Citas de una fecha local "YYYY-MM-DD". */
  findByDate(date: string): Promise<Booking[]>;
}
