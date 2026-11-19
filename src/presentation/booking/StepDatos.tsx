import { MAX_NOTES_LENGTH } from "@/domain/entities/Booking";
import { MAX_LENGTH } from "@/domain/value-objects/ContactInfo";
import type { Patch, WizardState } from "@/presentation/hooks/useBookingWizard";
import { kickerStyle } from "./format";

export default function StepDatos({ s, patch, isCorte }: { s: WizardState; patch: Patch; isCorte: boolean }) {
  return (
    <div className="card flex flex-col gap-5 p-6 sm:p-9">
      <div style={kickerStyle}>Tus datos *</div>
      <div className="field">
        <label htmlFor="f-nombre">Nombre completo</label>
        <input className="input" id="f-nombre" type="text" maxLength={MAX_LENGTH.name} placeholder="Ej. Hector Herrera" value={s.name} onChange={(e) => patch({ name: e.target.value })} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
        <label htmlFor="f-notas">{isCorte ? "Notas (opcional)" : "Descripción del tatuaje (opcional)"} </label>
        <textarea
          className="input"
          id="f-notas"
          rows={3}
          maxLength={MAX_NOTES_LENGTH}
          placeholder={isCorte ? "Algo que Fernando deba saber…" : "Describe el estilo, tamaño, zona, referencias…"}
          value={s.notes}
          onChange={(e) => patch({ notes: e.target.value })}
          style={{ resize: "vertical", fontFamily: "var(--font-body)" }}
        />
      </div>
    </div>
  );
}
