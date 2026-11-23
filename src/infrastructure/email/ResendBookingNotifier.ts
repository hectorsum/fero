import type { Booking } from "@/domain/entities/Booking";
import type { BookingNotifier } from "@/domain/repositories/BookingNotifier";
import { sendEmail, type ResendEnv } from "./resend";
import { adminBookingEmail } from "./templates/admin-booking";

/** Aviso al admin (NOTIFY_EMAIL) de cada cita nueva. */
export class ResendBookingNotifier implements BookingNotifier {
  constructor(private readonly env: ResendEnv) {}

  async bookingCreated(b: Booking): Promise<void> {
    await sendEmail(this.env, { ...(await adminBookingEmail(b)), to: this.env.to, replyTo: b.contact.email, idempotencyKey: `booking-${b.id}` });
  }
}
