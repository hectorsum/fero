export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Los asuntos van en una sola línea: un salto de línea podría inyectar cabeceras. */
export const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").trim();

/** "sábado, 22 de noviembre" a partir de "YYYY-MM-DD" (sin desfase de zona horaria). */
export const formatDate = (date: string) =>
  new Intl.DateTimeFormat("es-PE", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`),
  );

/** Tabla clave/valor; los valores se escapan aquí. */
export const htmlRows = (rows: [string, string][]) =>
  `<table cellpadding="6" style="border-collapse:collapse">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="color:#666;vertical-align:top">${escapeHtml(k)}</td><td style="white-space:pre-wrap">${escapeHtml(v)}</td></tr>`,
    )
    .join("")}</table>`;

export interface EmailContent {
  subject: string;
  text: string;
  html: string;
}
