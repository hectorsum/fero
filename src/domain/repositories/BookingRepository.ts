import type { BookedSlot, Booking, NewBooking } from "../entities/Booking";
import type { ContactInfo } from "../value-objects/ContactInfo";

/** Cita confirmada con los datos justos para aplicar límites por contacto. */
export type UpcomingBookingContact = Pick<Booking, "date" | "time"> & Pick<ContactInfo, "phone" | "email">;

export interface BookingRepository {
  create(booking: NewBooking): Promise<Booking>;
  /** Horarios ocupados (citas confirmadas) de una fecha local "YYYY-MM-DD". */
  findByDate(date: string): Promise<BookedSlot[]>;
  /** Citas confirmadas desde la fecha local "YYYY-MM-DD" (incluida). Solo para uso del servidor. */
  findUpcomingContacts(fromDate: string): Promise<UpcomingBookingContact[]>;
}
