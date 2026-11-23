import { Button, Heading, Section, Text } from "@react-email/components";
import { colors, Details, EmailLayout, font } from "./_components/EmailLayout";

export interface AdminBookingProps {
  name: string;
  phone: string;
  email: string;
  service: string;
  dateLabel: string;
  time: string;
  durationMin: number;
  notes: string;
  /** wa.me del cliente, o null si el teléfono no tiene dígitos suficientes. */
  customerWhatsappUrl: string | null;
  assetsUrl: string;
}

export default function AdminBookingEmail(p: AdminBookingProps) {
  return (
    <EmailLayout preview={`${p.name} — ${p.dateLabel}, ${p.time}`} assetsUrl={p.assetsUrl} footer="Agendado desde la web de FERO.">
      <Heading as="h1" style={{ margin: "0 0 8px", fontFamily: font, fontSize: 24, lineHeight: "30px", color: colors.text }}>
        Nueva cita
      </Heading>
      <Text style={{ margin: "0 0 16px", fontSize: 16, lineHeight: "24px" }}>
        {p.dateLabel}, {p.time} · {p.service}
      </Text>

      <Details
        rows={[
          ["Cliente", p.name],
          ["Teléfono", p.phone],
          ["Correo", p.email],
          ["Servicio", p.service],
          ["Fecha", `${p.dateLabel}, ${p.time}`],
          ["Duración", `${p.durationMin} min`],
          ...(p.notes ? ([["Notas", p.notes]] as [string, string][]) : []),
        ]}
      />

      {p.customerWhatsappUrl && (
        <Section style={{ margin: "0 0 20px" }}>
          <Button
            href={p.customerWhatsappUrl}
            style={{ borderRadius: 8, padding: "14px 22px", fontSize: 15, fontWeight: 600, backgroundColor: colors.accent, color: colors.dark }}
          >
            Escribir al cliente por WhatsApp
          </Button>
        </Section>
      )}
      <Text style={{ margin: "0 0 8px", fontSize: 14, lineHeight: "22px", color: colors.muted }}>
        Responde a este correo para escribirle al cliente.
      </Text>
    </EmailLayout>
  );
}

AdminBookingEmail.PreviewProps = {
  name: "María Pérez",
  phone: "924 230 225",
  email: "maria@example.com",
  service: "Servicio completo (Corte + Barba)",
  dateLabel: "miércoles, 25 de noviembre",
  time: "14:00",
  durationMin: 120,
  notes: "Degradado bajo, por favor.",
  customerWhatsappUrl: "https://wa.me/51924230225",
  assetsUrl: "https://fero.ink",
} satisfies AdminBookingProps;
