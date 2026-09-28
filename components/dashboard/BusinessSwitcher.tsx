"use client";

import { Building2, Check, ChevronsUpDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { selectBusiness } from "@/app/admin/actions";
import { cn } from "@/lib/cn";
import { useAdmin } from "./AdminProvider";

/** Cabecera de la sidebar: logo + nombre del negocio; si hay varios (o eres superadmin) abre el selector. */
export function BusinessSwitcher({ labelClassName }: { labelClassName: string }) {
  const { business, businesses, user } = useAdmin();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const canSwitch = businesses.length > 1 || user.isSuperadmin;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const head = (
    <>
      <span className="flex size-9 flex-none items-center justify-center rounded-[10px] bg-p-accent font-pdisplay text-[19px] text-white">
        {business.logoText}
      </span>
      <span className={cn("min-w-0 flex-1 text-left", labelClassName)}>
        <span className="block truncate text-[14.5px] font-bold text-[#F3EEE6]">{business.name}</span>
        <span className="block truncate text-xs text-p-side-muted">/menu/{business.slug}</span>
      </span>
    </>
  );

  if (!canSwitch) return <div className="flex min-w-0 flex-1 items-center gap-2.5">{head}</div>;

  return (
    <div ref={ref} className="relative min-w-0 flex-1">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Cambiar de negocio"
        onClick={() => setOpen((o) => !o)}
        className="-m-1 flex w-[calc(100%+8px)] items-center gap-2.5 rounded-[10px] border-0 bg-transparent p-1 text-inherit hover:bg-white/6"
      >
        {head}
        <ChevronsUpDown size={15} className={cn("flex-none text-p-side-muted", labelClassName)} aria-hidden />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute top-[calc(100%+8px)] left-0 z-[60] w-[260px] animate-fade-in overflow-hidden rounded-xl border border-p-card bg-white py-1.5 text-p-ink shadow-[0_18px_40px_rgba(0,0,0,.22)]"
        >
          <div className="px-3 pt-1 pb-1.5 text-[11px] font-bold tracking-[.09em] text-p-muted uppercase">Tus negocios</div>
          <div className="max-h-[320px] overflow-y-auto">
            {businesses.map((b) => {
              const on = b.id === business.id;
              return (
                <form key={b.id} action={selectBusiness.bind(null, b.id, "/admin")}>
                  <button
                    type="submit"
                    role="menuitem"
                    disabled={on}
                    className="flex w-full items-center gap-2.5 border-0 bg-transparent px-3 py-2 text-left hover:bg-p-row disabled:cursor-default"
                  >
                    <span className="flex size-7 flex-none items-center justify-center rounded-lg bg-p-chip font-pdisplay text-sm">{b.logoText}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{b.name}</span>
                      <span className="block truncate text-xs text-p-muted">
                        /menu/{b.slug}
                        {b.status === "suspended" ? " · suspendido" : ""}
                      </span>
                    </span>
                    {on ? <Check size={16} className="flex-none" aria-label="Actual" /> : null}
                  </button>
                </form>
              );
            })}
          </div>
          {user.isSuperadmin ? (
            <Link
              href="/admin/negocios"
              role="menuitem"
              className="mt-1 flex items-center gap-2.5 border-t border-p-sep px-3 pt-2.5 pb-1.5 font-semibold text-p-ink no-underline hover:!text-p-ink"
            >
              <Building2 size={16} aria-hidden />
              Administrar negocios
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
