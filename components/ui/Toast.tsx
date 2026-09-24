"use client";

import { Check } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

/** Toast en píldora ink con check en --brand. Posición inferior = `--toast-b`. */
export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-1/2 z-[95] flex -translate-x-1/2 animate-toast-in items-center gap-2.5 rounded-[30px] bg-ink py-2 pr-4 pl-2 text-sm font-semibold whitespace-nowrap text-bg shadow-[0_10px_30px_rgba(0,0,0,.25)]"
      style={{ bottom: "var(--toast-b, 90px)" }}
    >
      <span className="flex size-[30px] items-center justify-center rounded-full bg-brand text-on-brand">
        <Check size={16} strokeWidth={2.6} aria-hidden />
      </span>
      {message}
    </div>
  );
}

/** Estado de un toast que se oculta solo. */
export function useToast(duration = 1900) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const show = useCallback(
    (msg: string) => {
      clearTimeout(timer.current);
      setMessage(msg);
      timer.current = setTimeout(() => setMessage(null), duration);
    },
    [duration],
  );
  useEffect(() => () => clearTimeout(timer.current), []);
  return { message, show };
}
