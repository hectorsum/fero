"use server";

import { revalidatePath } from "next/cache";
import { InvalidAvailabilityError, parseAvailability } from "@/domain/entities/Availability";
import { ForbiddenError } from "@/domain/repositories/AvailabilityRepository";
import { shopNow } from "@/domain/services/scheduling";
import { getAdmin } from "@/infrastructure/auth/session";
import { SHOP_TIMEZONE } from "@/infrastructure/config/shop";
import { GoogleCalendarConnectionRepo } from "@/infrastructure/google/GoogleCalendarConnection";
import { revokeToken } from "@/infrastructure/google/oauth";
import { createServiceClient } from "@/infrastructure/supabase/service";
import { SupabaseAvailabilityRepository } from "@/infrastructure/supabase/SupabaseAvailabilityRepository";

export type SaveResult = { ok: true } | { ok: false; message: string; signedOut?: boolean };

export async function saveAvailabilityAction(raw: unknown): Promise<SaveResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, message: "Tu sesión expiró. Vuelve a iniciar sesión.", signedOut: true };
  try {
    // Valida y normaliza todo lo que llega del cliente; descarta excepciones de días pasados.
    const av = parseAvailability(raw, shopNow(new Date(), SHOP_TIMEZONE).date);
    await new SupabaseAvailabilityRepository(admin.supabase).save(av);
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    if (e instanceof InvalidAvailabilityError) return { ok: false, message: e.message };
    if (e instanceof ForbiddenError) return { ok: false, message: "No tienes permiso para editar la disponibilidad.", signedOut: true };
    console.error("[admin save]", e);
    return { ok: false, message: "No pudimos guardar. Inténtalo de nuevo." };
  }
}

// ─── Google Calendar ──────────────────────────────────────────────────────────────

export async function setGoogleOptionsAction(raw: unknown): Promise<SaveResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, message: "Tu sesión expiró. Vuelve a iniciar sesión.", signedOut: true };
  const o = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const opts = {
    syncEvents: typeof o.syncEvents === "boolean" ? o.syncEvents : undefined,
    respectBusy: typeof o.respectBusy === "boolean" ? o.respectBusy : undefined,
  };
  try {
    await new GoogleCalendarConnectionRepo(createServiceClient()).setOptions(opts);
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    console.error("[google options]", e);
    return { ok: false, message: "No pudimos guardar la opción. Inténtalo de nuevo." };
  }
}

export async function disconnectGoogleAction(): Promise<SaveResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, message: "Tu sesión expiró. Vuelve a iniciar sesión.", signedOut: true };
  try {
    const repo = new GoogleCalendarConnectionRepo(createServiceClient());
    const conn = await repo.get().catch(() => null);
    if (conn) await revokeToken(conn.refreshToken);
    await repo.delete();
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    console.error("[google disconnect]", e);
    return { ok: false, message: "No pudimos desconectar Google Calendar. Inténtalo de nuevo." };
  }
}
