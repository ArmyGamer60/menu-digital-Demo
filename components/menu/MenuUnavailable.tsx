import { Store, Utensils } from "lucide-react";
import Link from "next/link";
import { Credit } from "@/components/ui/Credit";
import { EmptyState } from "@/components/ui/EmptyState";
import { seedBusiness } from "@/data/seed";
import { asStyle, themeToCssVars } from "@/lib/theme";
import type { Theme } from "@/types";

/** Menú inexistente o suspendido (con el tema del negocio si se conoce). */
export function MenuUnavailable({ kind, theme = seedBusiness.theme }: { kind: "missing" | "suspended"; theme?: Theme }) {
  const missing = kind === "missing";
  return (
    <div className="menu-root" data-card="editorial" data-layout="grid" style={asStyle(themeToCssVars(theme))}>
      <EmptyState
        icon={missing ? <Utensils size={26} strokeWidth={1.8} /> : <Store size={26} strokeWidth={1.8} />}
        title={missing ? "Este menú no existe." : "Este menú no está disponible por ahora."}
        action={
          missing ? (
            <Link href="/" className="inline-flex h-[50px] items-center rounded-[25px] bg-ink px-7 font-bold text-bg no-underline hover:opacity-100">
              Ver menú demo
            </Link>
          ) : null
        }
      >
        {missing ? "Revisa el enlace o escanea de nuevo el código QR." : "Vuelve a intentarlo más tarde o contacta al negocio."}
      </EmptyState>
      <Credit className="pb-8 text-muted" />
    </div>
  );
}
