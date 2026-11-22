import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import type { NewBooking } from "@/domain/entities/Booking";
import type { Database } from "./database.types";
import { SupabaseBookingRepository } from "./SupabaseBookingRepository";

type PgError = { code: string; message: string } | null;

function fakeClient(opts: { insertError?: PgError; rpcData?: { date: string; time: string; duration_min: number }[] }) {
  const insert = vi.fn<(row: unknown) => Promise<{ error: PgError }>>(async () => ({ error: opts.insertError ?? null }));
  const rpc = vi.fn<(fn: string, args: unknown) => Promise<{ data: unknown[]; error: null }>>(async () => ({
    data: opts.rpcData ?? [],
    error: null,
  }));
  const client = { from: vi.fn(() => ({ insert })), rpc };
  const db = client as unknown as SupabaseClient<Database>;
  return { db, insert, rpc };
}

/** Repo con el mismo cliente falso para lecturas anónimas y escrituras de servidor. */
const repoWith = (db: SupabaseClient<Database>) => new SupabaseBookingRepository(db, db);

const booking: NewBooking = {
  service: "corte",
  date: "2026-11-17",
  time: "09:00",
  durationMin: 60,
  contact: { name: "Ana", phone: "999", email: "a@b.co" },
  notes: "",
};

describe("SupabaseBookingRepository", () => {
  it("inserta con columnas snake_case y un id generado", async () => {
    const { db, insert } = fakeClient({});
    const saved = await repoWith(db).create(booking);
    expect(saved.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(insert).toHaveBeenCalledWith({
      id: saved.id,
      name: "Ana",
      phone: "999",
      email: "a@b.co",
      notes: "",
      service: "corte",
      date: "2026-11-17",
      time: "09:00",
      duration_min: 60,
    });
  });

  it.each(["23505", "23P01"])("traduce el error %s a SLOT_UNAVAILABLE", async (code) => {
    const { db } = fakeClient({ insertError: { code, message: "conflict" } });
    await expect(repoWith(db).create(booking)).rejects.toMatchObject({ code: "SLOT_UNAVAILABLE" });
  });

  it("otros errores se propagan como error genérico", async () => {
    const { db } = fakeClient({ insertError: { code: "42501", message: "denied" } });
    await expect(repoWith(db).create(booking)).rejects.toThrow(/42501/);
  });

  it("findByDate usa la RPC y normaliza la hora a HH:MM", async () => {
    const { db, rpc } = fakeClient({ rpcData: [{ date: "2026-11-17", time: "09:00:00", duration_min: 120 }] });
    expect(await repoWith(db).findByDate("2026-11-17")).toEqual([
      { date: "2026-11-17", time: "09:00", durationMin: 120 },
    ]);
    expect(rpc).toHaveBeenCalledWith("get_booked_slots", { p_date: "2026-11-17" });
  });

  it("create escribe con el cliente de servidor y findByDate lee con el anónimo", async () => {
    const anon = fakeClient({});
    const server = fakeClient({});
    const repo = new SupabaseBookingRepository(anon.db, server.db);
    await repo.create(booking);
    await repo.findByDate("2026-11-17");
    expect(server.insert).toHaveBeenCalledTimes(1);
    expect(anon.insert).not.toHaveBeenCalled();
    expect(anon.rpc).toHaveBeenCalledTimes(1);
    expect(server.rpc).not.toHaveBeenCalled();
  });

  it("findUpcomingContacts filtra confirmadas desde la fecha con el cliente de servidor", async () => {
    const calls: [string, ...unknown[]][] = [];
    const q = {
      select: (...a: unknown[]) => (calls.push(["select", ...a]), q),
      eq: (...a: unknown[]) => (calls.push(["eq", ...a]), q),
      gte: (...a: unknown[]) => (calls.push(["gte", ...a]), q),
      limit: async () => ({ data: [{ date: "2026-11-18", time: "10:00:00", phone: "999", email: "a@b.co" }], error: null }),
    };
    const server = { from: vi.fn(() => q) } as unknown as SupabaseClient<Database>;
    const anon = fakeClient({}).db;
    const rows = await new SupabaseBookingRepository(anon, server).findUpcomingContacts("2026-11-17");
    expect(rows).toEqual([{ date: "2026-11-18", time: "10:00", phone: "999", email: "a@b.co" }]);
    expect(calls).toContainEqual(["eq", "status", "confirmed"]);
    expect(calls).toContainEqual(["gte", "date", "2026-11-17"]);
  });
});
