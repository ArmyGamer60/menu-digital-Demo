"use client";

import { MenuError } from "@/components/menu/MenuStates";
import { Credit } from "@/components/ui";
import { seedBusiness } from "@/data/seed";
import { asStyle, themeToCssVars } from "@/lib/theme";

/** Error al cargar el menú: "Algo salió mal." + Reintentar. */
export default function MenuRouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="menu-root" data-card="editorial" data-layout="grid" style={asStyle(themeToCssVars(seedBusiness.theme))}>
      <MenuError onRetry={reset} />
      <Credit className="pb-8 text-muted" />
    </div>
  );
}
