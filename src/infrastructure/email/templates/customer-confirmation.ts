import type { Booking } from "@/domain/entities/Booking";
import { BARBER_WHATSAPP, SHOP_ADDRESS, SHOP_PHONE, serviceName } from "@/infrastructure/config/shop";
import { escapeHtml, formatDate, htmlRows, oneLine, type EmailContent } from "./shared";

export const mapsUrl = (address: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
export const whatsappUrl = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "")}`;

const CANCEL_TEXT = "Si necesitas cancelar o reprogramar, avísanos por WhatsApp con anticipación";

/** Confirmación al cliente. Fecha y hora ya son locales de Lima (así se guardan). */
export function customerConfirmationEmail(b: Booking): EmailContent {
  const when = `${formatDate(b.date)}, ${b.time}`;
  const maps = mapsUrl(SHOP_ADDRESS);
  const wa = whatsappUrl(BARBER_WHATSAPP);
  const rows: [string, string][] = [
    ["Servicio", serviceName(b.service)],
    ["Fecha", formatDate(b.date)],
    ["Hora", b.time],
    ["Duración", `${b.durationMin} min`],
    ["Dirección", SHOP_ADDRESS],
    ["Teléfono", SHOP_PHONE],
  ];
  const a = (href: string, label: string) => `<a href="${escapeHtml(href)}" style="color:#5a6b00">${escapeHtml(label)}</a>`;

  return {
    subject: oneLine(`Tu cita en FERO — ${when}`),
    text: [
      `Hola, ${b.contact.name}:`,
      "",
      "Tu cita en FERO quedó confirmada.",
      "",
      ...rows.map(([k, v]) => `${k}: ${v}`),
      `Cómo llegar: ${maps}`,
      "",
      `${CANCEL_TEXT}: ${wa}`,
      "",
      "¡Te esperamos!",
      "FERO",
    ].join("\n"),
    html: `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#1a1a1a">
<p style="margin:0 0 12px">Hola, ${escapeHtml(b.contact.name)}:</p>
<p style="margin:0 0 16px">Tu cita en <strong>FERO</strong> quedó confirmada.</p>
${htmlRows(rows)}
<p style="margin:16px 0 0">${a(maps, "Ver cómo llegar en Google Maps")}</p>
<p style="margin:16px 0 0">${a(wa, CANCEL_TEXT)}.</p>
<p style="margin:16px 0 0">¡Te esperamos!<br>FERO</p></div>`,
  };
}
