import type { Patch } from "@/presentation/hooks/useBookingWizard";

const titleStyle = { fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 23, color: "var(--color-text)" };
const subStyle = { fontSize: 14, color: "var(--color-neutral-600)" };

export default function StepMode({ patch }: { patch: Patch }) {
  return (
    <div className="flex flex-col gap-[18px]">
      <div className="kicker text-center">¿Qué tipo de servicio te interesa hoy? *</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        <button
          onClick={() => patch({ mode: "corte", step: 1 })}
          className="mode-card cursor-pointer flex flex-col items-center gap-3.5 p-7 sm:py-10 sm:px-6"
        >
          <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
            <circle cx={6} cy={6} r={3} />
            <circle cx={6} cy={18} r={3} />
            <line x1={20} y1={4} x2={8.12} y2={15.88} />
            <line x1={14.47} y1={14.48} x2={20} y2={20} />
            <line x1={8.12} y1={8.12} x2={12} y2={12} />
          </svg>
          <div style={titleStyle}>Corte &amp; Grooming</div>
          <div style={subStyle}>Fades, tapers, barba y más</div>
        </button>
        <button
          onClick={() => patch({ mode: "tatuaje", step: 1 })}
          className="mode-card cursor-pointer flex flex-col items-center gap-3.5 p-7 sm:py-10 sm:px-6"
        >
          {/* Máquina de tatuar (export/icon-tatuaje.svg) */}
          <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <g transform="translate(12 12) scale(1.22) rotate(45) translate(-12 -12)">
              <path d="M10.6 19.2 L12 22.4 L13.4 19.2" />
              <rect x={10} y={13.4} width={4} height={5.8} rx={1.6} />
              <rect x={11.1} y={10.6} width={1.8} height={2.8} rx={0.6} />
              <rect x={6.6} y={9} width={11.2} height={1.6} rx={0.8} />
              <path d="M6.6 9.8 H5.2 M5.2 8.6 V11" />
              <path d="M17.8 9 V4.2 a1.4 1.4 0 0 0 -1.4 -1.4 H10.8" />
              <rect x={11} y={4.4} width={2.7} height={4.6} rx={1} />
              <rect x={14.3} y={4.4} width={2.7} height={4.6} rx={1} />
            </g>
          </svg>
          <div style={titleStyle}>Tatuaje</div>
          <div style={subStyle}>Consulta y sesión de tinta</div>
        </button>
      </div>
    </div>
  );
}
