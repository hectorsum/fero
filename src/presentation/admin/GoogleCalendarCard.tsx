"use client";

import { useEffect, useState, useTransition } from "react";
import { disconnectGoogleAction, setGoogleOptionsAction } from "@/app/admin/actions";
import type { GoogleStatus } from "@/infrastructure/google/GoogleCalendarConnection";

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
  warn: "#d9a441",
  danger: "#e0866b",
  bg: "#0e0c09",
};
const mono = "var(--font-fero-mono), monospace";
const serif = "var(--font-heading), serif";

function Toggle({ on, onClick, label, disabled }: { on: boolean; onClick: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="relative h-[26px] w-[46px] shrink-0 cursor-pointer rounded-full p-0 disabled:cursor-wait"
      style={{ border: `1px solid ${on ? C.accent : C.border}`, background: on ? C.accent : "transparent" }}
    >
      <span className="absolute top-[3px] h-[18px] w-[18px] rounded-full transition-[left] duration-150" style={{ left: on ? 24 : 3, background: on ? C.bg : C.faint }} />
    </button>
  );
}

const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
    <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2.1 5-4.4 6.6v5.5h7.1c4.2-3.9 6.6-9.6 6.6-16.1z" />
    <path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.4l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.7C8.1 41 15.5 46 24 46z" />
    <path fill="#FBBC05" d="M11.8 28.2c-.4-1.3-.7-2.7-.7-4.2s.3-2.9.7-4.2v-5.7H4.5C3 17.1 2 20.4 2 24s1 6.9 2.5 9.9l7.3-5.7z" />
    <path fill="#EA4335" d="M24 10.8c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 4.2 29.9 2 24 2 15.5 2 8.1 7 4.5 14.1l7.3 5.7c1.7-5.2 6.5-9 12.2-9z" />
  </svg>
);

interface Props {
  status: GoogleStatus;
  notice: { text: string; ok: boolean } | null;
}

export default function GoogleCalendarCard({ status, notice }: Props) {
  const connected = status.configured && status.connected;
  const [opts, setOpts] = useState(() =>
    status.configured && status.connected ? { syncEvents: status.syncEvents, respectBusy: status.respectBusy } : { syncEvents: true, respectBusy: true },
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [connecting, setConnecting] = useState(false);

  // Quita ?google=… de la URL para que el aviso no reaparezca al recargar.
  useEffect(() => {
    if (notice) window.history.replaceState(null, "", "/admin");
  }, [notice]);

  const setOpt = (key: "syncEvents" | "respectBusy") => {
    const next = { ...opts, [key]: !opts[key] };
    setOpts(next);
    setError(null);
    start(async () => {
      const res = await setGoogleOptionsAction({ [key]: next[key] }).catch(() => ({ ok: false as const, message: "Sin conexión." }));
      if (!res.ok) {
        setOpts(opts);
        setError(res.message);
      }
    });
  };

  const disconnect = () => {
    if (!window.confirm("¿Desconectar Google Calendar? Las nuevas citas dejarán de agregarse a tu calendario.")) return;
    setError(null);
    start(async () => {
      const res = await disconnectGoogleAction().catch(() => ({ ok: false as const, message: "Sin conexión." }));
      if (!res.ok) setError(res.message);
    });
  };

  return (
    <section className="admin-card flex flex-col gap-[18px]" style={{ borderColor: connected ? "rgba(184,212,44,.35)" : undefined }}>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-12 w-12 flex-none items-center justify-center" style={{ borderRadius: "var(--radius-md)", background: C.text }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={C.bg} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
            <path d="M9 15l2 2 4-4" />
          </svg>
        </div>
        <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-1">
          <h2 style={{ margin: 0, fontFamily: serif, fontWeight: 700, fontSize: 22 }}>Google Calendar</h2>
          <div style={{ fontSize: 14, lineHeight: 1.5, color: C.muted }}>
            {connected
              ? "Las citas confirmadas se agregan solas a tu calendario."
              : "Conecta tu calendario para que las citas de tus clientes se agenden directo en él, y no te reserven cuando ya estás ocupado."}
          </div>
        </div>
        {!status.configured && (
          <span
            className="flex min-h-11 flex-1 items-center justify-center px-5 md:flex-none"
            style={{ border: `1px dashed ${C.border}`, borderRadius: "var(--radius-md)", color: C.dim, fontFamily: mono, fontSize: 12 }}
          >
            Falta configurar en el servidor
          </span>
        )}
        {status.configured && !status.connected && (
          <a
            href="/admin/google/connect"
            onClick={() => setConnecting(true)}
            aria-disabled={connecting}
            className="admin-google-btn flex min-h-11 flex-1 items-center justify-center gap-2.5 px-5 md:flex-none"
          >
            <GoogleLogo />
            {connecting ? "Conectando…" : "Conectar con Google"}
          </a>
        )}
        {connected && (
          <div className="flex items-center gap-2" style={{ fontFamily: mono, fontSize: 12, color: C.accentText }}>
            <span className="h-2 w-2 rounded-full" style={{ background: C.accent }} />
            Conectado
          </div>
        )}
      </div>

      {notice && (
        <div role="status" style={{ fontSize: 14, color: notice.ok ? C.accentText : C.danger }}>
          {notice.text}
        </div>
      )}
      {connected && status.lastError && (
        <div role="alert" style={{ fontSize: 14, color: C.warn }}>
          {status.lastError}
        </div>
      )}
      {error && (
        <div role="alert" style={{ fontSize: 14, color: C.danger }}>
          {error}
        </div>
      )}

      {status.configured && status.connected && (
        <div className="flex flex-col gap-1 pt-4" style={{ borderTop: `1px solid ${C.line}` }}>
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
            <div className="flex min-w-0 flex-col gap-0.5">
              <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: C.dim }}>Cuenta</div>
              <div style={{ fontSize: 15, color: C.text, overflowWrap: "anywhere" }}>{status.email}</div>
            </div>
            <button type="button" onClick={disconnect} disabled={pending} className="admin-danger-ghost-btn">
              Desconectar
            </button>
          </div>
          {(
            [
              ["syncEvents", "Crear evento por cada cita", "Nombre, servicio y teléfono del cliente en el evento."],
              ["respectBusy", "Respetar eventos de Google", "Las horas ocupadas en tu calendario no se ofrecen a los clientes."],
            ] as const
          ).map(([key, title, desc]) => (
            <div key={key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
              <div className="flex flex-col gap-[3px]">
                <div style={{ fontSize: 15, color: C.text }}>{title}</div>
                <div style={{ fontSize: 13, lineHeight: 1.5, color: C.dim }}>{desc}</div>
              </div>
              <Toggle on={opts[key]} onClick={() => setOpt(key)} label={title} disabled={pending} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
