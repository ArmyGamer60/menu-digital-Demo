import type { Promotion } from "@/types";

const tag = (p: Promotion) => (p.type === "bogo" ? "2×1" : p.type === "percent" ? `−${p.value}%` : "$");

/** Tira horizontal de promociones activas. */
export function PromoStrip({ promotions }: { promotions: Promotion[] }) {
  if (!promotions.length) return null;
  return (
    <div className="no-scrollbar mx-[calc(var(--gutter)*-1)] mt-3.5 flex gap-2.5 overflow-x-auto px-[var(--gutter)]">
      {promotions.map((p) => (
        <div key={p.id} className="flex flex-none items-center gap-2.5 rounded-[14px] border border-line bg-surface py-2.5 pr-3.5 pl-2.5">
          <div className="flex size-[34px] items-center justify-center rounded-[10px] bg-brand2 text-xs font-bold text-white">
            {tag(p)}
          </div>
          <div>
            <div className="text-sm font-bold">{p.name}</div>
            <div className="text-[12.5px] text-muted">{p.banner}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
