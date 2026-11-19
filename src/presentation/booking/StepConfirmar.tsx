import { SHOP_SCHEDULE, serviceName } from "@/infrastructure/config/shop";
import type { WizardState } from "@/presentation/hooks/useBookingWizard";
import { fmtDate, kickerStyle } from "./format";

export default function StepConfirmar({ s }: { s: WizardState }) {
  const rows = [
    { k: "Nombre", v: s.name },
    { k: "Teléfono", v: s.phone },
    { k: "Correo", v: s.email },
    { k: "Servicio", v: serviceName(s.service ?? "completo") },
    { k: "Fecha", v: s.date ? fmtDate(s.date) : "" },
    { k: "Hora", v: `${s.time} — ${SHOP_SCHEDULE.serviceDuration[s.service ?? "completo"]} min` },
    ...(s.notes.trim() ? [{ k: "Notas", v: s.notes.trim() }] : []),
  ];
  return (
    <div className="card flex flex-col gap-0 p-6 sm:p-10 sm:px-11">
      <div style={{ ...kickerStyle, marginBottom: 22 }}>Confirma tu cita</div>
      {rows.map((row, i) => (
        <div
          key={i}
          className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-1 sm:gap-4 py-3"
          style={{ borderBottom: "1px solid var(--color-divider)" }}
        >
          <div style={{ fontSize: 13, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--color-neutral-500)" }}>{row.k}</div>
          <div style={{ fontSize: 15, color: "var(--color-text)", fontFeatureSettings: "'tnum'" }}>{row.v}</div>
        </div>
      ))}
      <p style={{ margin: "22px 0 0", fontSize: 13.5, lineHeight: 1.6, color: "var(--color-neutral-600)" }}>
        Al confirmar tu cita quedará agendada y verás la confirmación en pantalla.
      </p>
    </div>
  );
}
