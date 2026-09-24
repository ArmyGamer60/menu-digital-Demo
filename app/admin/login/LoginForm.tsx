"use client";

import { useActionState } from "react";
import { login, type LoginState } from "../actions";
import { PInput, PLabel } from "@/components/dashboard/ui";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, { error: null, email: "andrea@molienda.mx" });
  return (
    <form action={action} noValidate className="grid gap-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <PLabel htmlFor="email">Correo</PLabel>
        <PInput
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.email}
          aria-invalid={!!state.error || undefined}
          className="h-11 rounded-[10px] px-3.5 focus:shadow-[0_0_0_3px_rgba(27,25,22,.08)]"
        />
      </div>
      <div>
        <div className="mb-1.5 flex justify-between">
          <label htmlFor="password" className="text-[13px] font-semibold">
            Contraseña
          </label>
          <span className="text-[13px] text-p-muted">¿La olvidaste?</span>
        </div>
        <PInput
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          defaultValue="molienda"
          aria-invalid={!!state.error || undefined}
          className="h-11 rounded-[10px] px-3.5 focus:shadow-[0_0_0_3px_rgba(27,25,22,.08)]"
        />
      </div>
      {state.error ? (
        <div role="alert" className="text-[13px] font-semibold text-danger">
          {state.error}
        </div>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="h-[46px] rounded-[10px] border-0 bg-p-ink text-[15px] font-bold text-white hover:bg-p-ink-hover disabled:cursor-wait"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
