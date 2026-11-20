"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { saveAvailabilityAction } from "@/app/admin/actions";
import { signOutAction } from "@/app/login/actions";
import { weeklySlots, WEEKDAYS, type Availability, type Weekday } from "@/domain/entities/Availability";
import { parseISODate, toISODate } from "@/domain/services/scheduling";
import type { GoogleStatus } from "@/infrastructure/google/GoogleCalendarConnection";
import { MONTHS } from "@/presentation/booking/format";
import GoogleCalendarCard from "./GoogleCalendarCard";

const SLOT_MIN = 60;
const C = {
  text: "#eeeae0",
  muted: "#a6a298",
  dim: "#8c887f",
  faint: "#57534c",
  border: "#3b3832",
  line: "rgba(238,234,224,.12)",
  lineSoft: "rgba(238,234,224,.07)",
  accent: "#b8d42c",
  accentText: "#c4dd3a",
  accentBg: "#1c210b",
  warn: "#d9a441",
  danger: "#e0866b",
  bg: "#0e0c09",
  surface: "#14120e",
};
const mono = "var(--font-fero-mono), monospace";
const serif = "var(--font-heading), serif";

/** Edición: las horas son texto libre hasta que se normalizan al salir del campo. */
type EditBlock = [string, string];
type EditDay = { open: boolean; blocks: EditBlock[] };
type EditCfg = { week: Record<Weekday, EditDay>; overrides: Availability["overrides"] };

const STD = (): EditBlock[] => [
  ["09:00", "12:00"],
  ["14:00", "21:00"],
];

/** "9", "930", "9.30", "9:30" → minutos; null si no es una hora válida. */
function parseT(raw: string): number | null {
  const s = raw.trim().replace(".", ":");
  if (!/^\d{1,2}(:?\d{2})?$/.test(s)) return null;
  let h: number, m: number;
  if (s.includes(":")) [h, m] = s.split(":").map(Number);
  else if (s.length <= 2) [h, m] = [Number(s), 0];
  else [h, m] = [Number(s.slice(0, -2)), Number(s.slice(-2))];
  if (h > 24 || m > 59 || (h === 24 && m > 0)) return null;
  return h * 60 + m;
}
const toT = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
/** Solo dígitos y separadores, máximo 5 caracteres. */
const cleanTimeInput = (v: string) => v.replace(/[^\d:.]/g, "").slice(0, 5);
const badTime = (v: string) => v !== "" && parseT(v) == null;

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

/** Convierte la edición a la forma que valida el servidor, o devuelve un mensaje de error. */
function toAvailability(cfg: EditCfg): Availability | string {
  const week = {} as Availability["week"];
  for (const wd of WEEKDAYS) {
    const d = cfg.week[wd];
    const blocks: [string, string][] = [];
    for (const [a, b] of d.blocks) {
      if (a.trim() === "" && b.trim() === "") continue;
      const s = parseT(a);
      const e = parseT(b);
      if (s == null || e == null || s >= 24 * 60) return "Revisa las horas marcadas en rojo: usa el formato 9:00 o 13:30.";
      if (s >= e) return `El horario ${toT(s)} a ${toT(e)} termina antes de empezar.`;
      blocks.push([toT(s), toT(e)]);
    }
    week[wd] = { open: d.open && blocks.length > 0, blocks };
  }
  return { week, overrides: cfg.overrides };
}

function fromAvailability(av: Availability): EditCfg {
  const week = {} as EditCfg["week"];
  for (const wd of WEEKDAYS) week[wd] = { open: av.week[wd].open, blocks: av.week[wd].blocks.map(([a, b]) => [a, b]) };
  return { week, overrides: clone(av.overrides) };
}

/** Slots que genera un día según la edición actual (ignora franjas incompletas). */
function editSlots(day: EditDay): string[] {
  const blocks = day.blocks
    .map(([a, b]) => [parseT(a), parseT(b)] as const)
    .filter((x): x is readonly [number, number] => x[0] != null && x[1] != null && x[0] < x[1] && x[0] < 24 * 60)
    .map(([s, e]) => [toT(s), e === 24 * 60 ? "24:00" : toT(e)] as const);
  return weeklySlots({ open: day.open, blocks }, SLOT_MIN);
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      className="relative h-[26px] w-[46px] shrink-0 cursor-pointer rounded-full p-0"
      style={{ border: `1px solid ${on ? C.accent : C.border}`, background: on ? C.accent : "transparent" }}
    >
      <span
        className="absolute top-[3px] h-[18px] w-[18px] rounded-full transition-[left] duration-150"
        style={{ left: on ? 24 : 3, background: on ? C.bg : C.faint }}
      />
    </button>
  );
}

const LONG_DAY = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const WEEK_ORDER: Weekday[] = [1, 2, 3, 4, 5, 6, 0];

interface Props {
  initial: Availability;
  email: string;
  /** "YYYY-MM-DD" en la zona del local. */
  today: string;
  google: GoogleStatus;
  googleNotice: { text: string; ok: boolean } | null;
}

export default function AdminPanel({ initial, email, today, google, googleNotice }: Props) {
  const todayDate = parseISODate(today) ?? new Date();
  const [cfg, setCfg] = useState<EditCfg>(() => fromAvailability(initial));
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const [navOpen, setNavOpen] = useState(false);
  const [view, setView] = useState({ y: todayDate.getFullYear(), m: todayDate.getMonth() });
  const [sel, setSel] = useState<string>(today);
  const detailRef = useRef<HTMLDivElement>(null);

  // Aviso al salir con cambios sin guardar.
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const update = (fn: (c: EditCfg) => void) => {
    setCfg((prev) => {
      const next = clone(prev);
      fn(next);
      return next;
    });
    setDirty(true);
    setError(null);
  };

  const save = () => {
    const av = toAvailability(cfg);
    if (typeof av === "string") {
      setError(av);
      return;
    }
    startSaving(async () => {
      try {
        const res = await saveAvailabilityAction(av);
        if (res.ok) {
          setCfg(fromAvailability(av));
          setDirty(false);
          setError(null);
          setSavedAt(new Date().toTimeString().slice(0, 5));
        } else {
          setError(res.message);
          if (res.signedOut) window.location.assign("/login");
        }
      } catch {
        setError("No pudimos conectar con el servidor. Revisa tu conexión.");
      }
    });
  };

  // — Calendario —
  const lead = (new Date(view.y, view.m, 1).getDay() + 6) % 7;
  const dim = new Date(view.y, view.m + 1, 0).getDate();
  const atFirstMonth = view.y === todayDate.getFullYear() && view.m === todayDate.getMonth();
  const shift = (dir: number) => {
    const m = view.m + dir;
    setView({ m: ((m % 12) + 12) % 12, y: view.y + Math.floor(m / 12) });
  };
  const pick = (k: string) => {
    setSel(k);
    if (window.matchMedia("(max-width: 899px)").matches) {
      setTimeout(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    }
  };

  // — Día seleccionado —
  const selDate = parseISODate(sel);
  const selBase = selDate ? editSlots(cfg.week[selDate.getDay() as Weekday]) : [];
  const selOv = cfg.overrides[sel] ?? {};
  const selBlocked = selOv.blocked ?? [];
  const selClosed = !!selOv.closed;
  const openCount = selClosed ? 0 : selBase.filter((t) => !selBlocked.includes(t)).length;

  const toggleSlot = (t: string) =>
    update((c) => {
      const x = (c.overrides[sel] ??= {});
      const b = x.blocked ?? [];
      x.blocked = b.includes(t) ? b.filter((z) => z !== t) : [...b, t].sort();
      if (!x.blocked.length) delete x.blocked;
      if (!x.blocked && !x.closed) delete c.overrides[sel];
    });
  const toggleDay = () =>
    update((c) => {
      const x = (c.overrides[sel] ??= {});
      if (x.closed) delete x.closed;
      else x.closed = true;
      if (!x.closed && !x.blocked?.length) delete c.overrides[sel];
    });
  const resetDay = () => update((c) => void delete c.overrides[sel]);

  const statusText = saving ? "Guardando…" : dirty ? "Cambios sin guardar" : savedAt ? `Guardado ${savedAt}` : "";

  return (
    <div
      className={`admin min-h-screen transition-[padding] duration-200 ${navOpen ? "md:pl-[270px]" : ""}`}
      style={{ fontFamily: "var(--font-body)", color: C.text, background: C.bg }}
    >
      <header
        className="sticky top-0 z-20 flex items-center gap-3 px-3.5 py-2.5 md:px-6 md:py-3.5"
        style={{ background: C.bg, borderBottom: `1px solid ${C.line}` }}
      >
        <button type="button" onClick={() => setNavOpen(!navOpen)} aria-label="Menú" aria-expanded={navOpen} className="admin-icon-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-2.5">
          <Image src="/fero-logo.png" alt="" width={36} height={36} priority />
          <div style={{ fontFamily: serif, fontWeight: 800, fontSize: 22, letterSpacing: ".04em" }}>FERO</div>
          <div className="hidden pt-[3px] md:block" style={{ fontFamily: mono, fontSize: 10, letterSpacing: ".16em", color: C.dim, textTransform: "uppercase" }}>
            Admin
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3.5">
          <span className="hidden md:inline" aria-live="polite" style={{ fontFamily: mono, fontSize: 12, letterSpacing: ".06em", color: dirty ? C.warn : C.dim }}>
            {statusText}
          </span>
          <button type="button" onClick={save} disabled={saving || !dirty} className="admin-save relative px-4 md:px-6">
            <span className="md:hidden">{saving ? "…" : "Guardar"}</span>
            <span className="hidden md:inline">{saving ? "Guardando…" : "Guardar cambios"}</span>
            {dirty && (
              <span
                className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full md:hidden"
                style={{ background: C.warn, border: `2px solid ${C.bg}` }}
              />
            )}
          </button>
        </div>
      </header>

      {navOpen && (
        <>
          <div className="fixed inset-0 z-30 md:hidden" style={{ background: "rgba(0,0,0,.6)" }} onClick={() => setNavOpen(false)} />
          <aside
            className="fixed inset-y-0 left-0 z-[31] flex w-[min(84vw,300px)] flex-col gap-7 px-5 py-[22px] md:w-[270px]"
            style={{ background: C.surface, borderRight: `1px solid ${C.line}` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Image src="/fero-logo.png" alt="" width={36} height={36} />
                <div style={{ fontFamily: serif, fontWeight: 800, fontSize: 22, letterSpacing: ".04em" }}>FERO</div>
              </div>
              <button type="button" onClick={() => setNavOpen(false)} aria-label="Cerrar menú" className="admin-close-btn">
                ×
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              <div
                aria-current="page"
                className="flex items-center gap-2.5 px-3.5 py-3"
                style={{ borderRadius: "var(--radius-md)", background: C.accentBg, border: "1px solid rgba(184,212,44,.35)", color: C.accentText, fontFamily: mono, fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
                Disponibilidad
              </div>
            </nav>
            <div className="mt-auto flex flex-col gap-3" style={{ fontFamily: mono, fontSize: 12, letterSpacing: ".08em" }}>
              <div style={{ color: C.faint, overflowWrap: "anywhere" }}>{email}</div>
              <Link href="/" target="_blank" className="admin-side-link">
                Ver página de agenda ↗
              </Link>
              <form action={signOutAction}>
                <button type="submit" className="admin-side-link cursor-pointer border-none bg-transparent p-0 text-left" style={{ font: "inherit", letterSpacing: "inherit" }}>
                  Cerrar sesión
                </button>
              </form>
            </div>
          </aside>
        </>
      )}

      <main className="mx-auto flex max-w-[1180px] flex-col gap-5 px-3.5 pb-14 pt-6 md:gap-8 md:px-8 md:pb-[72px] md:pt-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-[28px] md:text-[38px]" style={{ margin: 0, fontFamily: serif, fontWeight: 700 }}>
            Tu disponibilidad
          </h1>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: C.muted, maxWidth: 640 }}>
            Toca un día para ver sus horas. Puedes cerrar el día completo o tocar una hora para bloquearla. Cada cita dura 60 minutos.
          </p>
          {error && (
            <div role="alert" className="mt-2 px-4 py-3" style={{ border: `1px solid ${C.danger}`, borderRadius: "var(--radius-md)", color: C.danger, fontSize: 14 }}>
              {error}
            </div>
          )}
        </div>

        <GoogleCalendarCard status={google} notice={googleNotice} />

        <section className="admin-card grid grid-cols-1 items-start gap-6 min-[900px]:grid-cols-[minmax(0,360px)_minmax(0,1fr)] min-[900px]:gap-9">
          <div className="overflow-hidden" style={{ border: `1px solid ${C.line}`, borderRadius: "var(--radius-md)" }}>
            <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: `1px solid ${C.line}` }}>
              <button type="button" onClick={() => shift(-1)} disabled={atFirstMonth} aria-label="Mes anterior" className="admin-cal-nav">
                ‹
              </button>
              <div style={{ fontFamily: serif, fontWeight: 700, fontSize: 18 }}>
                {MONTHS[view.m]} {view.y}
              </div>
              <button type="button" onClick={() => shift(1)} aria-label="Mes siguiente" className="admin-cal-nav">
                ›
              </button>
            </div>
            <div className="grid grid-cols-7 gap-0.5 p-3">
              {["L", "M", "X", "J", "V", "S", "D"].map((dn) => (
                <div key={dn} className="py-1 text-center" style={{ fontFamily: mono, fontSize: 12, color: C.dim }}>
                  {dn}
                </div>
              ))}
              {Array.from({ length: lead }, (_, i) => (
                <div key={`e${i}`} />
              ))}
              {Array.from({ length: dim }, (_, i) => {
                const d = i + 1;
                const date = new Date(view.y, view.m, d);
                const k = toISODate(date);
                const past = k < today;
                const ov = cfg.overrides[k];
                const off = !editSlots(cfg.week[date.getDay() as Weekday]).length || !!ov?.closed;
                const partial = !!ov && !ov.closed && !!ov.blocked?.length;
                const isSel = sel === k;
                const dot = past ? "transparent" : ov?.closed ? C.danger : partial ? C.warn : "transparent";
                return (
                  <button
                    key={k}
                    type="button"
                    disabled={past}
                    onClick={() => pick(k)}
                    aria-pressed={isSel}
                    aria-label={`${d} de ${MONTHS[view.m].toLowerCase()}${off ? ", cerrado" : partial ? ", con horas bloqueadas" : ""}`}
                    className="admin-cal-day relative aspect-square w-[min(40px,100%)] justify-self-center rounded-full p-0"
                    style={{
                      cursor: past ? "default" : "pointer",
                      border: `1px solid ${isSel ? C.accent : "transparent"}`,
                      background: isSel ? C.accentBg : "transparent",
                      color: past ? C.border : off ? C.faint : C.text,
                      textDecoration: !past && off ? "line-through" : "none",
                      fontFamily: mono,
                      fontSize: 13,
                    }}
                  >
                    {d}
                    <span className="absolute bottom-[3px] left-1/2 -ml-0.5 h-1 w-1 rounded-full" style={{ background: dot }} />
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-[18px] px-3.5 py-2.5" style={{ borderTop: `1px solid ${C.line}`, fontFamily: mono, fontSize: 11, color: C.dim }}>
              <span className="flex items-center gap-1.5">
                <span className="h-[7px] w-[7px] rounded-full" style={{ background: C.danger }} />
                Cerrado
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-[7px] w-[7px] rounded-full" style={{ background: C.warn }} />
                Horas bloqueadas
              </span>
            </div>
          </div>

          <div ref={detailRef} className="flex min-w-0 scroll-mt-[84px] flex-col gap-5">
            {!selDate ? (
              <div className="py-6" style={{ fontSize: 15, color: C.dim }}>
                Selecciona un día en el calendario.
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-1.5">
                  <div className="text-[22px] md:text-[26px]" style={{ fontFamily: serif, fontWeight: 700 }}>
                    {LONG_DAY[selDate.getDay()]} {selDate.getDate()} de {MONTHS[selDate.getMonth()].toLowerCase()}
                  </div>
                  <div style={{ fontFamily: mono, fontSize: 13, color: !selBase.length || selClosed ? C.danger : selBlocked.length ? C.warn : C.accentText }}>
                    {!selBase.length ? "Cerrado por horario semanal" : selClosed ? "Día cerrado" : `${openCount} de ${selBase.length} horas disponibles`}
                  </div>
                </div>
                {selBase.length > 0 && (
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={toggleDay}
                      className="min-h-11 flex-1 cursor-pointer bg-transparent px-[18px] md:flex-none"
                      style={{ border: `1px solid ${selClosed ? C.accent : C.danger}`, borderRadius: "var(--radius-md)", color: selClosed ? C.accentText : C.danger, fontFamily: mono, fontSize: 13 }}
                    >
                      {selClosed ? "Abrir día" : "Cerrar día completo"}
                    </button>
                    {(selClosed || selBlocked.length > 0) && (
                      <button type="button" onClick={resetDay} className="admin-ghost-btn flex-1 md:flex-none">
                        Restablecer
                      </button>
                    )}
                  </div>
                )}
                {selBase.length > 0 && !selClosed && (
                  <>
                    <div style={{ fontSize: 14, color: C.dim }}>Toca una hora para bloquearla o liberarla.</div>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-2.5 sm:grid-cols-[repeat(auto-fill,minmax(104px,1fr))]">
                      {selBase.map((t) => {
                        const blocked = selBlocked.includes(t);
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => toggleSlot(t)}
                            aria-pressed={!blocked}
                            aria-label={`${t} ${blocked ? "bloqueada" : "disponible"}`}
                            className="min-h-[46px] cursor-pointer rounded-full"
                            style={{
                              fontFamily: mono,
                              fontSize: 16,
                              border: `1px solid ${blocked ? C.border : C.accent}`,
                              background: blocked ? "transparent" : C.accentBg,
                              color: blocked ? C.faint : C.accentText,
                              textDecoration: blocked ? "line-through" : "none",
                            }}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
                {!selBase.length && (
                  <div style={{ fontSize: 15, lineHeight: 1.6, color: C.dim }}>
                    Este día no abres según tu horario semanal. Actívalo abajo si quieres trabajar estos días.
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <section className="admin-card flex flex-col gap-2">
          <div className="flex flex-col gap-1 pb-4" style={{ borderBottom: `1px solid ${C.line}` }}>
            <h2 style={{ margin: 0, fontFamily: serif, fontWeight: 700, fontSize: 24 }}>Horario semanal</h2>
            <div style={{ fontSize: 14, color: C.dim }}>Tu horario de siempre. Escribe la hora como 9:00 o 13:30.</div>
          </div>
          {WEEK_ORDER.map((wd) => {
            const d = cfg.week[wd];
            const name = LONG_DAY[wd];
            return (
              <div
                key={wd}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-4 md:grid-cols-[140px_56px_minmax(0,1fr)] md:gap-[18px]"
                style={{ borderBottom: `1px solid ${C.lineSoft}` }}
              >
                <div style={{ fontSize: 16, color: d.open ? C.text : C.dim }}>{name}</div>
                <Toggle
                  on={d.open}
                  label={`${name}: ${d.open ? "abierto" : "cerrado"}`}
                  onClick={() =>
                    update((c) => {
                      const day = c.week[wd];
                      day.open = !day.open;
                      if (day.open && !day.blocks.length) day.blocks = STD();
                    })
                  }
                />
                <div className="col-span-full flex flex-wrap items-center gap-3 md:col-auto">
                  {d.open ? (
                    <>
                      {d.blocks.map((b, bi) => {
                        const set = (idx: 0 | 1) => (v: string) => update((c) => void (c.week[wd].blocks[bi][idx] = cleanTimeInput(v)));
                        const fix = (idx: 0 | 1) => () => {
                          const v = parseT(cfg.week[wd].blocks[bi][idx]);
                          if (v != null) setCfg((prev) => {
                            const next = clone(prev);
                            next.week[wd].blocks[bi][idx] = toT(v);
                            return next;
                          });
                        };
                        return (
                          <div key={bi} className="flex items-center gap-2">
                            <input
                              type="text"
                              inputMode="numeric"
                              autoComplete="off"
                              maxLength={5}
                              placeholder="9:00"
                              value={b[0]}
                              onChange={(e) => set(0)(e.target.value)}
                              onBlur={fix(0)}
                              aria-label={`${name}, horario ${bi + 1}: desde`}
                              aria-invalid={badTime(b[0])}
                              className="admin-time"
                              style={{ borderColor: badTime(b[0]) ? C.danger : C.border }}
                            />
                            <span style={{ fontSize: 14, color: C.dim }}>a</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              autoComplete="off"
                              maxLength={5}
                              placeholder="12:00"
                              value={b[1]}
                              onChange={(e) => set(1)(e.target.value)}
                              onBlur={fix(1)}
                              aria-label={`${name}, horario ${bi + 1}: hasta`}
                              aria-invalid={badTime(b[1])}
                              className="admin-time"
                              style={{ borderColor: badTime(b[1]) ? C.danger : C.border }}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                update((c) => {
                                  c.week[wd].blocks.splice(bi, 1);
                                  if (!c.week[wd].blocks.length) c.week[wd].open = false;
                                })
                              }
                              aria-label={`Quitar horario ${bi + 1} del ${name.toLowerCase()}`}
                              className="admin-x-btn"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                      {d.blocks.length < 8 && (
                        <button type="button" onClick={() => update((c) => void c.week[wd].blocks.push(["", ""]))} className="admin-add-btn">
                          + Agregar horario
                        </button>
                      )}
                    </>
                  ) : (
                    <span style={{ fontFamily: mono, fontSize: 12, letterSpacing: ".08em", color: C.faint, textTransform: "uppercase" }}>Cerrado</span>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}
