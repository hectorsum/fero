import { randomBytes } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "./crypto";

beforeAll(() => {
  process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = randomBytes(32).toString("base64");
});

describe("encryptSecret / decryptSecret", () => {
  it("ida y vuelta, con IV distinto cada vez", () => {
    const a = encryptSecret("1//refresh-token");
    expect(a).not.toContain("refresh");
    expect(a).not.toBe(encryptSecret("1//refresh-token"));
    expect(decryptSecret(a)).toBe("1//refresh-token");
  });

  it("detecta manipulación", () => {
    const [v, iv, tag, ct] = encryptSecret("secreto").split(".");
    const tampered = [v, iv, tag, ct.slice(0, -2) + (ct.endsWith("A") ? "BB" : "AA")].join(".");
    expect(() => decryptSecret(tampered)).toThrow();
  });

  it("exige una clave de 32 bytes", () => {
    const k = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;
    process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = "corta";
    expect(() => encryptSecret("x")).toThrow(/32 bytes/);
    process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = k;
  });
});
