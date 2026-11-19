const ADDRESS = "Av Republica de Panama 5920, Miraflores";
const SHOP_PHONE = "999 333 222";
const BARBER_EMAIL = "fero@gmail.com";

const kicker: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: ".16em",
  textTransform: "uppercase",
  color: "var(--color-accent-700)",
};

function ContactRow({
  icon,
  label,
  value,
  tabular,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tabular?: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
      {icon}
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <div style={kicker}>{label}</div>
        <div
          style={{
            fontSize: 14,
            lineHeight: 1.6,
            color: "var(--color-neutral-700)",
            fontFeatureSettings: tabular ? "'tnum'" : undefined,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function ContactIcon({ path }: { path: React.ReactNode }) {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--color-accent)"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flex: "none", marginTop: 2 }}
    >
      {path}
    </svg>
  );
}

function SocialLink({
  icon,
  name,
  handle,
}: {
  icon: React.ReactNode;
  name: string;
  handle: string;
}) {
  return (
    <a href="#" style={{ display: "flex", gap: 12, alignItems: "center", textDecoration: "none" }}>
      <svg
        width={18}
        height={18}
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flex: "none" }}
      >
        {icon}
      </svg>
      <span style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 13.5, color: "var(--color-text)" }}>{name}</span>
        <span style={{ fontSize: 12.5, color: "var(--color-neutral-500)" }}>{handle}</span>
      </span>
    </a>
  );
}

export default function Sidebar() {
  return (
    <aside
      className="card flex flex-col gap-6 p-6 sm:p-7 lg:sticky lg:top-6"
    >
      <h2
        style={{
          margin: 0,
          fontFamily: "var(--font-heading)",
          fontWeight: 600,
          fontSize: 25,
          color: "var(--color-text)",
        }}
      >
        Visita la barbería
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <ContactRow
          icon={
            <ContactIcon
              path={
                <>
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx={12} cy={10} r={3} />
                </>
              }
            />
          }
          label="Dirección"
          value={ADDRESS}
        />
        <ContactRow
          icon={
            <ContactIcon
              path={
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              }
            />
          }
          label="Teléfono"
          value={SHOP_PHONE}
          tabular
        />
        <ContactRow
          icon={
            <ContactIcon
              path={
                <>
                  <rect x={2} y={4} width={20} height={16} rx={2} />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </>
              }
            />
          }
          label="Email"
          value={BARBER_EMAIL}
        />
      </div>

      <div
        style={{
          borderTop: "1px solid var(--color-divider)",
          paddingTop: 22,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={kicker}>Horario</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "var(--color-neutral-700)" }}>
          <span>Lun – Sáb</span>
          <span style={{ fontFeatureSettings: "'tnum'" }}>9:00 – 12:00</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "var(--color-neutral-700)" }}>
          <span></span>
          <span style={{ fontFeatureSettings: "'tnum'" }}>14:00 – 21:00</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "var(--color-neutral-500)" }}>
          <span>Domingo</span>
          <span>Cerrado</span>
        </div>
      </div>

      <div
        style={{
          borderTop: "1px solid var(--color-divider)",
          paddingTop: 22,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div style={kicker}>Síguenos</div>
        <SocialLink
          icon={
            <>
              <rect x={2} y={2} width={20} height={20} rx={5} />
              <circle cx={12} cy={12} r={4} />
              <circle cx={17.5} cy={6.5} r={0.8} fill="var(--color-accent)" />
            </>
          }
          name="Instagram"
          handle="@fero.cuts"
        />
        <SocialLink
          icon={<path d="M9 12a4 4 0 1 0 4 4V4c.55 1.9 2.1 3.5 4 4" />}
          name="TikTok"
          handle="@feroink"
        />
        <SocialLink
          icon={<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />}
          name="Facebook"
          handle="Fero Barbershop & Tattoo"
        />
      </div>
    </aside>
  );
}
