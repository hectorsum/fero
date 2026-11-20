import type { SupabaseClient } from "@supabase/supabase-js";
import { parseAvailability, type Availability } from "@/domain/entities/Availability";
import { ForbiddenError, type AvailabilityRepository } from "@/domain/repositories/AvailabilityRepository";
import type { Database, Json } from "./database.types";

export class SupabaseAvailabilityRepository implements AvailabilityRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async get(): Promise<Availability> {
    const { data, error } = await this.db.rpc("get_availability");
    if (error) throw new Error(`Supabase get_availability: ${error.code} ${error.message}`);
    return parseAvailability(data);
  }

  async save(av: Availability): Promise<void> {
    const { data: auth } = await this.db.auth.getUser();
    if (!auth.user) throw new ForbiddenError();
    // RLS filtra la fila si el usuario no es admin: 0 filas actualizadas = sin permiso.
    const { data, error } = await this.db
      .from("availability")
      .update({ week: av.week as unknown as Json, overrides: av.overrides as unknown as Json, updated_at: new Date().toISOString(), updated_by: auth.user.id })
      .eq("id", 1)
      .select("id");
    if (error) throw new Error(`Supabase update availability: ${error.code} ${error.message}`);
    if (!data.length) throw new ForbiddenError();
  }
}
