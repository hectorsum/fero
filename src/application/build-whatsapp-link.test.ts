import { describe, expect, it } from "vitest";
import { buildWhatsAppLink } from "./build-whatsapp-link";

const contact = { name: "Ana López", phone: "999 333 122", email: "ana@correo.com" };

function decode(url: string) {
  const u = new URL(url);
  return { origin: u.origin, path: u.pathname, text: u.searchParams.get("text") };
}

describe("buildWhatsAppLink", () => {
  it("normaliza el número y prellena el mensaje", () => {
    const { origin, path, text } = decode(buildWhatsAppLink({ barberPhone: "+52 1 55-1234-5678", contact }));
    expect(origin).toBe("https://wa.me");
    expect(path).toBe("/5215512345678");
    expect(text).toBe(
      "Hola Fero, quiero agendar una sesión de tatuaje 🖋\n\nNombre: Ana López\nTeléfono: 999 333 122\nCorreo: ana@correo.com",
    );
  });

  it("incluye las notas recortadas solo si no están vacías", () => {
    expect(decode(buildWhatsAppLink({ barberPhone: "1", contact, notes: "  brazo, 10cm  " })).text).toMatch(/\nNotas: brazo, 10cm$/);
    expect(decode(buildWhatsAppLink({ barberPhone: "1", contact, notes: "   " })).text).not.toContain("Notas");
  });

  it("codifica caracteres especiales", () => {
    const url = buildWhatsAppLink({ barberPhone: "1", contact: { ...contact, name: "A&B #1" } });
    expect(url).not.toContain("&B");
    expect(decode(url).text).toContain("Nombre: A&B #1");
  });
});
