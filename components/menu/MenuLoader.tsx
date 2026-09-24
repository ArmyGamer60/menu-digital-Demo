"use client";

import Link from "next/link";
import { Utensils } from "lucide-react";
import { useEffect, useState } from "react";
import { Credit, EmptyState } from "@/components/ui";
import { seedBusiness } from "@/data/seed";
import { getBusinessBySlug } from "@/lib/repo";
import { asStyle, themeToCssVars } from "@/lib/theme";
import type { Business } from "@/types";
import { MenuApp } from "./MenuApp";
import { MenuSkeleton } from "./MenuStates";

/** Fase 1: un slug renombrado desde el panel solo existe en localStorage; se resuelve en el cliente.
    Fase 2 (BD) el servidor lo encuentra y este componente deja de ser necesario. */
export function MenuLoader({ slug }: { slug: string }) {
  const [state, setState] = useState<{ business: Business | null; done: boolean }>({ business: null, done: false });
  useEffect(() => {
    getBusinessBySlug(slug).then(
      (business) => setState({ business, done: true }),
      () => setState({ business: null, done: true }),
    );
  }, [slug]);

  if (state.business) return <MenuApp initialBusiness={state.business} />;
  return (
    <div className="menu-root" data-card="editorial" data-layout="grid" style={asStyle(themeToCssVars(seedBusiness.theme))}>
      {!state.done ? (
        <MenuSkeleton />
      ) : (
        <>
          <EmptyState
            icon={<Utensils size={26} strokeWidth={1.8} />}
            title="Este menú no existe."
            action={
              <Link href="/" className="inline-flex h-[50px] items-center rounded-[25px] bg-ink px-7 font-bold text-bg no-underline hover:opacity-100">
                Ver menú demo
              </Link>
            }
          >
            Revisa el enlace o escanea de nuevo el código QR.
          </EmptyState>
          <Credit className="pb-8 text-muted" />
        </>
      )}
    </div>
  );
}
