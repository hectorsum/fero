import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import LoginForm from "@/presentation/auth/LoginForm";

export const metadata: Metadata = {
  title: "Acceso — FERO",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <div
      className="login-page flex min-h-screen flex-col items-center justify-center gap-7 px-4 py-12 sm:px-6"
      style={{ fontFamily: "var(--font-body)" }}
    >
      <Link href="/" className="flex flex-col items-center gap-2.5" style={{ textDecoration: "none" }} aria-label="FERO — volver a agendar">
        <Image src="/fero-logo.png" alt="" width={96} height={96} priority />
        <div
          style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 44, lineHeight: 1, letterSpacing: ".04em", color: "var(--color-text)" }}
        >
          FERO
        </div>
      </Link>
      <LoginForm />
      <Link href="/" className="back-link">
        ← Volver a agendar
      </Link>
    </div>
  );
}
