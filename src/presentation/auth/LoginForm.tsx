"use client";

import { useState, type FormEvent } from "react";
import { isValidEmail } from "@/domain/value-objects/ContactInfo";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email) || !pass) setError("Ingresa tu correo y contraseña.");
    // La autenticación real se conectará junto con el panel de citas.
    else setError("El acceso al panel estará disponible pronto.");
  };

  return (
    <form onSubmit={submit} noValidate className="card flex w-full max-w-[400px] flex-col gap-5 px-6 py-8 sm:px-[34px] sm:py-9">
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
          type="email"
          autoComplete="email"
          placeholder="fero@correo.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
        />
      </div>
      <div className="field">
        <label htmlFor="l-pass">Contraseña</label>
        <input
          className="input"
          id="l-pass"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={pass}
          onChange={(e) => {
            setPass(e.target.value);
            setError("");
          }}
        />
      </div>
      {error && (
        <div role="alert" style={{ fontSize: 13, color: "#e0866b" }}>
          {error}
        </div>
      )}
      <button type="submit" className="next-btn cursor-pointer py-3.5 text-[13px] uppercase tracking-[.14em]" style={{ borderRadius: "var(--radius-md)" }}>
        Entrar
      </button>
    </form>
  );
}
