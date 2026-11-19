import type React from "react";

export const DAY_NAMES = ["L", "M", "X", "J", "V", "S", "D"];
export const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DAYS_LONG = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MONTHS_LONG = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export function fmtDate(d: Date) {
  return `${DAYS_LONG[d.getDay()]} ${d.getDate()} de ${MONTHS_LONG[d.getMonth()]} de ${d.getFullYear()}`;
}

export const kickerStyle: React.CSSProperties = {
  fontSize: 12,
  letterSpacing: ".14em",
  textTransform: "uppercase",
  color: "var(--color-accent-700)",
};
