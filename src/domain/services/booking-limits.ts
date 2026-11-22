import type { UpcomingBookingContact } from "../repositories/BookingRepository";
import { emailKey, phoneKey, type ContactInfo } from "../value-objects/ContactInfo";
import { toMinutes } from "../value-objects/TimeSlot";
import type { ShopNow } from "./scheduling";

/** Citas aún no empezadas que comparten teléfono (por dígitos) o correo (sin mayúsculas) con `contact`. */
export function countActiveBookings(rows: UpcomingBookingContact[], contact: Pick<ContactInfo, "phone" | "email">, now: ShopNow): number {
  const phone = phoneKey(contact.phone);
  const email = emailKey(contact.email);
  return rows.filter((r) => {
    const future = r.date > now.date || (r.date === now.date && toMinutes(r.time) >= now.minutes);
    const same = (phone !== "" && phoneKey(r.phone) === phone) || emailKey(r.email) === email;
    return future && same;
  }).length;
}
