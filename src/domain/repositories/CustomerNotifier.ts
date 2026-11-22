import type { Booking } from "../entities/Booking";

/** Avisa al cliente de su cita (p. ej. correo de confirmación). */
export interface CustomerNotifier {
  bookingConfirmed(booking: Booking): Promise<void>;
}
