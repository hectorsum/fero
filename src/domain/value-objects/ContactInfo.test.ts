import { describe, expect, it } from "vitest";
import { createContactInfo, InvalidContactInfoError, isValidContactInfo, isValidEmail } from "./ContactInfo";

const valid = { name: "Ana", phone: "999 333 122", email: "ana@correo.com" };

describe("ContactInfo", () => {
  it("valida email", () => {
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isValidEmail("ab.co")).toBe(false);
  });

  it("isValidContactInfo exige nombre, teléfono y email", () => {
    expect(isValidContactInfo(valid)).toBe(true);
    expect(isValidContactInfo({ ...valid, name: "  " })).toBe(false);
    expect(isValidContactInfo({ ...valid, phone: "" })).toBe(false);
    expect(isValidContactInfo({ ...valid, email: "x" })).toBe(false);
  });

  it("createContactInfo recorta espacios", () => {
    expect(createContactInfo({ name: " Ana ", phone: " 999 ", email: " ana@correo.com " })).toEqual({
      name: "Ana",
      phone: "999",
      email: "ana@correo.com",
    });
  });

  it("createContactInfo indica el campo inválido", () => {
    for (const field of ["name", "phone", "email"] as const) {
      const err = (() => {
        try {
          createContactInfo({ ...valid, [field]: " " });
        } catch (e) {
          return e;
        }
      })();
      expect(err).toBeInstanceOf(InvalidContactInfoError);
      expect((err as InvalidContactInfoError).field).toBe(field);
    }
  });
});
