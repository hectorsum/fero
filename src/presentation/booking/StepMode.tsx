import type { Patch } from "@/presentation/hooks/useBookingWizard";
import { kickerStyle } from "./format";

export default function StepMode({ patch }: { patch: Patch }) {
  return (
    <div className="flex flex-col gap-4">
      <div style={{ ...kickerStyle, textAlign: "center" }}>¿Qué tipo de servicio te interesa hoy? *</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        <button
          onClick={() => patch({ mode: "corte", step: 1 })}
          className="mode-card cursor-pointer flex flex-col items-center gap-3.5 p-7 sm:p-10 sm:px-6"
        >
          <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
            <circle cx={6} cy={6} r={3} />
            <circle cx={6} cy={18} r={3} />
            <line x1={20} y1={4} x2={8.12} y2={15.88} />
            <line x1={14.47} y1={14.48} x2={20} y2={20} />
            <line x1={8.12} y1={8.12} x2={12} y2={12} />
          </svg>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 23, color: "var(--color-text)" }}>Corte &amp; Grooming</div>
          <div style={{ fontSize: 14, color: "var(--color-neutral-600)" }}>Fades, tapers, barba y más</div>
        </button>
        <button
          onClick={() => patch({ mode: "tatuaje", step: 1 })}
          className="mode-card cursor-pointer flex flex-col items-center gap-3.5 p-7 sm:p-10 sm:px-6"
        >
          <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19l7-7 3 3-7 7-3-3z" />
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
            <path d="M2 2l7.586 7.586" />
            <circle cx={11} cy={11} r={2} />
          </svg>
          <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 23, color: "var(--color-text)" }}>Tatuaje</div>
          <div style={{ fontSize: 14, color: "var(--color-neutral-600)" }}>Consulta y sesión de tinta</div>
        </button>
      </div>
    </div>
  );
}
