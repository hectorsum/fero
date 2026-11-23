import { render } from "@react-email/components";
import { createElement } from "react";
import type { Booking } from "@/domain/entities/Booking";
import { BARBER_WHATSAPP, SHOP_ADDRESS, SHOP_PHONE, serviceName } from "@/infrastructure/config/shop";
import CustomerConfirmationEmail, { type CustomerConfirmationProps } from "./CustomerConfirmationEmail";
import { emailAssetsUrl, formatDate, oneLine, type EmailContent } from "./shared";

export const mapsUrl = (address: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
export const whatsappUrl = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "")}`;

const CANCEL_TEXT = "Si necesitas cancelar o reprogramar, avísanos por WhatsApp con anticipación";

export function customerConfirmationProps(b: Booking): CustomerConfirmationProps {
  return {
    name: b.contact.name,
    service: serviceName(b.service),
    dateLabel: formatDate(b.date),
    time: b.time,
    durationMin: b.durationMin,
    address: SHOP_ADDRESS,
    shopPhone: SHOP_PHONE,
    mapsUrl: mapsUrl(SHOP_ADDRESS),
    whatsappUrl: whatsappUrl(BARBER_WHATSAPP),
    cancelText: CANCEL_TEXT,
    assetsUrl: emailAssetsUrl(),
  };
}

/** Confirmación al cliente. Fecha y hora ya son locales de Lima (así se guardan). */
export async function customerConfirmationEmail(b: Booking): Promise<EmailContent> {
  const p = customerConfirmationProps(b);
  return {
    subject: oneLine(`Tu cita en FERO — ${p.dateLabel}, ${p.time}`),
    // React escapa todo lo que viene del cliente.
    html: await render(createElement(CustomerConfirmationEmail, p)),
    text: [
      `Hola, ${p.name}:`,
      "",
      "Tu cita en FERO quedó confirmada.",
      "",
      `Servicio: ${p.service}`,
      `Fecha: ${p.dateLabel}`,
      `Hora: ${p.time}`,
      `Duración: ${p.durationMin} min`,
      `Dirección: ${p.address}`,
      `Teléfono: ${p.shopPhone}`,
      `Cómo llegar: ${p.mapsUrl}`,
      "",
      `${CANCEL_TEXT}: ${p.whatsappUrl}`,
      "",
      "¡Te esperamos!",
      "FERO",
    ].join("\n"),
  };
}
