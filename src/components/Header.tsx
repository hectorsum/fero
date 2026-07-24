export default function Header() {
  return (
    <header className="bg-[#0e0c09] flex flex-col items-center px-4 pt-7 pb-6 sm:px-6 sm:pt-9 sm:pb-[30px]">
      <div className="flex w-full max-w-[300px] flex-col items-center gap-3">
        <svg
          className="h-auto w-[125px] sm:w-[170px]"
          viewBox="0 0 150 52"
          aria-hidden="true"
        >
          <g stroke="#efeade" strokeWidth={5} strokeLinecap="round">
            <line x1={38} y1={8} x2={112} y2={40} />
            <line x1={112} y1={8} x2={38} y2={40} />
          </g>
          <g stroke="#b68235" strokeWidth={1.5} strokeLinecap="round">
            <line x1={34} y1={4} x2={116} y2={39} />
          </g>
          <circle cx={104} cy={14} r={3} fill="#b68235" />
          <g stroke="#0e0c09" strokeWidth={1.4}>
            <line x1={44} y1={13} x2={49} y2={11} />
            <line x1={50} y1={16} x2={55} y2={14} />
            <line x1={56} y1={19} x2={61} y2={17} />
          </g>
          <line x1={10} y1={49} x2={63} y2={49} stroke="#b68235" strokeWidth={1} />
          <rect x={71} y={45} width={8} height={8} transform="rotate(45 75 49)" fill="#b68235" />
          <line x1={87} y1={49} x2={140} y2={49} stroke="#b68235" strokeWidth={1} />
        </svg>
        <div
          className="text-[44px] leading-none tracking-[.02em] sm:text-[74px]"
          style={{ fontFamily: "var(--font-fero-display)", fontWeight: 800, color: "#efeade" }}
        >
          FERO
        </div>
        <div
          className="flex w-full items-center justify-between text-[9px] uppercase tracking-[.16em] sm:text-xs sm:tracking-[.28em]"
          style={{ fontFamily: "var(--font-fero-mono)", color: "#b68235" }}
        >
          <span>Barbershop</span>
          <span className="tracking-normal">·</span>
          <span>Tattoo Studio</span>
        </div>
      </div>
    </header>
  );
}
