import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** Select nativo con el estilo de inputs del panel (40px, radio 9, borde #DCD7CE). */
export const Select = forwardRef<HTMLSelectElement, Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & { size?: "sm" | "md" }>(
  function Select({ className, size = "md", ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          "border border-p-input bg-white px-2.5 text-p-ink outline-none focus:border-p-ink",
          size === "sm" ? "h-[34px] rounded-lg font-semibold" : "h-10 rounded-[9px]",
          className,
        )}
        {...props}
      />
    );
  },
);
