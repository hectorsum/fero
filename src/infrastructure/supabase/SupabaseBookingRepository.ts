import type { SupabaseClient } from "@supabase/supabase-js";
import { BookingError, type BookedSlot, type Booking, type NewBooking } from "@/domain/entities/Booking";
import type { BookingRepository } from "@/domain/repositories/BookingRepository";
import type { Database } from "./database.types";

/** unique_violation y exclusion_violation: el horario ya está tomado. */
const SLOT_TAKEN_CODES = new Set(["23505", "23P01"]);

/** Postgres devuelve "HH:MM:SS"; el dominio usa "HH:MM". */
const toSlot = (time: string) => time.slice(0, 5);

export class SupabaseBookingRepository implements BookingRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async create(b: NewBooking): Promise<Booking> {
    // El rol anónimo no puede leer la tabla (RLS), así que no usamos .select() tras el insert:
    // generamos el id aquí.
    const id = crypto.randomUUID();
    const { error } = await this.db.from("bookings").insert({
      id,
      name: b.contact.name,
      phone: b.contact.phone,
      email: b.contact.email,
      notes: b.notes,
      service: b.service,
      date: b.date,
      time: b.time,
      duration_min: b.durationMin,
    });
    if (error) {
      if (SLOT_TAKEN_CODES.has(error.code)) throw new BookingError("SLOT_UNAVAILABLE");
      throw new Error(`Supabase insert bookings: ${error.code} ${error.message}`);
    }
    return { ...b, id, createdAt: new Date() };
  }

  async findByDate(date: string): Promise<BookedSlot[]> {
    const { data, error } = await this.db.rpc("get_booked_slots", { p_date: date });
    if (error) throw new Error(`Supabase get_booked_slots: ${error.code} ${error.message}`);
    return data.map((r) => ({ date: r.date, time: toSlot(r.time), durationMin: r.duration_min }));
  }
}
