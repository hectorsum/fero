/**
 * Toda la app habla con Supabase desde el servidor, así que no hace falta el prefijo NEXT_PUBLIC_.
 * Se aceptan ambos nombres: SUPABASE_URL / SUPABASE_ANON_KEY (o SUPABASE_PUBLISHABLE_KEY) y sus
 * variantes NEXT_PUBLIC_*.
 */
export function supabaseEnv() {
  const e = process.env;
  const url = e.SUPABASE_URL || e.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = e.SUPABASE_ANON_KEY || e.SUPABASE_PUBLISHABLE_KEY || e.NEXT_PUBLIC_SUPABASE_ANON_KEY || e.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !anonKey) {
    throw new Error("Faltan SUPABASE_URL y SUPABASE_ANON_KEY (o sus variantes NEXT_PUBLIC_*). Ver .env.example.");
  }
  return { url, anonKey };
}
