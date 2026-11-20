import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/infrastructure/supabase/database.types";
import { decryptSecret, encryptSecret } from "./crypto";

export interface GoogleConnection {
  email: string;
  refreshToken: string;
  calendarId: string;
  syncEvents: boolean;
  respectBusy: boolean;
  lastError: string | null;
}

/** Lo que ve el panel: nunca incluye el token. */
export type GoogleStatus =
  | { configured: false }
  | { configured: true; connected: false }
  | { configured: true; connected: true; email: string; syncEvents: boolean; respectBusy: boolean; lastError: string | null };

/** Acceso a la fila de conexión con el cliente service_role (la tabla no es accesible para anon/authenticated). */
export class GoogleCalendarConnectionRepo {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async get(): Promise<GoogleConnection | null> {
    const { data, error } = await this.db.from("google_calendar_connection").select("*").eq("id", 1).maybeSingle();
    if (error) throw new Error(`Supabase google_calendar_connection: ${error.code} ${error.message}`);
    if (!data) return null;
    return {
      email: data.email,
      refreshToken: decryptSecret(data.refresh_token_enc),
      calendarId: data.calendar_id,
      syncEvents: data.sync_events,
      respectBusy: data.respect_busy,
      lastError: data.last_error,
    };
  }

  /** Estado para el panel, sin leer ni descifrar el token. */
  async status(): Promise<GoogleStatus> {
    const { data, error } = await this.db
      .from("google_calendar_connection")
      .select("email, sync_events, respect_busy, last_error")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw new Error(`Supabase google_calendar_connection: ${error.code} ${error.message}`);
    if (!data) return { configured: true, connected: false };
    return { configured: true, connected: true, email: data.email, syncEvents: data.sync_events, respectBusy: data.respect_busy, lastError: data.last_error };
  }

  async save(p: { email: string; refreshToken: string; userId: string }) {
    const { error } = await this.db.from("google_calendar_connection").upsert({
      id: 1,
      email: p.email,
      refresh_token_enc: encryptSecret(p.refreshToken),
      calendar_id: "primary",
      connected_at: new Date().toISOString(),
      connected_by: p.userId,
      last_error: null,
      last_error_at: null,
    });
    if (error) throw new Error(`Supabase upsert google_calendar_connection: ${error.code} ${error.message}`);
  }

  async setOptions(p: { syncEvents?: boolean; respectBusy?: boolean }) {
    const patch: Database["public"]["Tables"]["google_calendar_connection"]["Update"] = {};
    if (typeof p.syncEvents === "boolean") patch.sync_events = p.syncEvents;
    if (typeof p.respectBusy === "boolean") patch.respect_busy = p.respectBusy;
    const { error } = await this.db.from("google_calendar_connection").update(patch).eq("id", 1);
    if (error) throw new Error(`Supabase update google_calendar_connection: ${error.code} ${error.message}`);
  }

  async setError(message: string | null) {
    await this.db
      .from("google_calendar_connection")
      .update({ last_error: message?.slice(0, 500) ?? null, last_error_at: message ? new Date().toISOString() : null })
      .eq("id", 1);
  }

  async delete() {
    const { error } = await this.db.from("google_calendar_connection").delete().eq("id", 1);
    if (error) throw new Error(`Supabase delete google_calendar_connection: ${error.code} ${error.message}`);
  }
}
