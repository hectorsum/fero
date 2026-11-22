import type { Booking } from "@/domain/entities/Booking";
import { serviceName } from "@/infrastructure/config/shop";
import { formatDate, htmlRows, oneLine, type EmailContent } from "./shared";

/** Aviso al admin de una cita nueva. */
export function adminBookingEmail(b: Booking): EmailContent {
  const when = `${formatDate(b.date)}, ${b.time}`;
  const rows: [string, string][] = [
    ["Servicio", serviceName(b.service)],
    ["Fecha", when],
    ["Duración", `${b.durationMin} min`],
    ["Cliente", b.contact.name],
    ["Teléfono", b.contact.phone],
    ["Correo", b.contact.email],
    ...(b.notes ? ([["Notas", b.notes]] as [string, string][]) : []),
  ];
  return {
    subject: oneLine(`Nueva cita: ${b.contact.name} — ${when}`),
    text: [...rows.map(([k, v]) => `${k}: ${v}`), "", "Agendado desde la web de FERO."].join("\n"),
    html: `<div style="font-family:system-ui,sans-serif;font-size:15px;color:#1a1a1a">
<h2 style="margin:0 0 12px">Nueva cita</h2>
${htmlRows(rows)}
<p style="color:#888;font-size:13px;margin-top:16px">Agendado desde la web de FERO.</p></div>`,
  };
}
