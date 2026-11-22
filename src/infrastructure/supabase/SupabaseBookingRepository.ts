import type { SupabaseClient } from "@supabase/supabase-js";
import { BookingError, type BookedSlot, type Booking, type NewBooking } from "@/domain/entities/Booking";
import type { BookingRepository, UpcomingBookingContact } from "@/domain/repositories/BookingRepository";
import type { Database } from "./database.types";

/** unique_violation y exclusion_violation: el horario ya está tomado. */
const SLOT_TAKEN_CODES = new Set(["23505", "23P01"]);

/** Postgres devuelve "HH:MM:SS"; el dominio usa "HH:MM". */
const toSlot = (time: string) => time.slice(0, 5);

/** Tope de filas al revisar citas futuras por contacto (una barbería tiene muchas menos). */
const MAX_UPCOMING_ROWS = 5000;

export class SupabaseBookingRepository implements BookingRepository {
  /**
   * @param anon   cliente anónimo: solo lecturas públicas (get_booked_slots).
   * @param server cliente service_role: crear citas y leer contactos. Nunca llega al navegador.
   */
  constructor(
    private readonly anon: SupabaseClient<Database>,
    private readonly server: SupabaseClient<Database>,
  ) {}

  async create(b: NewBooking): Promise<Booking> {
    // Generamos el id aquí para no depender de leer la fila tras el insert.
    const id = crypto.randomUUID();
    const { error } = await this.server.from("bookings").insert({
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
    const { data, error } = await this.anon.rpc("get_booked_slots", { p_date: date });
    if (error) throw new Error(`Supabase get_booked_slots: ${error.code} ${error.message}`);
    return data.map((r) => ({ date: r.date, time: toSlot(r.time), durationMin: r.duration_min }));
  }

  async findUpcomingContacts(fromDate: string): Promise<UpcomingBookingContact[]> {
    const { data, error } = await this.server
      .from("bookings")
      .select("date, time, phone, email")
      .eq("status", "confirmed")
      .gte("date", fromDate)
      .limit(MAX_UPCOMING_ROWS);
    if (error) throw new Error(`Supabase select bookings: ${error.code} ${error.message}`);
    return data.map((r) => ({ date: r.date, time: toSlot(r.time), phone: r.phone, email: r.email }));
  }
}
