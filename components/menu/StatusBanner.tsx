import { Clock } from "lucide-react";
import type { BusinessStatus } from "@/lib/hours";

/** Tarjeta ink sobre bg cuando el negocio está cerrado o en pausa. */
export function StatusBanner({ status }: { status: BusinessStatus | null }) {
  if (!status || status.key === "open") return null;
  const closed = status.key === "closed";
  const title = closed ? "Estamos cerrados." : "Por el momento no estamos tomando pedidos.";
  const text = closed
    ? status.next
      ? `Abrimos ${status.next}. Puedes ver el menú mientras tanto.`
      : "Puedes ver el menú mientras tanto."
    : "Vuelve en unos minutos. El menú sigue disponible para consulta.";
  return (
    <div className="mx-auto max-w-[var(--maxw)] px-[var(--gutter)] pt-3.5">
      <div role="status" className="flex items-start gap-3 rounded-[14px] bg-ink px-4 py-3.5 text-bg">
        <Clock size={20} strokeWidth={1.8} className="mt-px flex-none" aria-hidden />
        <div>
          <div className="text-[15px] font-bold">{title}</div>
          <div className="mt-0.5 text-[13.5px] opacity-85">{text}</div>
        </div>
      </div>
    </div>
  );
}
