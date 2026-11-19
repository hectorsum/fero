import type { ContactInfo } from "@/domain/value-objects/ContactInfo";

export interface TattooRequest {
  style: string;
  size: string;
  zone?: string;
  idea?: string;
  /** Fecha preferida ya formateada para lectura, p. ej. "martes 17 de noviembre de 2026". */
  date?: string;
  time?: string;
}

interface Input {
  barberPhone: string;
  contact: ContactInfo;
  notes?: string;
  tattoo?: TattooRequest;
}

const opt = (label: string, v?: string) => (v?.trim() ? [`${label}: ${v.trim()}`] : []);

/** Arma el enlace wa.me con el mensaje prellenado para solicitar una sesión de tatuaje. */
export function buildWhatsAppLink({ barberPhone, contact, notes = "", tattoo }: Input): string {
  const num = barberPhone.replace(/\D/g, "");
  const text = [
    "Hola Fero, quiero agendar una sesión de tatuaje 🖋",
    "",
    `Nombre: ${contact.name}`,
    `Teléfono: ${contact.phone}`,
    `Correo: ${contact.email}`,
    ...(tattoo
      ? [
          ...opt("Estilo", tattoo.style),
          ...opt("Tamaño", tattoo.size),
          ...opt("Zona del cuerpo", tattoo.zone),
          ...opt("Fecha", tattoo.date),
          ...opt("Hora", tattoo.time),
          ...(tattoo.idea?.trim() ? ["", `Idea: ${tattoo.idea.trim()}`] : []),
        ]
      : []),
    ...opt("Notas", notes),
  ].join("\n");
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}
