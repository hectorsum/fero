export const MAX_EMAIL_LENGTH = 254;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

// Controles C0/C1, DEL y caracteres invisibles de formato (zero-width, bidi).
const CONTROL_RE = /[\u0000-\u001F\u007F-\u009F​-‏‪-‮⁠-⁤﻿]/g;

/** Correo estricto (ASCII, dominio con TLD); se aplica después de pasar a minúsculas. */
const LOGIN_EMAIL_RE = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;

export interface Credentials {
  email: string;
  password: string;
}

/**
 * Normaliza credenciales de origen no confiable. Devuelve null si no son válidas.
 * El correo se limpia (NFKC, sin espacios ni invisibles, minúsculas); la contraseña NO se
 * modifica (alterarla cambiaría el secreto): solo se rechaza si trae caracteres de control
 * o tiene una longitud fuera de rango.
 */
export function sanitizeCredentials(rawEmail: unknown, rawPassword: unknown): Credentials | null {
  if (typeof rawEmail !== "string" || typeof rawPassword !== "string") return null;
  if (rawEmail.length > MAX_EMAIL_LENGTH * 2 || rawPassword.length > MAX_PASSWORD_LENGTH) return null;

  const email = rawEmail.normalize("NFKC").replace(CONTROL_RE, "").replace(/\s+/g, "").toLowerCase();
  if (!email || email.length > MAX_EMAIL_LENGTH || !LOGIN_EMAIL_RE.test(email)) return null;

  if (rawPassword.length < MIN_PASSWORD_LENGTH) return null;
  if (/[\u0000-\u001F\u007F]/.test(rawPassword)) return null;

  return { email, password: rawPassword };
}
