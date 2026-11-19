import { useMemo } from "react";
import { isBookableDate, isPastDate, parseISODate, shopNow } from "@/domain/services/scheduling";
import { SHOP_TIMEZONE } from "@/infrastructure/config/shop";
import { DAY_NAMES, MONTHS } from "./format";

interface Props {
  viewY: number;
  viewM: number;
  selected: Date | null;
  onSelect: (date: Date) => void;
  onShiftMonth: (dir: number) => void;
}

export default function Calendar({ viewY, viewM, selected, onSelect, onShiftMonth }: Props) {
  const calendar = useMemo(() => {
    // "Hoy" según la hora del local, no la del navegador.
    const t = parseISODate(shopNow(new Date(), SHOP_TIMEZONE).date) ?? new Date();
    const first = new Date(viewY, viewM, 1);
    const lead = (first.getDay() + 6) % 7;
    const dim = new Date(viewY, viewM + 1, 0).getDate();
    const cells: { day: number; date: Date | null; disabled: boolean; past: boolean; selected: boolean }[] = [];
    for (let i = 0; i < lead; i++) cells.push({ day: 0, date: null, disabled: true, past: false, selected: false });
    for (let d = 1; d <= dim; d++) {
      const date = new Date(viewY, viewM, d);
      cells.push({
        day: d,
        date,
        disabled: !isBookableDate(date, t),
        past: isPastDate(date, t),
        selected: !!selected && date.getTime() === selected.getTime(),
      });
    }
    const atFirstMonth = viewY === t.getFullYear() && viewM === t.getMonth();
    return { cells, atFirstMonth };
  }, [viewY, viewM, selected]);

  return (
    <div className="card overflow-hidden p-0 w-full sm:max-w-[340px] lg:max-w-none mx-auto">
      <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: "1px solid var(--color-divider)" }}>
        <button
          onClick={() => !calendar.atFirstMonth && onShiftMonth(-1)}
          className="cal-nav cursor-pointer bg-transparent border-none h-[30px] w-[30px] text-base"
          style={{ borderRadius: "var(--radius-sm)", color: calendar.atFirstMonth ? "var(--color-neutral-300)" : "var(--color-accent-700)" }}
        >
          ‹
        </button>
        <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 19, color: "var(--color-text)" }}>
          {MONTHS[viewM]} {viewY}
        </div>
        <button
          onClick={() => onShiftMonth(1)}
          className="cal-nav cursor-pointer bg-transparent border-none h-[30px] w-[30px] text-base"
          style={{ borderRadius: "var(--radius-sm)", color: "var(--color-accent-700)" }}
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 p-3.5">
        {DAY_NAMES.map((dn) => (
          <div key={dn} className="text-center text-[11px] tracking-[.08em] py-1" style={{ color: "var(--color-neutral-500)" }}>
            {dn}
          </div>
        ))}
        {calendar.cells.map((c, i) => (
          <button
            key={i}
            disabled={c.disabled}
            onClick={() => c.date && onSelect(c.date)}
            className="cal-day border-none h-[38px] rounded-full text-sm"
            style={{
              cursor: c.disabled ? "default" : "pointer",
              fontFeatureSettings: "'tnum'",
              background: c.selected ? "var(--color-accent)" : "transparent",
              color: c.selected ? "#fff" : c.disabled ? "var(--color-neutral-400)" : "var(--color-text)",
              textDecoration: c.past ? "line-through" : "none",
            }}
          >
            {c.day || ""}
          </button>
        ))}
      </div>
    </div>
  );
}
