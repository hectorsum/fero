import { SERVICES } from "@/infrastructure/config/shop";
import type { WizardState } from "@/presentation/hooks/useBookingWizard";
import { fmtDate } from "./format";

export default function StepDone({ s, isTattoo, onRestart }: { s: WizardState; isTattoo: boolean; onRestart: () => void }) {
  return (
    <div className="card flex flex-col items-center gap-4 p-8 sm:p-14 text-center">
      <svg width={52} height={52} viewBox="0 0 52 52">
        <circle cx={26} cy={26} r={24} fill="none" stroke="var(--color-accent)" strokeWidth={1.5} />
        <path d="M16 27 l7 7 l13 -15" fill="none" stroke="var(--color-accent-700)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <h2 style={{ margin: 0, fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 28, color: "var(--color-text)" }}>
        {isTattoo ? "¡Ya casi!" : "Cita registrada"}
      </h2>
      <p style={{ margin: 0, maxWidth: 420, fontSize: 15, lineHeight: 1.7, color: "var(--color-neutral-600)" }}>
        {isTattoo
          ? "Te abrimos WhatsApp con tus datos listos para enviar. Solo envía el mensaje y Fero te contactará para coordinar tu sesión de tatuaje."
          : s.date && s.time
            ? `${SERVICES[s.service ?? 0].name} — ${fmtDate(s.date)} a las ${s.time}. Fero te espera.`
            : ""}
      </p>
      <button className="btn btn-ghost" onClick={onRestart} style={{ marginTop: 8, cursor: "pointer" }}>
        Agendar otra cita
      </button>
    </div>
  );
}
