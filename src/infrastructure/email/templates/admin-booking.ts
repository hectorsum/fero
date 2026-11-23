import { render } from "@react-email/components";
import { createElement } from "react";
import type { Booking } from "@/domain/entities/Booking";
import { serviceName } from "@/infrastructure/config/shop";
import AdminBookingEmail, { type AdminBookingProps } from "./AdminBookingEmail";
import { emailAssetsUrl, formatDate, oneLine, type EmailContent } from "./shared";

/**
 * wa.me del cliente. Un celular peruano de 9 dígitos (empieza por 9) se completa con el 51;
 * otros números se usan tal cual si parecen internacionales, y si no, no se ofrece el botón.
 */
export function customerWhatsappUrl(phone: string): string | null {
  const d = phone.replace(/\D/g, "");
  if (/^9\d{8}$/.test(d)) return `https://wa.me/51${d}`;
  if (d.length >= 10 && d.length <= 15) return `https://wa.me/${d}`;
  return null;
}

export function adminBookingProps(b: Booking): AdminBookingProps {
  return {
    name: b.contact.name,
    phone: b.contact.phone,
    email: b.contact.email,
    service: serviceName(b.service),
    dateLabel: formatDate(b.date),
    time: b.time,
    durationMin: b.durationMin,
    notes: b.notes,
    customerWhatsappUrl: customerWhatsappUrl(b.contact.phone),
    assetsUrl: emailAssetsUrl(),
  };
}

/** Aviso al admin de una cita nueva. */
export async function adminBookingEmail(b: Booking): Promise<EmailContent> {
  const p = adminBookingProps(b);
  const when = `${p.dateLabel}, ${p.time}`;
  const rows: [string, string][] = [
    ["Servicio", p.service],
    ["Fecha", when],
    ["Duración", `${p.durationMin} min`],
    ["Cliente", p.name],
    ["Teléfono", p.phone],
    ["Correo", p.email],
    ...(p.notes ? ([["Notas", p.notes]] as [string, string][]) : []),
  ];
  return {
    subject: oneLine(`Nueva cita: ${p.name} — ${when}`),
    html: await render(createElement(AdminBookingEmail, p)),
    text: [...rows.map(([k, v]) => `${k}: ${v}`), "", "Agendado desde la web de FERO."].join("\n"),
  };
}
