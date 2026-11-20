import type { ServiceType } from "@/domain/entities/Booking";
import { SERVICES } from "@/infrastructure/config/shop";
import type { Patch, WizardState } from "@/presentation/hooks/useBookingWizard";
import Calendar from "./Calendar";
import TattooFields from "./TattooFields";
import { fmtDate } from "./format";

interface Props {
  s: WizardState;
  patch: Patch;
  isCorte: boolean;
  isTattoo: boolean;
  shiftMonth: (dir: number) => void;
  selectDate: (date: Date) => void;
  selectService: (service: ServiceType) => void;
  retrySlots: () => void;
  isOpenDate: (date: Date) => boolean;
}

const hintStyle = { fontSize: 14, color: "var(--color-neutral-600)" };

export default function StepHorario({ s, patch, isCorte, isTattoo, shiftMonth, selectDate, selectService, retrySlots, isOpenDate }: Props) {
  return (
    <div className="flex flex-col gap-8">
      {isCorte && (
        <div className="flex flex-col gap-3.5">
          <div className="kicker">Elige un servicio *</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {SERVICES.map((svc) => {
              const selected = s.service === svc.id;
              return (
                <button
                  key={svc.id}
                  onClick={() => selectService(svc.id)}
                  aria-pressed={selected}
                  className="svc-card cursor-pointer text-left flex flex-col gap-1.5 px-5 py-[18px]"
                  style={{
                    background: selected ? "var(--color-accent-100)" : "transparent",
                    border: `1px solid ${selected ? "var(--color-accent)" : "var(--color-divider)"}`,
                  }}
                >
                  <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 19, color: "var(--color-text)" }}>{svc.name}</div>
                  <div style={{ fontSize: 13, color: "var(--color-neutral-600)", fontFeatureSettings: "'tnum'" }}>{svc.durationMin} min</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isTattoo && <TattooFields s={s} patch={patch} />}

      <div className="flex flex-col gap-3.5">
        <div className="kicker">Elige una fecha y hora *</div>
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 lg:gap-8 items-start">
          <Calendar viewY={s.viewY} viewM={s.viewM} selected={s.date} onSelect={selectDate} onShiftMonth={shiftMonth} isOpenDate={isOpenDate} />
          <div className="flex flex-col gap-3.5">
            <div style={{ fontSize: 14, color: "var(--color-neutral-700)" }}>
              {s.date ? `Horarios disponibles — ${fmtDate(s.date)}` : "Selecciona un día en el calendario para ver los horarios."}
            </div>
            {s.date && isCorte && !s.service && <div style={hintStyle}>Elige un servicio para ver los horarios.</div>}
            {s.date && s.slotsStatus === "loading" && (
              <div style={hintStyle} aria-live="polite">
                Cargando horarios…
              </div>
            )}
            {s.date && s.slotsStatus === "error" && (
              <div className="flex flex-wrap items-center gap-3" role="alert" style={hintStyle}>
                No pudimos cargar los horarios.
                <button className="btn btn-ghost" onClick={retrySlots}>
                  Reintentar
                </button>
              </div>
            )}
            {s.date && s.slots?.length === 0 && <div style={hintStyle}>No quedan horarios disponibles este día. Prueba con otra fecha.</div>}
            {s.date && !!s.slots?.length && (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-3">
                {s.slots.map((h) => {
                  const selected = s.time === h;
                  return (
                    <button
                      key={h}
                      onClick={() => patch({ time: h })}
                      aria-pressed={selected}
                      className="slot-btn cursor-pointer rounded-full py-2.5 text-sm"
                      style={{
                        border: `1px solid ${selected ? "var(--color-accent)" : "var(--color-neutral-300)"}`,
                        background: selected ? "var(--color-accent-100)" : "transparent",
                        color: selected ? "var(--color-accent-700)" : "var(--color-text)",
                      }}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
