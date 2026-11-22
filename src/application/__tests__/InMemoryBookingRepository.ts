import type { BookedSlot, Booking, NewBooking } from "@/domain/entities/Booking";
import type { BookingRepository, UpcomingBookingContact } from "@/domain/repositories/BookingRepository";

export class InMemoryBookingRepository implements BookingRepository {
  readonly items: Booking[] = [];
  private seq = 0;

  async create(b: NewBooking): Promise<Booking> {
    const booking = { ...b, id: String(++this.seq), createdAt: new Date() };
    this.items.push(booking);
    return booking;
  }

  async findByDate(date: string): Promise<BookedSlot[]> {
    return this.items.filter((b) => b.date === date).map(({ date, time, durationMin }) => ({ date, time, durationMin }));
  }

  async findUpcomingContacts(fromDate: string): Promise<UpcomingBookingContact[]> {
    return this.items.filter((b) => b.date >= fromDate).map((b) => ({ date: b.date, time: b.time, phone: b.contact.phone, email: b.contact.email }));
  }
}
