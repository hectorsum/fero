// Crea (o confirma que existe) un usuario de Supabase Auth con correo y contraseña.
// Uso: SUPABASE_SERVICE_ROLE_KEY=... node --env-file=.env.local scripts/create-user.mjs
// Lee NEXT_PUBLIC_SUPABASE_URL, FERO_ADMIN_EMAIL y FERO_ADMIN_PASSWORD del entorno.
// Nunca imprime la contraseña ni la service role key.
import { createClient } from "@supabase/supabase-js";

const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: serviceKey, FERO_ADMIN_EMAIL: email, FERO_ADMIN_PASSWORD: password } =
  process.env;

const missing = Object.entries({ NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: serviceKey, FERO_ADMIN_EMAIL: email, FERO_ADMIN_PASSWORD: password })
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

const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
if (error) {
  if (error.code === "email_exists" || /already been registered/i.test(error.message)) {
    console.log(`El usuario ${email} ya existe; no se modificó.`);
    process.exit(0);
  }
  console.error(`Error creando el usuario: ${error.code ?? ""} ${error.message}`);
  process.exit(1);
}
console.log(`Usuario creado: ${data.user.email} (id ${data.user.id}), correo confirmado.`);
