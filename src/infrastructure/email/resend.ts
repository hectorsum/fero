import type { EmailContent } from "./templates/shared";

/** Remitente de prueba de Resend: sin dominio verificado solo puede enviar al dueño de la cuenta. */
export const RESEND_TEST_FROM = "FERO <onboarding@resend.dev>";

export interface ResendEnv {
  apiKey: string;
  /** Destinatario de los avisos al admin. */
  to: string;
  from: string;
}

export function resendEnv(): ResendEnv | null {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
  if (!apiKey || !to) return null;
  return { apiKey, to, from: process.env.NOTIFY_FROM || RESEND_TEST_FROM };
}

export const isResendTestSender = (from: string) => /@resend\.dev>?\s*$/i.test(from.trim());

export async function sendEmail(
  env: Pick<ResendEnv, "apiKey" | "from">,
  msg: EmailContent & { to: string; replyTo: string; idempotencyKey: string },
): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.apiKey}`,
      "Content-Type": "application/json",
      // Evita correos duplicados si se reintenta el mismo envío.
      "Idempotency-Key": msg.idempotencyKey,
    },
    body: JSON.stringify({
      from: env.from,
      to: [msg.to],
      reply_to: msg.replyTo,
      subject: msg.subject,
      text: msg.text,
      html: msg.html,
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text().catch(() => "")).slice(0, 300)}`);
}
