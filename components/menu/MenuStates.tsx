import { CircleAlert, Utensils } from "lucide-react";
import { Button, EmptyState, Skeleton } from "@/components/ui";

export function MenuSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando menú" className="mx-auto max-w-[var(--maxw)] px-[var(--gutter)] py-5">
      <Skeleton className="h-[180px] rounded-[18px]" />
      <div className="mt-6 grid grid-cols-2 gap-3.5 tab:grid-cols-3">
        {[0, 0.15, 0.3, 0.45, 0.6, 0.75].map((d, i) => (
          <Skeleton key={d} delay={d} className={i > 3 ? "hidden aspect-[3/4] rounded-[14px] tab:block" : "aspect-[3/4] rounded-[14px]"} />
        ))}
      </div>
    </div>
  );
}

export function MenuError({ onRetry }: { onRetry: () => void }) {
  return (
    <EmptyState
      icon={<CircleAlert size={26} strokeWidth={1.8} />}
      title="Algo salió mal."
      action={
        <Button variant="ink" onClick={onRetry} className="h-[50px] rounded-[25px] px-7">
          Reintentar
        </Button>
      }
    >
      No pudimos cargar el menú. Revisa tu conexión e inténtalo de nuevo.
    </EmptyState>
  );
}

export function MenuEmpty() {
  return (
    <EmptyState icon={<Utensils size={26} strokeWidth={1.8} />} title="No hay productos disponibles.">
      Estamos preparando el menú. Vuelve pronto.
    </EmptyState>
  );
}
