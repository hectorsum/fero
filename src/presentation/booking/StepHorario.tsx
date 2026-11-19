import { HOURS, SERVICES } from "@/infrastructure/config/shop";
import type { Patch, WizardState } from "@/presentation/hooks/useBookingWizard";
import Calendar from "./Calendar";
import { fmtDate, kickerStyle } from "./format";

interface Props {
  s: WizardState;
  patch: Patch;
  isCorte: boolean;
  shiftMonth: (dir: number) => void;
}

export default function StepHorario({ s, patch, isCorte, shiftMonth }: Props) {
  return (
    <div className="flex flex-col gap-8">
      {isCorte && (
        <div className="flex flex-col gap-3.5">
          <div style={kickerStyle}>Elige un servicio *</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {SERVICES.map((svc, i) => (
              <button
                key={svc.name}
                onClick={() => patch({ service: i })}
                className="svc-card cursor-pointer text-left flex flex-col gap-1.5 px-5 py-4"
                style={{
                  background: s.service === i ? "var(--color-accent-100)" : "transparent",
                  border: `1px solid ${s.service === i ? "var(--color-accent)" : "var(--color-divider)"}`,
                }}
              >
                <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 19, color: "var(--color-text)" }}>{svc.name}</div>
                <div style={{ fontSize: 13, color: "var(--color-neutral-600)", fontFeatureSettings: "'tnum'" }}>{svc.durationMin} min</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3.5">
        <div style={kickerStyle}>Elige una fecha y hora *</div>
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 lg:gap-8 items-start">
          <Calendar
            viewY={s.viewY}
            viewM={s.viewM}
            selected={s.date}
            onSelect={(date) => patch({ date, time: null })}
            onShiftMonth={shiftMonth}
          />
          <div className="flex flex-col gap-3.5">
            <div style={{ fontSize: 14, color: "var(--color-neutral-700)" }}>
              {s.date ? `Horarios disponibles — ${fmtDate(s.date)}` : "Selecciona un día en el calendario para ver los horarios."}
            </div>
            {s.date && (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-3">
                {HOURS.map((h) => (
                  <button
                    key={h}
                    onClick={() => patch({ time: h })}
                    className="slot-btn cursor-pointer rounded-full py-2.5 text-[15px]"
                    style={{
                      fontFeatureSettings: "'tnum'",
                      border: `1px solid ${s.time === h ? "var(--color-accent)" : "var(--color-neutral-300)"}`,
                      background: s.time === h ? "var(--color-accent-100)" : "transparent",
                      color: s.time === h ? "var(--color-accent-700)" : "var(--color-text)",
                    }}
                  >
                    {h}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
