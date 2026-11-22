import { MAX_NOTES_LENGTH } from "@/domain/entities/Booking";
import { MAX_LENGTH } from "@/domain/value-objects/ContactInfo";
import type { Patch, WizardState } from "@/presentation/hooks/useBookingWizard";

export default function StepDatos({ s, patch }: { s: WizardState; patch: Patch }) {
  return (
    <div className="card flex flex-col gap-[22px] p-6 sm:py-9 sm:px-10">
      <div className="kicker">Tus datos *</div>
      {/* Honeypot: invisible para personas y lectores de pantalla; los bots suelen rellenarlo. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
        <label htmlFor="f-website">Sitio web</label>
        <input id="f-website" type="text" name="website" tabIndex={-1} autoComplete="off" value={s.website} onChange={(e) => patch({ website: e.target.value })} />
      </div>
      <div className="field">
        <label htmlFor="f-nombre">Nombre completo</label>
        <input className="input" id="f-nombre" type="text" maxLength={MAX_LENGTH.name} placeholder="Ej. Andrés Cabrera" value={s.name} onChange={(e) => patch({ name: e.target.value })} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[22px]">
        <div className="field">
          <label htmlFor="f-tel">Teléfono</label>
          <input className="input" id="f-tel" type="tel" maxLength={MAX_LENGTH.phone} placeholder="Ej. 999 333 122" value={s.phone} onChange={(e) => patch({ phone: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="f-mail">Correo electrónico</label>
          <input className="input" id="f-mail" type="email" maxLength={MAX_LENGTH.email} placeholder="Ej. andres@correo.com" value={s.email} onChange={(e) => patch({ email: e.target.value })} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="f-notas">Notas (opcional)</label>
        <textarea
          className="input"
          id="f-notas"
          rows={3}
          maxLength={MAX_NOTES_LENGTH}
          placeholder="Algo que Fero deba saber…"
          value={s.notes}
          onChange={(e) => patch({ notes: e.target.value })}
          style={{ resize: "vertical", fontFamily: "var(--font-body)" }}
        />
      </div>
    </div>
  );
}
