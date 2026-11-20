import { redirect } from "next/navigation";
import { createServerClient } from "@/infrastructure/supabase/server";

/** Usuario admin actual o null. Verifica el token contra Supabase Auth (getUser) y el rol en la base. */
export async function getAdmin() {
  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const { data: isAdmin } = await supabase.rpc("is_admin");
  return isAdmin === true ? { supabase, user: data.user } : null;
}

/** Para Server Components: redirige a /login si no hay un admin con sesión. */
export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/login");
  return admin;
}
