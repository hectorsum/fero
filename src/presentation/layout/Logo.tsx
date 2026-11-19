import Image from "next/image";

const CREAM = "#efeade";
const LIME = "var(--color-accent)";

export default function Logo() {
  return (
    <div className="grid grid-cols-[auto_max-content] grid-rows-[auto_auto] items-center gap-x-4 gap-y-1.5 sm:gap-x-7 sm:gap-y-2">
      <Image
        src="/fero-logo.png"
        alt="FERO"
        width={120}
        height={120}
        priority
        className="row-span-2 h-[76px] w-[76px] sm:h-[120px] sm:w-[120px]"
      />
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
