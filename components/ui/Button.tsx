import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "brand" | "ink" | "outline" | "ghost" | "whatsapp" | "danger" | "disabled";
type Size = "sm" | "md" | "lg" | "xl";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  brand: "bg-brand text-on-brand border-0",
  ink: "bg-ink text-bg border-0",
  outline: "bg-transparent text-ink border border-ink",
  ghost: "bg-transparent text-ink border border-line",
  whatsapp: "bg-wa text-white border-0",
  danger: "bg-[#FBEDEB] text-danger border border-[#F3C9C4]",
  disabled: "bg-line-strong text-muted border-0",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-[46px] px-[22px] text-[15px]",
  lg: "h-14 px-6 text-base tracking-[.01em]",
  xl: "h-[58px] px-6 text-base",
};

/** Botón en píldora; el radio sigue al cardStyle (`--btn-r`, 0 en premium). */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "brand", size = "md", block, className, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2.5 rounded-[var(--btn-r,28px)] font-bold transition-transform duration-100 active:scale-[.98] disabled:active:scale-100",
        VARIANTS[variant],
        SIZES[size],
        block && "w-full",
        className,
      )}
      {...props}
    />
  );
});

/** Botón circular de icono (44×44, touch target mínimo). Requiere aria-label. */
export const IconButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { "aria-label": string; tone?: "line" | "ink" | "white" }
>(function IconButton({ className, tone = "line", type = "button", ...props }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "relative flex size-11 flex-none items-center justify-center rounded-full",
        tone === "line" && "border border-line bg-transparent",
        tone === "ink" && "border-0 bg-ink text-bg",
        tone === "white" && "border-0 bg-white/92 text-[#1a1a1a] shadow-[0_2px_10px_rgba(0,0,0,.15)]",
        className,
      )}
      {...props}
    />
  );
});
