"use client";

import { useBookingWizard } from "@/presentation/hooks/useBookingWizard";
import StepConfirmar from "./StepConfirmar";
import StepDatos from "./StepDatos";
import StepDone from "./StepDone";
import StepHorario from "./StepHorario";
import StepIndicator from "./StepIndicator";
import StepMode from "./StepMode";

export default function BookingWizard() {
  const { s, patch, valid, isCorte, isTattoo, goNext, goBack, restart, shiftMonth, selectDate, selectService, retrySlots } =
    useBookingWizard();

  return (
    <div className="flex min-w-0 flex-col gap-8 sm:gap-9">
      <div className="flex flex-col gap-2 text-center">
        <h1
          className="text-[26px] sm:text-[34px]"
          style={{ margin: 0, fontFamily: "var(--font-heading)", fontWeight: 600, color: "var(--color-text)" }}
        >
          Agenda tu cita
        </h1>
        <p style={{ margin: 0, fontSize: 15, color: "var(--color-neutral-600)" }}>Con Fernando Rojas «Fero»</p>
      </div>

      {s.step === 0 && !s.done && <StepMode patch={patch} />}
      {s.step > 0 && !s.done && <StepIndicator step={s.step} isTattoo={isTattoo} />}
      {s.step === 1 && !s.done && <StepDatos s={s} patch={patch} />}
      {s.step === 2 && !s.done && (
        <StepHorario
          s={s}
          patch={patch}
          isCorte={isCorte}
          isTattoo={isTattoo}
          shiftMonth={shiftMonth}
          selectDate={selectDate}
          selectService={selectService}
          retrySlots={retrySlots}
        />
      )}
      {s.step === 3 && !s.done && <StepConfirmar s={s} isTattoo={isTattoo} />}
      {s.done && <StepDone s={s} isTattoo={isTattoo} onRestart={restart} />}

      {s.error && !s.done && (
        <div
          role="alert"
          className="px-5 py-3.5 text-center"
          style={{
            fontSize: 14,
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-accent)",
            background: "var(--color-accent-100)",
            color: "var(--color-accent-700)",
          }}
        >
          {s.error}
        </div>
      )}

      {s.step > 0 && !s.done && (
        <div className="grid grid-cols-2 gap-3 sm:gap-5">
          <button
            className="btn btn-secondary py-3.5 text-sm tracking-[.06em]"
            onClick={goBack}
            disabled={s.submitting}
          >
            Atrás
          </button>
          <button
            onClick={goNext}
            disabled={!valid}
            aria-busy={s.submitting}
            className="next-btn cursor-pointer py-3.5 text-sm uppercase tracking-[.14em]"
            style={{ opacity: valid ? 1 : 0.45 }}
          >
            {s.step === 3 ? (s.submitting ? "Confirmando…" : "Confirmar cita") : "Continuar"}
          </button>
        </div>
      )}
    </div>
  );
}
