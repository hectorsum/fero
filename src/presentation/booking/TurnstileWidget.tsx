"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

interface TurnstileApi {
  render(
    el: HTMLElement,
    opts: {
      sitekey: string;
      action?: string;
      theme?: "light" | "dark" | "auto";
      language?: string;
      callback: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
      "timeout-callback"?: () => void;
    },
  ): string;
  remove(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
/** Sin site key en desarrollo: el servidor (sin secret) también deja pasar. */
const DEV_TOKEN = "dev-sin-turnstile";

const message: React.CSSProperties = { margin: 0, fontSize: 13.5, lineHeight: 1.6, color: "var(--color-accent-700)" };

/**
 * Cloudflare Turnstile en modo explícito. Avisa con `onToken(token)` cuando hay token y con
 * `onToken(null)` cuando caduca o falla. Los tokens son de un solo uso: para pedir uno nuevo,
 * vuelve a montar el componente (cambiando su `key`).
 */
export default function TurnstileWidget({ onToken }: { onToken: (token: string | null) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  const render = () => {
    if (!box.current || !window.turnstile || widgetId.current) return;
    widgetId.current = window.turnstile.render(box.current, {
      sitekey: SITE_KEY,
      action: "booking",
      theme: "dark",
      language: "es",
      callback: (token) => onTokenRef.current(token),
      "expired-callback": () => onTokenRef.current(null),
      "timeout-callback": () => onTokenRef.current(null),
      "error-callback": () => onTokenRef.current(null),
    });
  };

  useEffect(() => {
    if (!SITE_KEY) {
      if (process.env.NODE_ENV !== "production") onTokenRef.current(DEV_TOKEN);
      return;
    }
    // Si el script ya estaba cargado (p. ej. al volver a este paso), onReady no basta en todos los casos.
    render();
    return () => {
      if (widgetId.current) window.turnstile?.remove(widgetId.current);
      widgetId.current = null;
      onTokenRef.current(null);
    };
  }, []);

  if (!SITE_KEY) {
    return process.env.NODE_ENV === "production" ? (
      <p role="alert" style={message}>
        La verificación anti-spam no está disponible en este momento. Escríbenos por WhatsApp para agendar.
      </p>
    ) : null;
  }

  return (
    <div className="flex flex-col gap-2">
      <Script src={SCRIPT_SRC} strategy="afterInteractive" onReady={render} onError={() => setBlocked(true)} />
      <div ref={box} style={{ minHeight: 65 }} />
      {blocked && (
        <p role="alert" style={message}>
          No pudimos cargar la verificación anti-spam. Si usas un bloqueador de anuncios o de scripts, desactívalo para este sitio y
          recarga la página.
        </p>
      )}
    </div>
  );
}
