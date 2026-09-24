import { cn } from "@/lib/cn";

/** Crédito del desarrollador al pie de todas las páginas (menú y panel). Hereda el color del contexto. */
export function Credit({ className }: { className?: string }) {
  return (
    <p className={cn("m-0 text-center text-xs opacity-70", className)}>
      Desarrollado por{" "}
      <a href="https://zenithestudios.com" target="_blank" rel="noopener noreferrer" className="font-semibold">
        zenithestudios.com
      </a>
    </p>
  );
}
