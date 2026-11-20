// Crea (o confirma que existe) un usuario de Supabase Auth con correo y contraseña,
// y lo registra como admin del panel (tabla public.admins, migración 0003).
// Uso: SUPABASE_SERVICE_ROLE_KEY=... node --env-file=.env.local scripts/create-user.mjs
// Lee SUPABASE_URL (o NEXT_PUBLIC_SUPABASE_URL), FERO_ADMIN_EMAIL y FERO_ADMIN_PASSWORD del entorno.
// Nunca imprime la contraseña ni la service role key.
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const { SUPABASE_SERVICE_ROLE_KEY: serviceKey, FERO_ADMIN_EMAIL: email, FERO_ADMIN_PASSWORD: password } =
  process.env;

const missing = Object.entries({ SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: serviceKey, FERO_ADMIN_EMAIL: email, FERO_ADMIN_PASSWORD: password })
  .filter(([, v]) => !v)
  .map(([k]) => k);
if (missing.length) {
  console.error(`Faltan variables: ${missing.join(", ")}`);
  process.exit(1);
}
if (password.length < 8) {
  console.error("La contraseña debe tener al menos 8 caracteres.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

async function findUserId() {
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const u = data.users.find((x) => x.email?.toLowerCase() === email.toLowerCase());
    if (u) return u.id;
    if (data.users.length < 200) return null;
  }
  return null;
}

let userId;
const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
if (error) {
  if (error.code === "email_exists" || /already been registered/i.test(error.message)) {
    userId = await findUserId();
    console.log(`El usuario ${email} ya existe; no se modificó su contraseña.`);
  } else {
    console.error(`Error creando el usuario: ${error.code ?? ""} ${error.message}`);
    process.exit(1);
  }
} else {
  userId = data.user.id;
  console.log(`Usuario creado: ${data.user.email} (id ${userId}), correo confirmado.`);
}

if (!userId) {
  console.error("No se encontró el id del usuario.");
  process.exit(1);
}
const { error: adminError } = await admin.from("admins").upsert({ user_id: userId }, { onConflict: "user_id" });
if (adminError) {
  console.error(`Error registrando admin: ${adminError.code ?? ""} ${adminError.message}`);
  process.exit(1);
}
console.log("Registrado como admin del panel.");
