const CREAM = "#efeade";
const LIME = "var(--color-accent)";
const INK = "#0e0c09";

/** Emblema navaja + máquina de tatuar. Reemplazable por /fero-logo.png del diseño «Acero». */
function Emblem() {
  return (
    <svg className="row-span-2 h-auto w-[84px] sm:w-[130px]" viewBox="0 0 260 104" aria-hidden="true">
      <g transform="translate(130, 52)">
        <g transform="rotate(-20)">
          <path d="M 72,-13 L -108,-1.2 L -108,1.2 L 72,13 Z" fill={CREAM} />
          <line x1={-103} y1={-11} x2={72} y2={-11} stroke={LIME} strokeWidth={1.2} />
          <rect x={72} y={-11} width={62} height={22} rx={2.5} fill={CREAM} />
          <line x1={72} y1={-11} x2={134} y2={-11} stroke={LIME} strokeWidth={1.2} />
          <circle cx={75} cy={0} r={6} fill={INK} />
          <circle cx={75} cy={0} r={3.5} fill={LIME} />
        </g>
        <g transform="rotate(20)">
          <rect x={-118} y={-8} width={82} height={16} rx={8} fill={CREAM} />
          <line x1={-95} y1={-8} x2={-95} y2={8} stroke={INK} strokeWidth={2.5} />
          <line x1={-82} y1={-8} x2={-82} y2={8} stroke={INK} strokeWidth={2.5} />
          <line x1={-69} y1={-8} x2={-69} y2={8} stroke={INK} strokeWidth={2.5} />
          <rect x={-36} y={-6} width={86} height={12} rx={6} fill={CREAM} />
          <path d="M 50,-2.5 L 118,0 L 50,2.5 Z" fill={CREAM} />
          <circle cx={118} cy={0} r={2} fill={LIME} />
        </g>
      </g>
    </svg>
  );
}

export default function Logo() {
  return (
    <div className="grid grid-cols-[auto_max-content] grid-rows-[auto_auto] items-center gap-x-4 gap-y-1.5 sm:gap-x-7 sm:gap-y-2">
      <Emblem />
      <div
        className="self-end justify-self-start text-[50px] leading-[.85] tracking-[.04em] sm:text-[82px]"
        style={{ fontFamily: "var(--font-heading)", fontWeight: 800, color: CREAM }}
      >
        FERO
      </div>
      <div
        className="flex w-full items-center justify-between self-start whitespace-nowrap text-[9px] uppercase tracking-[.12em] sm:text-[11px] sm:tracking-[.14em]"
        style={{ fontFamily: "var(--font-fero-mono)", color: LIME }}
      >
        <span>Barbershop</span>
        <span className="tracking-normal">·</span>
        <span>Tattoo Studio</span>
      </div>
    </div>
  );
}
