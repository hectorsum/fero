import { Button, Heading, Link, Section, Text } from "@react-email/components";
import { colors, Details, EmailLayout, font } from "./_components/EmailLayout";

export interface CustomerConfirmationProps {
  name: string;
  service: string;
  /** "miércoles, 25 de noviembre" */
  dateLabel: string;
  time: string;
  durationMin: number;
  address: string;
  shopPhone: string;
  mapsUrl: string;
  whatsappUrl: string;
  cancelText: string;
  assetsUrl: string;
}

const button = { borderRadius: 8, padding: "14px 22px", fontSize: 15, fontWeight: 600, textDecoration: "none" } as const;

export default function CustomerConfirmationEmail(p: CustomerConfirmationProps) {
  return (
    <EmailLayout
      preview={`Tu cita en FERO: ${p.dateLabel}, ${p.time}`}
      assetsUrl={p.assetsUrl}
      banner
      footer={`${p.address} · ${p.shopPhone}`}
    >
      <Heading as="h1" style={{ margin: "0 0 8px", fontFamily: font, fontSize: 26, lineHeight: "32px", color: colors.text }}>
        ¡Tu cita está confirmada!
      </Heading>
      <Text style={{ margin: "0 0 16px", fontSize: 16, lineHeight: "24px" }}>Hola, {p.name}. Te esperamos en FERO.</Text>

      <Details
        rows={[
          ["Servicio", p.service],
          ["Fecha", p.dateLabel],
          ["Hora", p.time],
          ["Duración", `${p.durationMin} min`],
          ["Dirección", p.address],
        ]}
      />

      <Section style={{ margin: "0 0 20px" }}>
        <Button href={p.mapsUrl} style={{ ...button, backgroundColor: colors.dark, color: "#ffffff", marginRight: 8, marginBottom: 8 }}>
          Cómo llegar
        </Button>
        <Button href={p.whatsappUrl} style={{ ...button, backgroundColor: colors.accent, color: colors.dark, marginBottom: 8 }}>
          Escribir por WhatsApp
        </Button>
      </Section>

      <Text style={{ margin: "0 0 8px", fontSize: 14, lineHeight: "22px", color: colors.muted }}>
        <Link href={p.whatsappUrl} style={{ color: colors.accentDark, textDecoration: "underline" }}>
          {p.cancelText}
        </Link>
        .
      </Text>
    </EmailLayout>
  );
}

CustomerConfirmationEmail.PreviewProps = {
  name: "María Pérez",
  service: "Servicio completo (Corte + Barba)",
  dateLabel: "miércoles, 25 de noviembre",
  time: "14:00",
  durationMin: 120,
  address: "Av Republica de Panama 5920, Miraflores",
  shopPhone: "999 333 222",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Av%20Republica%20de%20Panama%205920%2C%20Miraflores",
  whatsappUrl: "https://wa.me/5215512345678",
  cancelText: "Si necesitas cancelar o reprogramar, avísanos por WhatsApp con anticipación",
  assetsUrl: "https://fero.ink",
} satisfies CustomerConfirmationProps;
