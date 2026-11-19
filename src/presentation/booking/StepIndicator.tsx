const STEP_DEFS = [
  { n: "1", label: "Tus datos" },
  { n: "2", label: "Servicio y horario" },
  { n: "3", label: "Confirmar" },
];

export default function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex flex-wrap items-center justify-center">
      {STEP_DEFS.map((d, i) => {
        const num = i + 1;
        const active = step === num;
        const past = step > num;
        return (
          <div key={d.label} className="flex items-center">
            <div className="flex items-center gap-2.5 px-2.5 sm:px-4.5">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full text-[13px] shrink-0"
                style={{
                  fontFeatureSettings: "'tnum'",
                  border: `1px solid ${active || past ? "var(--color-accent)" : "var(--color-neutral-300)"}`,
                  background: active ? "var(--color-accent-100)" : "transparent",
                  color: active || past ? "var(--color-accent-700)" : "var(--color-neutral-500)",
                }}
              >
                {past ? "✓" : d.n}
              </div>
              <div
                className="text-[13px] uppercase tracking-[.08em] hidden sm:block"
                style={{ color: active ? "var(--color-text)" : "var(--color-neutral-500)" }}
              >
                {d.label}
              </div>
            </div>
            {i < 2 && <div className="h-px w-6 sm:w-12" style={{ background: "var(--color-divider)" }} />}
          </div>
        );
      })}
    </div>
  );
}
