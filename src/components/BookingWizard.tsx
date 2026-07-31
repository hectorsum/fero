"use client";

import { useMemo, useState } from "react";

const BARBER_WHATSAPP = "5215512345678";

type Mode = "corte" | "tatuaje" | null;

interface WizardState {
  mode: Mode;
  step: number;
  name: string;
  phone: string;
  email: string;
  notes: string;
  service: number | null;
  date: Date | null;
  time: string | null;
  viewY: number;
  viewM: number;
  done: boolean;
  tStyle: string;
  tSize: string;
  tZone: string;
  tIdea: string;
}

const SERVICE_NAMES = ["Servicio completo (Corte + Barba)", "Solo barba", "Solo corte"];
const HOURS = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];
const DAY_NAMES = ["L", "M", "X", "J", "V", "S", "D"];
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DAYS_LONG = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MONTHS_LONG = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function today() {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

function fmtDate(d: Date) {
  return `${DAYS_LONG[d.getDay()]} ${d.getDate()} de ${MONTHS_LONG[d.getMonth()]} de ${d.getFullYear()}`;
}

function initialState(): WizardState {
  const t = new Date();
  return {
    mode: null,
    step: 0,
    name: "",
    phone: "",
    email: "",
    notes: "",
    service: null,
    date: null,
    time: null,
    viewY: t.getFullYear(),
    viewM: t.getMonth(),
    done: false,
    tStyle: "",
    tSize: "",
    tZone: "",
    tIdea: "",
  };
}

const kickerStyle: React.CSSProperties = {
  fontSize: 12,
  letterSpacing: ".14em",
  textTransform: "uppercase",
  color: "var(--color-accent-700)",
};

export default function BookingWizard() {
  const [s, setS] = useState<WizardState>(initialState);
  const patch = (p: Partial<WizardState>) => setS((prev) => ({ ...prev, ...p }));

  const isCorte = s.mode === "corte";
  const isTattoo = s.mode === "tatuaje";

  const validStep = () => {
    if (s.step === 0) return s.mode !== null;
    if (s.step === 1) return s.name.trim() !== "" && s.phone.trim() !== "" && /.+@.+\..+/.test(s.email);
    if (s.step === 2) {
      if (isCorte) return s.service !== null && !!s.date && !!s.time;
      return !!s.tStyle && !!s.tSize && !!s.date && !!s.time;
    }
    return true;
  };
  const valid = validStep();

  const sendWhatsApp = () => {
    const num = BARBER_WHATSAPP.replace(/\D/g, "");
    const text = [
      "Hola Fero, quiero agendar una sesión de tatuaje 🖋",
      "",
      `Nombre: ${s.name}`,
      `Teléfono: ${s.phone}`,
      `Correo: ${s.email}`,
      `Estilo: ${s.tStyle}`,
      `Tamaño: ${s.tSize}`,
      ...(s.tZone.trim() ? [`Zona del cuerpo: ${s.tZone.trim()}`] : []),
      `Fecha: ${s.date ? fmtDate(s.date) : ""}`,
      `Hora: ${s.time}`,
      ...(s.tIdea.trim() ? ["", `Idea: ${s.tIdea.trim()}`] : []),
      ...(s.notes.trim() ? [`Notas: ${s.notes.trim()}`] : []),
    ].join("\n");
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const goBack = () => patch({ step: Math.max(0, s.step - 1) });
  const goNext = () => {
    if (!validStep()) return;
    if (s.step === 3) {
      if (isTattoo) sendWhatsApp();
      patch({ done: true });
    } else {
      patch({ step: s.step + 1 });
    }
  };
  const restart = () => setS(initialState());

  const calendar = useMemo(() => {
    const t = today();
    const first = new Date(s.viewY, s.viewM, 1);
    const lead = (first.getDay() + 6) % 7;
    const dim = new Date(s.viewY, s.viewM + 1, 0).getDate();
    const cells: { day: number; date: Date | null; disabled: boolean; selected: boolean }[] = [];
    for (let i = 0; i < lead; i++) cells.push({ day: 0, date: null, disabled: true, selected: false });
    for (let d = 1; d <= dim; d++) {
      const date = new Date(s.viewY, s.viewM, d);
      const closed = date.getDay() === 0;
      const past = date < t;
      cells.push({
        day: d,
        date,
        disabled: closed || past,
        selected: !!s.date && date.getTime() === s.date.getTime(),
      });
    }
    const atFirstMonth = s.viewY === t.getFullYear() && s.viewM === t.getMonth();
    return { cells, atFirstMonth };
  }, [s.viewY, s.viewM, s.date]);

  const shiftMonth = (dir: number) => {
    const m = s.viewM + dir;
    patch({ viewM: ((m % 12) + 12) % 12, viewY: s.viewY + Math.floor(m / 12) });
  };

  const stepDefs = [
    { n: "1", label: "Tus datos" },
    { n: "2", label: isTattoo ? "Tu tatuaje" : "Servicio y horario" },
    { n: "3", label: "Confirmar" },
  ];

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

      {s.step === 0 && !s.done && (
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
      )}

      {s.step > 0 && !s.done && (
        <div className="flex flex-wrap items-center justify-center">
          {stepDefs.map((d, i) => {
            const num = i + 1;
            const active = s.step === num;
            const past = s.step > num;
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
      )}

      {s.step === 1 && !s.done && (
        <div className="card flex flex-col gap-5 p-6 sm:p-9">
          <div style={kickerStyle}>Tus datos *</div>
          <div className="field">
            <label htmlFor="f-nombre">Nombre completo</label>
            <input className="input" id="f-nombre" type="text" placeholder="Ej. Hector Herrera" value={s.name} onChange={(e) => patch({ name: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="field">
              <label htmlFor="f-tel">Teléfono</label>
              <input className="input" id="f-tel" type="tel" placeholder="Ej. 999 333 122" value={s.phone} onChange={(e) => patch({ phone: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="f-mail">Correo electrónico</label>
              <input className="input" id="f-mail" type="email" placeholder="Ej. andres@correo.com" value={s.email} onChange={(e) => patch({ email: e.target.value })} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="f-notas">Notas (opcional)</label>
            <textarea
              className="input"
              id="f-notas"
              rows={3}
              placeholder="Algo que Fernando deba saber…"
              value={s.notes}
              onChange={(e) => patch({ notes: e.target.value })}
              style={{ resize: "vertical", fontFamily: "var(--font-body)" }}
            />
          </div>
        </div>
      )}

      {s.step === 2 && !s.done && (
        <div className="flex flex-col gap-8">
          {isCorte && (
            <div className="flex flex-col gap-3.5">
              <div style={kickerStyle}>Elige un servicio *</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {SERVICE_NAMES.map((title, i) => (
                  <button
                    key={title}
                    onClick={() => patch({ service: i })}
                    className="svc-card cursor-pointer text-left flex flex-col gap-1.5 px-5 py-4"
                    style={{
                      background: s.service === i ? "var(--color-accent-100)" : "transparent",
                      border: `1px solid ${s.service === i ? "var(--color-accent)" : "var(--color-divider)"}`,
                    }}
                  >
                    <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 19, color: "var(--color-text)" }}>{title}</div>
                    <div style={{ fontSize: 13, color: "var(--color-neutral-600)", fontFeatureSettings: "'tnum'" }}>60 min</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {isTattoo && (
            <div className="card flex flex-col gap-5 p-6 sm:p-9">
              <div style={kickerStyle}>Tu tatuaje</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="field">
                  <label htmlFor="t-estilo">Estilo *</label>
                  <select className="input" id="t-estilo" value={s.tStyle} onChange={(e) => patch({ tStyle: e.target.value })}>
                    <option value="">Selecciona…</option>
                    <option>Tradicional</option>
                    <option>Fine line</option>
                    <option>Blackwork</option>
                    <option>Realismo</option>
                    <option>Lettering</option>
                    <option>Otro</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="t-tam">Tamaño *</label>
                  <select className="input" id="t-tam" value={s.tSize} onChange={(e) => patch({ tSize: e.target.value })}>
                    <option value="">Selecciona…</option>
                    <option>Pequeño (&lt;5cm)</option>
                    <option>Mediano (5–10cm)</option>
                    <option>Grande (10–20cm)</option>
                    <option>Extra grande (&gt;20cm)</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label htmlFor="t-zona">Zona del cuerpo</label>
                <input className="input" id="t-zona" type="text" placeholder="Ej: antebrazo, cuello…" value={s.tZone} onChange={(e) => patch({ tZone: e.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="t-idea">Descripción de tu idea</label>
                <textarea
                  className="input"
                  id="t-idea"
                  rows={4}
                  placeholder="Describe tu idea, referencias, colores, estilo…"
                  value={s.tIdea}
                  onChange={(e) => patch({ tIdea: e.target.value })}
                  style={{ resize: "vertical", fontFamily: "var(--font-body)" }}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3.5">
            <div style={kickerStyle}>Elige una fecha y hora *</div>
            <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 lg:gap-8 items-start">
              <div className="card overflow-hidden p-0 w-full sm:max-w-[340px] lg:max-w-none mx-auto">
                <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: "1px solid var(--color-divider)" }}>
                  <button
                    onClick={() => !calendar.atFirstMonth && shiftMonth(-1)}
                    className="cal-nav cursor-pointer bg-transparent border-none h-[30px] w-[30px] text-base"
                    style={{ borderRadius: "var(--radius-sm)", color: calendar.atFirstMonth ? "var(--color-neutral-300)" : "var(--color-accent-700)" }}
                  >
                    ‹
                  </button>
                  <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 19, color: "var(--color-text)" }}>
                    {MONTHS[s.viewM]} {s.viewY}
                  </div>
                  <button
                    onClick={() => shiftMonth(1)}
                    className="cal-nav cursor-pointer bg-transparent border-none h-[30px] w-[30px] text-base"
                    style={{ borderRadius: "var(--radius-sm)", color: "var(--color-accent-700)" }}
                  >
                    ›
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-0.5 p-3.5">
                  {DAY_NAMES.map((dn) => (
                    <div key={dn} className="text-center text-[11px] tracking-[.08em] py-1" style={{ color: "var(--color-neutral-500)" }}>
                      {dn}
                    </div>
                  ))}
                  {calendar.cells.map((c, i) => (
                    <button
                      key={i}
                      disabled={c.disabled}
                      onClick={() => c.date && patch({ date: c.date, time: null })}
                      className="cal-day border-none h-[38px] rounded-full text-sm"
                      style={{
                        cursor: c.disabled ? "default" : "pointer",
                        fontFeatureSettings: "'tnum'",
                        background: c.selected ? "var(--color-accent)" : "transparent",
                        color: c.selected ? "#fff" : c.disabled ? "var(--color-neutral-400)" : "var(--color-text)",
                        textDecoration: c.disabled && c.date && c.date < today() ? "line-through" : "none",
                      }}
                    >
                      {c.day || ""}
                    </button>
                  ))}
                </div>
              </div>
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
      )}

      {s.step === 3 && !s.done && (
        <div className="card flex flex-col gap-0 p-6 sm:p-10 sm:px-11">
          <div style={{ ...kickerStyle, marginBottom: 22 }}>Confirma tu cita</div>
          {[
            { k: "Nombre", v: s.name },
            { k: "Teléfono", v: s.phone },
            { k: "Correo", v: s.email },
            isCorte
              ? { k: "Servicio", v: SERVICE_NAMES[s.service ?? 0] }
              : { k: "Servicio", v: `Tatuaje — ${s.tStyle}` },
            ...(isTattoo ? [{ k: "Tamaño", v: s.tSize }] : []),
            ...(isTattoo && s.tZone.trim() ? [{ k: "Zona del cuerpo", v: s.tZone.trim() }] : []),
            ...(isTattoo && s.tIdea.trim() ? [{ k: "Idea", v: s.tIdea.trim() }] : []),
            { k: "Fecha", v: s.date ? fmtDate(s.date) : "" },
            { k: "Hora", v: `${s.time} — 60 min` },
            ...(s.notes.trim() ? [{ k: "Notas", v: s.notes.trim() }] : []),
          ].map((row, i) => (
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
            {isTattoo
              ? "Al confirmar se abrirá WhatsApp con los datos de tu sesión, listos para enviarse a Fero. Solo tienes que enviar el mensaje."
              : "Al confirmar tu cita quedará agendada y verás la confirmación en pantalla."}
          </p>
        </div>
      )}

      {s.done && (
        <div className="card flex flex-col items-center gap-4 p-8 sm:p-14 text-center">
          <svg width={52} height={52} viewBox="0 0 52 52">
            <circle cx={26} cy={26} r={24} fill="none" stroke="var(--color-accent)" strokeWidth={1.5} />
            <path d="M16 27 l7 7 l13 -15" fill="none" stroke="var(--color-accent-700)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h2 style={{ margin: 0, fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 28, color: "var(--color-text)" }}>Cita registrada</h2>
          <p style={{ margin: 0, maxWidth: 420, fontSize: 15, lineHeight: 1.7, color: "var(--color-neutral-600)" }}>
            {s.date && s.time
              ? `${isTattoo ? `Sesión de tatuaje (${s.tStyle}) — ` : `${SERVICE_NAMES[s.service ?? 0]} — `}${fmtDate(s.date)} a las ${s.time}${isTattoo
                ? ". Envía el mensaje de WhatsApp que se abrió para dejar todo confirmado."
                : "."
              } Fero te espera.`
              : ""}
          </p>
          <button className="btn btn-ghost" onClick={restart} style={{ marginTop: 8, cursor: "pointer" }}>
            Agendar otra cita
          </button>
        </div>
      )}

      {s.step > 0 && !s.done && (
        <div className="grid grid-cols-2 gap-3 sm:gap-5">
          <button className="btn btn-secondary cursor-pointer py-3.5 text-sm tracking-[.06em]" onClick={goBack}>
            Atrás
          </button>
          <button
            onClick={goNext}
            disabled={!valid}
            className="next-btn cursor-pointer py-3.5 text-sm uppercase tracking-[.14em]"
            style={{
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-accent)",
              background: "transparent",
              color: "var(--color-accent-700)",
              opacity: valid ? 1 : 0.45,
            }}
          >
            {s.step === 3 ? "Confirmar cita" : "Continuar"}
          </button>
        </div>
      )}
    </div>
  );
}
