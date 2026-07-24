import React from 'react'

const Logo = () => {
    return (
        <div className="flex w-full max-w-[300px] flex-col items-center gap-3 z-2">
            <svg
                className="h-auto w-[160px] sm:w-[215px]"
                viewBox="0 0 260 110"
                aria-hidden="true"
            >
                <g transform="translate(130, 50)">
                    {/* Razor, angled up-left */}
                    <g transform="rotate(-20)">
                        <path d="M 72,-13 L -108,-1.2 L -108,1.2 L 72,13 Z" fill="#efeade" />
                        <line x1={-103} y1={-11} x2={72} y2={-11} stroke="#b68235" strokeWidth={1.2} />
                        <rect x={72} y={-11} width={62} height={22} rx={2.5} fill="#efeade" />
                        <line x1={72} y1={-11} x2={134} y2={-11} stroke="#b68235" strokeWidth={1.2} />
                        <circle cx={75} cy={0} r={6} fill="#0e0c09" />
                        <circle cx={75} cy={0} r={3.5} fill="#b68235" />
                    </g>
                    {/* Tattoo pen, angled up-right */}
                    <g transform="rotate(20)">
                        <rect x={-118} y={-8} width={82} height={16} rx={8} fill="#efeade" />
                        <line x1={-95} y1={-8} x2={-95} y2={8} stroke="#0e0c09" strokeWidth={2.5} />
                        <line x1={-82} y1={-8} x2={-82} y2={8} stroke="#0e0c09" strokeWidth={2.5} />
                        <line x1={-69} y1={-8} x2={-69} y2={8} stroke="#0e0c09" strokeWidth={2.5} />
                        <rect x={-36} y={-6} width={86} height={12} rx={6} fill="#efeade" />
                        <path d="M 50,-2.5 L 118,0 L 50,2.5 Z" fill="#efeade" />
                        <circle cx={118} cy={0} r={2} fill="#b68235" />
                    </g>
                </g>
                <line x1={10} y1={100} x2={118} y2={100} stroke="#b68235" strokeWidth={1} />
                <rect x={126} y={96} width={8} height={8} transform="rotate(45 130 100)" fill="#b68235" />
                <line x1={142} y1={100} x2={250} y2={100} stroke="#b68235" strokeWidth={1} />
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
            <div className="h-px w-[90px] sm:w-[120px]" style={{ backgroundColor: "#b68235" }} />
        </div>
    )
}

export default Logo