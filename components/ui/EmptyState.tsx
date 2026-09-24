import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Estado vacío / error: icono en círculo 64px, título display 30px, texto muted, acción opcional. */
export function EmptyState({
  icon,
  title,
  children,
  action,
  className,
}: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto max-w-[420px] animate-rise px-6 py-20 text-center", className)}>
      <div className="mx-auto mb-[18px] flex size-16 items-center justify-center rounded-full border-[1.5px] border-ink">
        {icon}
      </div>
      <div className="font-display text-[30px] leading-[1.1]">{title}</div>
      {children ? <p className="mt-2.5 mb-0 text-[15px] leading-normal text-muted">{children}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
