"use server";

import { redirect } from "next/navigation";
import { sanitizeCredentials } from "@/domain/value-objects/Credentials";
import { clientIp, consumeLoginAttempt } from "@/infrastructure/auth/rate-limit";
import { createServerClient } from "@/infrastructure/supabase/server";

/** `email` se devuelve para rellenar de nuevo el campo (React resetea el formulario tras la acción). */
export type LoginState = { error: string | null; /** Epoch ms hasta el que el login está bloqueado (0 = libre). */ retryAt: number; email: string };

const INVALID = "Correo o contraseña incorrectos.";

export async function signInAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const ip = await clientIp();
  const supabase = await createServerClient();

  // El intento se cuenta incluso si la entrada es inválida, para que no sirva de sonda gratuita.
  const rawEmail = formData.get("email");
  const emailKey = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase().slice(0, 254) : "";
  const wait = await consumeLoginAttempt(supabase, ip, emailKey);
  if (wait > 0) {
    const min = Math.ceil(wait / 60);
    return { error: `Demasiados intentos. Vuelve a intentarlo en ${min} ${min === 1 ? "minuto" : "minutos"}.`, retryAt: Date.now() + wait * 1000, email: emailKey };
  }

  const creds = sanitizeCredentials(rawEmail, formData.get("password"));
  if (!creds) return { error: INVALID, retryAt: 0, email: emailKey };

  const { error } = await supabase.auth.signInWithPassword(creds);
  if (error) return { error: INVALID, retryAt: 0, email: creds.email };

  // Solo los admins pueden usar el panel: cualquier otra cuenta se cierra y recibe el mismo mensaje.
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) {
    await supabase.auth.signOut();
    return { error: INVALID, retryAt: 0, email: creds.email };
  }

  redirect("/admin");
}

export async function signOutAction() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
