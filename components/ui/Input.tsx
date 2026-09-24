import { forwardRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const field =
  "w-full bg-surface text-ink text-base outline-none transition-colors placeholder:text-muted focus:border-ink";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

/** Input del cliente: 52px, radio 14, siempre 16px (evita zoom en iOS). */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ invalid, className, ...props }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(field, "h-[52px] rounded-[14px] border-[1.5px] px-3.5", invalid ? "border-danger focus:border-danger" : "border-line-strong", className)}
      {...props}
    />
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
  /** sm: notas del producto (radio 12). md: notas del pedido (radio 14). */
  size?: "sm" | "md";
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid, size = "md", className, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(field, "resize-none border", size === "sm" ? "rounded-xl px-3.5 py-3" : "rounded-[14px] p-3.5", invalid ? "border-danger" : "border-line-strong", className)}
      {...props}
    />
  );
});

/** Etiqueta + control + error inline (rojo 13/600). */
export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-bold">
        {label}
        {hint ? <span className="font-medium text-muted"> {hint}</span> : null}
      </label>
      {children}
      {error ? (
        <div role="alert" className="mt-1.5 text-[13px] font-semibold text-danger">
          {error}
        </div>
      ) : null}
    </div>
  );
}
