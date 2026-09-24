import { MenuSkeleton } from "@/components/menu/MenuStates";
import { asStyle, themeToCssVars } from "@/lib/theme";
import { seedBusiness } from "@/data/seed";

/** Skeleton mientras carga el negocio (colores neutros del Theme por defecto). */
export default function Loading() {
  return (
    <div className="menu-root" data-card="editorial" data-layout="grid" style={asStyle(themeToCssVars(seedBusiness.theme))}>
      <MenuSkeleton />
    </div>
  );
}
