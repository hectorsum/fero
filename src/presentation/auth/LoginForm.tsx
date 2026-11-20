"use client";

import { useActionState, useEffect, useState, type FormEvent } from "react";
import { signInAction, type LoginState } from "@/app/login/actions";
import { MAX_EMAIL_LENGTH, MAX_PASSWORD_LENGTH, sanitizeCredentials } from "@/domain/value-objects/Credentials";

const INITIAL: LoginState = { error: null, retryAt: 0, email: "" };

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(signInAction, INITIAL);
  const [clientError, setClientError] = useState("");
  const [now, setNow] = useState(() => Date.now());

  // Reloj para la cuenta regresiva mientras el login está bloqueado por rate limit.
  useEffect(() => {
    if (state.retryAt <= Date.now()) return;
    const id = setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= state.retryAt) clearInterval(id);
    }, 250);
    return () => clearInterval(id);
  }, [state.retryAt]);

  // Segundos de bloqueo restantes.
  const cooldown = Math.max(0, Math.ceil((state.retryAt - now) / 1000));

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    const fd = new FormData(e.currentTarget);
    // Misma validación que el servidor, solo para dar feedback inmediato; el servidor vuelve a validar.
    if (!sanitizeCredentials(fd.get("email"), fd.get("password"))) {
      e.preventDefault();
      setClientError("Ingresa un correo válido y tu contraseña (mínimo 8 caracteres).");
      return;
    }
    setClientError("");
  };

  const locked = cooldown > 0;
  const error = clientError || state.error;
  const mm = Math.floor(cooldown / 60);
  const ss = String(cooldown % 60).padStart(2, "0");

  return (
    <form action={formAction} onSubmit={onSubmit} noValidate className="card flex w-full max-w-[400px] flex-col gap-5 px-6 py-8 sm:px-[34px] sm:py-9">
      <div className="flex flex-col gap-1.5">
        <div className="kicker">Acceso</div>
        <h1 style={{ margin: 0, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 28, color: "var(--color-text)" }}>
          Panel de citas
        </h1>
      </div>
      <div className="field">
        <label htmlFor="l-mail">Correo electrónico</label>
        <input
          className="input"
          id="l-mail"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={MAX_EMAIL_LENGTH}
          placeholder="fero@correo.com"
          key={state.email}
          defaultValue={state.email}
          required
          disabled={pending}
          onChange={() => setClientError("")}
        />
      </div>
      <div className="field">
        <label htmlFor="l-pass">Contraseña</label>
        <input
          className="input"
          id="l-pass"
          name="password"
          type="password"
          autoComplete="current-password"
          maxLength={MAX_PASSWORD_LENGTH}
          placeholder="••••••••"
          required
          disabled={pending}
          onChange={() => setClientError("")}
        />
      </div>
      {error && (
        <div role="alert" style={{ fontSize: 13, color: "#e0866b" }}>
          {error}
          {locked && ` (${mm}:${ss})`}
        </div>
      )}
      <button
        type="submit"
        disabled={pending || locked}
        className="next-btn cursor-pointer py-3.5 text-[13px] uppercase tracking-[.14em] disabled:cursor-not-allowed disabled:opacity-60"
        style={{ borderRadius: "var(--radius-md)" }}
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
