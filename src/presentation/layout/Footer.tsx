import Link from "next/link";

export default function Footer() {
  return (
    <footer
      className="flex justify-center px-4 py-6 sm:px-6"
      style={{ background: "#0a0a0a", borderTop: "1px solid var(--color-divider)" }}
    >
      <div className="flex w-full max-w-[1200px] flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p style={{ margin: 0, fontSize: 13, color: "var(--color-neutral-500)" }}>
          {`© ${new Date().getFullYear()} FERO · Barbershop & Tattoo Studio`}
        </p>
        <div className="flex items-center gap-5">
          <Link href="/privacidad" className="footer-link">
            Privacidad
          </Link>
          <Link href="/login" className="footer-link">
            Acceso
          </Link>
        </div>
      </div>
    </footer>
  );
}
