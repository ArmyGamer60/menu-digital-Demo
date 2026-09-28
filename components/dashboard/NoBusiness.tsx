import { Store } from "lucide-react";
import { logout } from "@/app/admin/actions";
import { Credit } from "@/components/ui/Credit";
import type { SessionUser } from "@/lib/auth";

/** Cuenta sin negocios asignados (el superadmin aún no le dio acceso). */
export function NoBusiness({ user }: { user: SessionUser }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-p-canvas px-6 font-pbody text-sm text-p-ink">
      <div className="max-w-[420px] text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full border-[1.5px] border-p-ink">
          <Store size={24} strokeWidth={1.8} />
        </div>
        <h1 className="m-0 font-pdisplay text-[30px] leading-[1.1] font-normal">Aún no tienes un negocio</h1>
        <p className="mt-2 text-[15px] leading-normal text-p-muted">
          Tu cuenta <b className="text-p-ink">{user.email}</b> está activa, pero todavía no tiene un menú asignado. Pide acceso a quien te
          dio de alta.
        </p>
        <form action={logout}>
          <button type="submit" className="mt-6 h-10 rounded-[10px] border border-p-input bg-white px-4 font-semibold">
            Cerrar sesión
          </button>
        </form>
        <Credit className="mt-16 text-p-muted" />
      </div>
    </div>
  );
}
