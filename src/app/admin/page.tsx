import type { Metadata } from "next";
import { shopNow } from "@/domain/services/scheduling";
import { requireAdmin } from "@/infrastructure/auth/session";
import { SHOP_TIMEZONE } from "@/infrastructure/config/shop";
import { SupabaseAvailabilityRepository } from "@/infrastructure/supabase/SupabaseAvailabilityRepository";
import { GoogleCalendarConnectionRepo, type GoogleStatus } from "@/infrastructure/google/GoogleCalendarConnection";
import { isGoogleConfigured } from "@/infrastructure/google/oauth";
import { createServiceClient } from "@/infrastructure/supabase/service";
import AdminPanel from "@/presentation/admin/AdminPanel";

async function googleStatus(): Promise<GoogleStatus> {
  if (!isGoogleConfigured()) return { configured: false };
  try {
    return await new GoogleCalendarConnectionRepo(createServiceClient()).status();
  } catch (e) {
    console.error("[google status]", e);
    return { configured: true, connected: false };
  }
}

const GOOGLE_NOTICES: Record<string, string> = {
  connected: "Google Calendar conectado.",
  denied: "Cancelaste la conexión con Google.",
  invalid: "La conexión con Google expiró o no es válida. Inténtalo de nuevo.",
  scopes: "Para conectar, marca los permisos de calendario que pide Google.",
  no_refresh: "Google no entregó acceso permanente. Quita el acceso de FERO en tu cuenta de Google y vuelve a conectar.",
  not_configured: "Falta configurar las credenciales de Google en el servidor.",
  error: "No pudimos conectar con Google. Inténtalo de nuevo.",
};

export const metadata: Metadata = {
  title: "Admin — FERO",
  robots: { index: false, follow: false },
};

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ google?: string | string[] }> }) {
  // El proxy ya filtra /admin; aquí se verifica de nuevo contra Supabase Auth y la tabla admins.
  const { supabase, user } = await requireAdmin();
  const [availability, google, sp] = await Promise.all([new SupabaseAvailabilityRepository(supabase).get(), googleStatus(), searchParams]);
  const notice = typeof sp.google === "string" ? (GOOGLE_NOTICES[sp.google] ?? null) : null;
  return (
    <AdminPanel
      initial={availability}
      email={user.email ?? ""}
      today={shopNow(new Date(), SHOP_TIMEZONE).date}
      google={google}
      googleNotice={notice ? { text: notice, ok: sp.google === "connected" } : null}
    />
  );
}
