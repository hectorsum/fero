import { Body, Column, Container, Head, Html, Img, Preview, Row, Section, Text } from "@react-email/components";
import type { ReactNode } from "react";

export const colors = {
  page: "#f4f2ec",
  card: "#ffffff",
  dark: "#1d1d1d",
  text: "#1d1d1d",
  muted: "#6b675f",
  line: "#e6e2d8",
  accent: "#b8d42c",
  accentDark: "#5a6b00",
};

export const font = "Georgia, 'Times New Roman', serif";
export const sans = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/**
 * Marco común: cabecera oscura con el logo, contenido y pie. Las imágenes son URLs absolutas
 * (`assetsUrl`): Gmail bloquea las incrustadas en base64.
 */
export function EmailLayout({
  preview,
  assetsUrl,
  banner = false,
  children,
  footer,
}: {
  preview: string;
  assetsUrl: string;
  banner?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Html lang="es" dir="ltr">
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={{ margin: 0, padding: "24px 0", backgroundColor: colors.page, fontFamily: sans, color: colors.text }}>
        <Container style={{ width: "100%", maxWidth: 600, backgroundColor: colors.card, borderRadius: 12, overflow: "hidden" }}>
          <Section style={{ backgroundColor: colors.dark, padding: "20px 32px" }}>
            <Row>
              <Column style={{ width: 56 }}>
                <Img src={`${assetsUrl}/email/logo.png`} width={48} height={48} alt="FERO" style={{ display: "block" }} />
              </Column>
              <Column>
                <Text style={{ margin: 0, fontFamily: font, fontSize: 24, fontWeight: 700, letterSpacing: 3, color: "#eeeae0" }}>FERO</Text>
                <Text style={{ margin: 0, fontSize: 12, letterSpacing: 1.5, color: colors.accent }}>BARBERSHOP · TATTOO STUDIO</Text>
              </Column>
            </Row>
          </Section>
          {banner && (
            <Img
              src={`${assetsUrl}/email/banner.jpg`}
              width={600}
              alt="Interior de la barbería FERO"
              style={{ display: "block", width: "100%", height: "auto" }}
            />
          )}
          <Section style={{ padding: "32px 32px 8px" }}>{children}</Section>
          <Section style={{ padding: "16px 32px 28px" }}>
            <Text style={{ margin: 0, fontSize: 12, lineHeight: "18px", color: colors.muted }}>
              {footer ?? "FERO — Barbershop · Tattoo Studio"}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

/** Tabla de datos clave/valor. */
export function Details({ rows }: { rows: [string, string][] }) {
  return (
    <Section style={{ border: `1px solid ${colors.line}`, borderRadius: 8, padding: "4px 20px", margin: "8px 0 24px" }}>
      {rows.map(([k, v], i) => (
        <Row key={k} style={{ borderTop: i === 0 ? "none" : `1px solid ${colors.line}` }}>
          <Column style={{ width: 120, padding: "12px 0", verticalAlign: "top" }}>
            <Text style={{ margin: 0, fontSize: 13, color: colors.muted }}>{k}</Text>
          </Column>
          <Column style={{ padding: "12px 0", verticalAlign: "top" }}>
            <Text style={{ margin: 0, fontSize: 15, color: colors.text, whiteSpace: "pre-wrap" }}>{v}</Text>
          </Column>
        </Row>
      ))}
    </Section>
  );
}
