import type { Booking } from "../entities/Booking";

/** Avisa al admin de una cita nueva (p. ej. por correo). */
export interface BookingNotifier {
  bookingCreated(booking: Booking): Promise<void>;
}
