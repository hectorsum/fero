import type { ContactInfo } from "@/domain/value-objects/ContactInfo";

interface Input {
  barberPhone: string;
  contact: ContactInfo;
  notes?: string;
}

/** Arma el enlace wa.me con el mensaje prellenado para solicitar una sesión de tatuaje. */
export function buildWhatsAppLink({ barberPhone, contact, notes = "" }: Input): string {
  const num = barberPhone.replace(/\D/g, "");
  const text = [
    "Hola Fero, quiero agendar una sesión de tatuaje 🖋",
    "",
    `Nombre: ${contact.name}`,
    `Teléfono: ${contact.phone}`,
    `Correo: ${contact.email}`,
    ...(notes.trim() ? [`Notas: ${notes.trim()}`] : []),
  ].join("\n");
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}
