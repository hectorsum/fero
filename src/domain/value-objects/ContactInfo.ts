export interface ContactInfo {
  readonly name: string;
  readonly phone: string;
  readonly email: string;
}

const EMAIL_RE = /.+@.+\..+/;

export const MAX_LENGTH = { name: 120, phone: 40, email: 254 } as const;

const within = (v: string, max: number) => v.trim() !== "" && v.trim().length <= max;

export const isValidName = (name: string) => within(name, MAX_LENGTH.name);
export const isValidPhone = (phone: string) => within(phone, MAX_LENGTH.phone);
export const isValidEmail = (email: string) => email.trim().length <= MAX_LENGTH.email && EMAIL_RE.test(email);

export function isValidContactInfo(c: ContactInfo): boolean {
  return isValidName(c.name) && isValidPhone(c.phone) && isValidEmail(c.email);
}

export class InvalidContactInfoError extends Error {
  constructor(readonly field: keyof ContactInfo) {
    super(`Dato de contacto inválido: ${field}`);
    this.name = "InvalidContactInfoError";
  }
}

/** Normaliza (trim) y valida; lanza InvalidContactInfoError si algún campo no es válido. */
export function createContactInfo(input: ContactInfo): ContactInfo {
  const c = { name: input.name.trim(), phone: input.phone.trim(), email: input.email.trim() };
  if (!isValidName(c.name)) throw new InvalidContactInfoError("name");
  if (!isValidPhone(c.phone)) throw new InvalidContactInfoError("phone");
  if (!isValidEmail(c.email)) throw new InvalidContactInfoError("email");
  return c;
}

/** Claves para comparar contactos: el teléfono solo con dígitos y el correo en minúsculas. */
export const phoneKey = (phone: string) => phone.replace(/\D/g, "");
export const emailKey = (email: string) => email.trim().toLowerCase();
