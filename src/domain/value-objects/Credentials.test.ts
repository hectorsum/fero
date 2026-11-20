import { describe, expect, it } from "vitest";
import { sanitizeCredentials } from "./Credentials";

describe("sanitizeCredentials", () => {
  it("normaliza el correo y no toca la contraseña", () => {
    expect(sanitizeCredentials("  Fero@Correo.COM​ ", " pass word ")).toEqual({ email: "fero@correo.com", password: " pass word " });
  });

  it("normaliza formas Unicode equivalentes (NFKC)", () => {
    expect(sanitizeCredentials("ｆｅｒｏ@correo.com", "12345678")?.email).toBe("fero@correo.com");
  });

  it.each([
    ["tipos no string", 1, "12345678"],
    ["correo inválido", "fero", "12345678"],
    ["correo con inyección", "a@b.com<script>", "12345678"],
    ["contraseña corta", "a@b.com", "1234567"],
    ["contraseña larga", "a@b.com", "x".repeat(129)],
    ["contraseña con control", "a@b.com", "1234567\u0000"],
    ["correo enorme", "a".repeat(600) + "@b.com", "12345678"],
  ])("rechaza: %s", (_, email, pass) => {
    expect(sanitizeCredentials(email, pass)).toBeNull();
  });
});
