import Header from "@/presentation/layout/Header";
import Sidebar from "@/presentation/layout/Sidebar";
import Footer from "@/presentation/layout/Footer";
import BookingWizard from "@/presentation/booking/BookingWizard";
import { defaultAvailability, type Availability } from "@/domain/entities/Availability";
import { createServerClient } from "@/infrastructure/supabase/server";
import { SupabaseAvailabilityRepository } from "@/infrastructure/supabase/SupabaseAvailabilityRepository";
import type { Metadata } from "next";
import { siteUrl } from "@/infrastructure/config/shop";
import LocalBusinessJsonLd from "@/presentation/seo/LocalBusinessJsonLd";
import { OPEN_GRAPH } from "@/presentation/seo/metadata";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { ...OPEN_GRAPH, url: "/" },
};

/** Disponibilidad para pintar el calendario. Si falla, se usa el horario por defecto:
 * el servidor igual valida cada reserva contra la disponibilidad real. */
async function getPublicAvailability(): Promise<Availability> {
  // Fuera del try: cookies() marca la ruta como dinámica y ese aviso no debe tratarse como fallo.
  const db = await createServerClient();
  try {
    return await new SupabaseAvailabilityRepository(db).get();
  } catch (e) {
    console.error("[availability]", e);
    return defaultAvailability();
  }
}

/**
 * La site key de Turnstile es pública. Se lee en el servidor en cada petición (la página es dinámica).
 * Sin prefijo NEXT_PUBLIC_ a propósito: Next incrusta esas variables al compilar (también en código de
 * servidor), y un valor viejo puede quedar en la caché de .next aunque cambies el .env.
 */
const turnstileSiteKey = () => process.env.TURNSTILE_SITE_KEY ?? "";

export default async function Home() {
  const availability = await getPublicAvailability();
  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "var(--font-body)" }}>
      <LocalBusinessJsonLd availability={availability} siteUrl={siteUrl()} />
      <Header />
      <main className="flex-1 flex justify-center px-4 py-8 sm:px-6 sm:py-10 lg:px-6 lg:pt-12 lg:pb-[72px]">
        <div className="w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_330px] gap-10 lg:gap-11 items-start">
          <BookingWizard availability={availability} turnstileSiteKey={turnstileSiteKey()} />
          <Sidebar />
        </div>
      </main>
      <Footer />
    </div>
  );
}
