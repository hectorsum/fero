import type { Booking } from "@/domain/entities/Booking";
import type { BookingNotifier } from "@/domain/repositories/BookingNotifier";
import { serviceName } from "@/infrastructure/config/shop";

/** Remitente por defecto de Resend: sin dominio verificado solo puede enviar al correo de tu cuenta Resend. */
const DEFAULT_FROM = "FERO <onboarding@resend.dev>";

export function resendEnv() {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
  if (!apiKey || !to) return null;
  return { apiKey, to, from: process.env.NOTIFY_FROM || DEFAULT_FROM };
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** "sábado 22 de noviembre" a partir de "YYYY-MM-DD" (sin desfase de zona horaria). */
export const formatDate = (date: string) =>
  new Intl.DateTimeFormat("es-PE", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`),
  );

export function bookingEmail(b: Booking) {
  const service = serviceName(b.service);
  const when = `${formatDate(b.date)}, ${b.time}`;
  const rows: [string, string][] = [
    ["Servicio", service],
    ["Fecha", when],
    ["Duración", `${b.durationMin} min`],
    ["Cliente", b.contact.name],
    ["Teléfono", b.contact.phone],
    ["Correo", b.contact.email],
    ...(b.notes ? ([["Notas", b.notes]] as [string, string][]) : []),
  ];
  const subject = `Nueva cita: ${b.contact.name} — ${when}`.replace(/[\r\n]+/g, " ");
  const text = [...rows.map(([k, v]) => `${k}: ${v}`), "", "Agendado desde la web de FERO."].join("\n");
  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;color:#1a1a1a">
<h2 style="margin:0 0 12px">Nueva cita</h2>
<table cellpadding="6" style="border-collapse:collapse">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="color:#666;vertical-align:top">${k}</td><td style="white-space:pre-wrap">${escapeHtml(v)}</td></tr>`,
    )
    .join("")}</table>
<p style="color:#888;font-size:13px;margin-top:16px">Agendado desde la web de FERO.</p></div>`;
  return { subject, text, html };
}

export class ResendBookingNotifier implements BookingNotifier {
  constructor(private readonly env: { apiKey: string; to: string; from: string }) {}

  async bookingCreated(b: Booking): Promise<void> {
    const { subject, text, html } = bookingEmail(b);
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.env.apiKey}`,
        "Content-Type": "application/json",
        // Evita correos duplicados si se reintenta la misma cita.
        "Idempotency-Key": `booking-${b.id}`,
      },
      body: JSON.stringify({ from: this.env.from, to: [this.env.to], reply_to: b.contact.email, subject, text, html }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text().catch(() => "")).slice(0, 300)}`);
  }
}
