import { MAX_NOTES_LENGTH } from "@/domain/entities/Booking";
import { TATTOO_SIZES, TATTOO_STYLES } from "@/infrastructure/config/shop";
import type { Patch, WizardState } from "@/presentation/hooks/useBookingWizard";

export default function TattooFields({ s, patch }: { s: WizardState; patch: Patch }) {
  return (
    <div className="card flex flex-col gap-[22px] p-6 sm:py-9 sm:px-10">
      <div className="kicker">Tu tatuaje</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[22px]">
        <div className="field">
          <label htmlFor="t-estilo">Estilo *</label>
          <select className="input" id="t-estilo" value={s.tStyle} onChange={(e) => patch({ tStyle: e.target.value })}>
            <option value="">Selecciona…</option>
            {TATTOO_STYLES.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="t-tam">Tamaño *</label>
          <select className="input" id="t-tam" value={s.tSize} onChange={(e) => patch({ tSize: e.target.value })}>
            <option value="">Selecciona…</option>
            {TATTOO_SIZES.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="t-zona">Zona del cuerpo</label>
        <input className="input" id="t-zona" type="text" maxLength={120} placeholder="Ej: antebrazo, cuello…" value={s.tZone} onChange={(e) => patch({ tZone: e.target.value })} />
      </div>
      <div className="field">
        <label htmlFor="t-idea">Descripción de tu idea</label>
        <textarea
          className="input"
          id="t-idea"
          rows={4}
          maxLength={MAX_NOTES_LENGTH}
          placeholder="Describe tu idea, referencias, colores, estilo…"
          value={s.tIdea}
          onChange={(e) => patch({ tIdea: e.target.value })}
          style={{ resize: "vertical", fontFamily: "var(--font-body)" }}
        />
      </div>
    </div>
  );
}
