export interface ContactInfo {
  readonly name: string;
  readonly phone: string;
  readonly email: string;
}

const EMAIL_RE = /.+@.+\..+/;

export const isValidName = (name: string) => name.trim() !== "";
export const isValidPhone = (phone: string) => phone.trim() !== "";
export const isValidEmail = (email: string) => EMAIL_RE.test(email);

export function isValidContactInfo(c: ContactInfo): boolean {
  return isValidName(c.name) && isValidPhone(c.phone) && isValidEmail(c.email);
}
