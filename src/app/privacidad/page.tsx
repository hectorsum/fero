import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BARBER_EMAIL } from "@/infrastructure/config/shop";

export const metadata: Metadata = {
  title: "Política de privacidad — FERO",
  description: "Qué datos guarda FERO al agendar una cita, para qué se usan y cómo se usa el acceso a Google Calendar.",
};

const UPDATED = "20 de noviembre de 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 style={{ margin: 0, fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 22, color: "var(--color-text)" }}>{title}</h2>
      {children}
    </section>
  );
}

export default function PrivacyPage() {
  const mail = (
    <a href={`mailto:${BARBER_EMAIL}`} className="legal-link">
      {BARBER_EMAIL}
    </a>
  );

  return (
    <div className="login-page legal min-h-screen px-4 py-12 sm:px-6" style={{ fontFamily: "var(--font-body)" }}>
      <article className="mx-auto flex w-full max-w-[720px] flex-col gap-9">
        <header className="flex flex-col gap-5">
          <Link href="/" className="flex items-center gap-2.5" style={{ textDecoration: "none" }} aria-label="FERO — volver a agendar">
            <Image src="/fero-logo.png" alt="" width={40} height={40} />
            <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 24, letterSpacing: ".04em", color: "var(--color-text)" }}>FERO</span>
          </Link>
          <div className="flex flex-col gap-2">
            <h1 className="text-[30px] sm:text-[38px]" style={{ margin: 0, fontFamily: "var(--font-heading)", fontWeight: 700, color: "var(--color-text)" }}>
              Política de privacidad
            </h1>
            <p className="legal-meta">Última actualización: {UPDATED}</p>
          </div>
          <p>
            FERO (Fernando Rojas «Fero», barbería y estudio de tatuajes) es responsable de los datos personales que se recogen en este sitio. Aquí
            explicamos qué datos guardamos, para qué los usamos y con quién los compartimos.
          </p>
        </header>

        <Section title="Qué datos recogemos">
          <p>Cuando agendas una cita de corte o grooming guardamos:</p>
          <ul>
            <li>Tu nombre, teléfono y correo electrónico.</li>
            <li>El servicio, la fecha y la hora que elegiste.</li>
            <li>Las notas que quieras agregar.</li>
          </ul>
          <p>
            Si solicitas un tatuaje, los datos del formulario (estilo, tamaño, zona, idea y fecha preferida) no se guardan en nuestro sistema: se
            abren en WhatsApp para que tú mismo nos envíes el mensaje.
          </p>
          <p>No pedimos datos de pago ni datos sensibles, y no usamos cookies de publicidad ni de analítica.</p>
        </Section>

        <Section title="Para qué los usamos">
          <ul>
            <li>Reservar tu horario y evitar que otra persona tome el mismo.</li>
            <li>Contactarte sobre tu cita (confirmaciones, cambios o cancelaciones).</li>
          </ul>
          <p>No vendemos ni cedemos tus datos, ni los usamos para enviarte publicidad.</p>
        </Section>

        <Section title="Google Calendar">
          <p>
            El administrador de FERO puede conectar su propia cuenta de Google Calendar al panel de citas. Esa conexión la autoriza solo el
            administrador; a los clientes no se les pide acceso a ninguna cuenta de Google. Con ella, FERO:
          </p>
          <ul>
            <li>
              <strong>Crea un evento por cada cita confirmada</strong> en el calendario del administrador, con el servicio, tu nombre, teléfono,
              correo y notas. No se te agrega como invitado, así que Google no te envía ningún correo.
            </li>
            <li>
              <strong>Consulta los horarios ocupados</strong> (libre/ocupado) del calendario del administrador para no ofrecer horas en las que ya
              tiene otro compromiso. No lee el título ni el contenido de esos eventos.
            </li>
          </ul>
          <p>
            Los permisos solicitados son únicamente <code>calendar.events</code> y <code>calendar.freebusy</code>, además del correo de la cuenta
            conectada para mostrarla en el panel. El token de acceso se guarda cifrado y solo lo usa el servidor de FERO. El administrador puede
            desconectar Google en cualquier momento desde el panel o desde{" "}
            <a href="https://myaccount.google.com/permissions" className="legal-link" target="_blank" rel="noopener noreferrer">
              la configuración de su cuenta de Google
            </a>
            .
          </p>
          <p>
            El uso que FERO hace de la información recibida de las API de Google, y su transferencia a cualquier otra aplicación, cumple con la{" "}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              className="legal-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Política de datos de usuario de los servicios de API de Google
            </a>
            , incluidos los requisitos de Uso Limitado. Esa información no se usa para publicidad ni para entrenar modelos de inteligencia
            artificial, y no se comparte con terceros.
          </p>
        </Section>

        <Section title="Dónde se guardan y con quién se comparten">
          <p>Usamos estos proveedores para operar el sitio, que tratan los datos por cuenta nuestra:</p>
          <ul>
            <li>
              <strong>Supabase</strong>: base de datos donde se guardan las citas.
            </li>
            <li>
              <strong>Vercel</strong>: alojamiento del sitio web.
            </li>
            <li>
              <strong>Google</strong>: calendario del administrador, si está conectado.
            </li>
            <li>
              <strong>WhatsApp</strong>: solo si eliges enviarnos una solicitud de tatuaje.
            </li>
          </ul>
          <p>Estos proveedores pueden almacenar datos fuera del Perú. Fuera de esto, solo compartiríamos datos si una autoridad lo exige por ley.</p>
        </Section>

        <Section title="Cuánto tiempo los guardamos">
          <p>
            Guardamos los datos de tus citas mientras sean necesarios para gestionarlas y llevar el historial del local. Puedes pedir que los
            borremos en cualquier momento; también se eliminarán del calendario del administrador.
          </p>
        </Section>

        <Section title="Seguridad">
          <p>
            Las comunicaciones con el sitio van cifradas (HTTPS). Los visitantes no pueden leer las citas de otras personas: solo el
            administrador, con sesión iniciada, tiene acceso a ellas.
          </p>
        </Section>

        <Section title="Tus derechos">
          <p>
            De acuerdo con la Ley N.º 29733, Ley de Protección de Datos Personales del Perú, puedes pedir acceder a tus datos, rectificarlos,
            cancelarlos u oponerte a su tratamiento escribiendo a {mail}. Te responderemos dentro de los plazos que fija la ley. Si consideras que
            no atendimos tu solicitud, puedes acudir a la Autoridad Nacional de Protección de Datos Personales.
          </p>
        </Section>

        <Section title="Cambios y contacto">
          <p>
            Si cambiamos esta política, actualizaremos la fecha de arriba. Para cualquier consulta sobre privacidad, escríbenos a {mail}.
          </p>
        </Section>

        <Link href="/" className="back-link self-start">
          ← Volver a agendar
        </Link>
      </article>
    </div>
  );
}
