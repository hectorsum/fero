import type { Booking } from "@/domain/entities/Booking";
import type { CustomerNotifier } from "@/domain/repositories/CustomerNotifier";
import { BARBER_EMAIL } from "@/infrastructure/config/shop";
import { isResendTestSender, sendEmail, type ResendEnv } from "./resend";
import { customerConfirmationEmail } from "./templates/customer-confirmation";

/** Correo de confirmación al cliente. */
export class ResendCustomerNotifier implements CustomerNotifier {
  constructor(private readonly env: Pick<ResendEnv, "apiKey" | "from">) {}

  async bookingConfirmed(b: Booking): Promise<void> {
    if (isResendTestSender(this.env.from)) {
      console.warn(
        "[customer email] NOTIFY_FROM usa el remitente de prueba de Resend, que solo puede escribir al dueño de la cuenta: " +
          "no se envía la confirmación al cliente. Verifica el dominio en Resend y configura NOTIFY_FROM.",
      );
      return;
    }
    await sendEmail(this.env, {
      ...customerConfirmationEmail(b),
      to: b.contact.email,
      replyTo: BARBER_EMAIL,
      idempotencyKey: `booking-customer-${b.id}`,
    });
  }
}
