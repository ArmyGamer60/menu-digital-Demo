import type { Metadata } from "next";
import Image from "next/image";
import { authMode, safeNext } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Entrar — menu.app", robots: { index: false } };

// Lee ADMIN_PASSWORD en cada petición (no en build).
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const mode = authMode();
  return (
    <div className="grid min-h-dvh bg-p-canvas font-pbody text-sm text-p-ink min-[900px]:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="flex flex-col justify-between gap-10 px-12 py-10 max-[520px]:px-6">
        <div className="flex items-center gap-2.5 font-bold">
          <span className="flex size-[30px] items-center justify-center rounded-lg bg-p-ink font-pdisplay text-[17px] text-p-canvas">m</span>
          menu.app
        </div>
        <div className="mx-auto w-full max-w-[380px] animate-[rise_.35s_ease-out]">
          <h1 className="m-0 font-pdisplay text-[40px] leading-[1.02] font-normal tracking-[-.015em]">Entra a tu panel</h1>
          <p className="mt-2.5 mb-7 text-[15px] leading-normal text-p-muted">
            Administra tu menú, horarios y la apariencia de tu negocio.
          </p>
          {mode === "disabled" ? (
            <div role="alert" className="mb-4 rounded-[10px] border border-p-danger-line bg-p-danger-bg px-3.5 py-3 text-[13px] font-semibold text-danger">
              El panel está deshabilitado: falta configurar la variable de entorno ADMIN_PASSWORD.
            </div>
          ) : null}
          <LoginForm next={safeNext(next)} disabled={mode === "disabled"} />
        </div>
        <div className="text-[12.5px] text-p-muted">
          {mode === "dev-any"
            ? "Modo desarrollo: sin ADMIN_PASSWORD, cualquier contraseña entra."
            : "Demo · los datos se guardan en este navegador."}
        </div>
      </div>
      <div className="relative m-4 hidden overflow-hidden rounded-[20px] bg-[#2A2622] min-[900px]:block">
        <Image
          src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1400&q=75&auto=format&fit=crop"
          alt=""
          fill
          priority
          sizes="55vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_40%,rgba(0,0,0,.7))]" />
        <div className="absolute right-9 bottom-9 left-9 text-white">
          <div className="max-w-[520px] font-pdisplay text-[34px] leading-[1.08]">Tu menú, tus pedidos y tu marca en un solo lugar.</div>
          <div className="mt-2.5 opacity-85">Cafeterías, restaurantes, bares, panaderías y food trucks.</div>
        </div>
      </div>
    </div>
  );
}
