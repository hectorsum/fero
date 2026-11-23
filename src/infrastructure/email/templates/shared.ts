import { siteUrl } from "@/infrastructure/config/shop";

export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Los asuntos van en una sola línea: un salto de línea podría inyectar cabeceras. */
export const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").trim();

/** "sábado, 22 de noviembre" a partir de "YYYY-MM-DD" (sin desfase de zona horaria). */
export const formatDate = (date: string) =>
  new Intl.DateTimeFormat("es-PE", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`),
  );

/** Dominio público para las imágenes del correo. Desde localhost Gmail no podría cargarlas: usa producción. */
const PRODUCTION_URL = "https://fero.ink";
export function emailAssetsUrl(): string {
  const url = siteUrl();
  return /\/\/(localhost|127\.0\.0\.1)(:|$)/.test(url) ? PRODUCTION_URL : url;
}

export interface EmailAttachment {
  filename: string;
  /** Contenido en texto (se envía en base64). */
  content: string;
}

export interface EmailContent {
  subject: string;
  text: string;
  html: string;
  attachments?: EmailAttachment[];
}
