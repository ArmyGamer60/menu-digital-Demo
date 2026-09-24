import Link from "next/link";
import { Utensils } from "lucide-react";
import { Credit, EmptyState } from "@/components/ui";
import { seedBusiness } from "@/data/seed";
import { asStyle, themeToCssVars } from "@/lib/theme";

export default function NotFound() {
  return (
    <div className="menu-root" data-card="editorial" data-layout="grid" style={asStyle(themeToCssVars(seedBusiness.theme))}>
      <EmptyState
        icon={<Utensils size={26} strokeWidth={1.8} />}
        title="Este menú no existe."
        action={
          <Link
            href="/menu/molienda"
            className="inline-flex h-[50px] items-center rounded-[25px] bg-ink px-7 font-bold text-bg no-underline hover:opacity-100"
          >
            Ver menú demo
          </Link>
        }
      >
        Revisa el enlace o escanea de nuevo el código QR.
      </EmptyState>
      <Credit className="pb-8 text-muted" />
    </div>
  );
}
