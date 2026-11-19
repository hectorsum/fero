import { SHOP_SCHEDULE, serviceName } from "@/infrastructure/config/shop";
import type { WizardState } from "@/presentation/hooks/useBookingWizard";
import { fmtDate } from "./format";

function rows(s: WizardState, isTattoo: boolean) {
  const out = [
    { k: "Nombre", v: s.name },
    { k: "Teléfono", v: s.phone },
    { k: "Correo", v: s.email },
  ];
  if (isTattoo) {
    out.push({ k: "Servicio", v: `Tatuaje — ${s.tStyle}` }, { k: "Tamaño", v: s.tSize });
    if (s.tZone.trim()) out.push({ k: "Zona del cuerpo", v: s.tZone.trim() });
    if (s.tIdea.trim()) out.push({ k: "Idea", v: s.tIdea.trim() });
  } else {
    out.push({ k: "Servicio", v: serviceName(s.service ?? "completo") });
  }
  out.push({ k: "Fecha", v: s.date ? fmtDate(s.date) : "" });
  out.push({
    k: "Hora",
    v: isTattoo ? `${s.time ?? ""}` : `${s.time} — ${SHOP_SCHEDULE.serviceDuration[s.service ?? "completo"]} min`,
  });
  if (s.notes.trim()) out.push({ k: "Notas", v: s.notes.trim() });
  return out;
}

export default function StepConfirmar({ s, isTattoo }: { s: WizardState; isTattoo: boolean }) {
  return (
    <div className="card flex flex-col gap-0 p-6 sm:py-10 sm:px-11">
      <div className="kicker" style={{ marginBottom: 22 }}>
        Confirma tu cita
      </div>
      {rows(s, isTattoo).map((row) => (
        <div
          key={row.k}
          className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-1 sm:gap-4 py-[13px]"
          style={{ borderBottom: "1px solid var(--color-divider)" }}
        >
          <div style={{ fontSize: 13, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--color-neutral-500)" }}>{row.k}</div>
          <div style={{ fontSize: 15, color: "var(--color-text)", fontFeatureSettings: "'tnum'", overflowWrap: "anywhere" }}>{row.v}</div>
        </div>
      ))}
      <p style={{ margin: "22px 0 0", fontSize: 13.5, lineHeight: 1.6, color: "var(--color-neutral-600)" }}>
        {isTattoo
          ? "Al confirmar se abrirá WhatsApp con los datos de tu sesión, listos para enviarse a Fero. Solo tienes que enviar el mensaje."
          : "Al confirmar tu cita quedará agendada y verás la confirmación en pantalla."}
      </p>
    </div>
  );
}
