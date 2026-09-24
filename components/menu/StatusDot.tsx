import { STATUS_COLORS, statusText, type BusinessStatus } from "@/lib/hours";

/** Punto 8px con halo 3px al 20% + texto de estado. `status` null = aún no calculado (SSR). */
export function StatusDot({ status }: { status: BusinessStatus | null }) {
  const color = status ? STATUS_COLORS[status.key] : "transparent";
  return (
    <>
      <span
        aria-hidden
        className="size-2 flex-none rounded-full"
        style={{ background: color, boxShadow: `0 0 0 3px ${status ? color + "33" : "transparent"}` }}
      />
      <span className={status ? undefined : "invisible"}>{status ? statusText(status) : "Abierto ahora"}</span>
    </>
  );
}
