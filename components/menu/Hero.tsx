import Image from "next/image";
import type { Theme } from "@/types";

/** Hero full-bleed con degradado, pill "Especial" en --accent. */
export function Hero({ theme }: { theme: Theme }) {
  return (
    <section className="relative mt-[18px] flex min-h-[var(--hero-h)] animate-[rise_.4s_ease-out] items-end overflow-hidden rounded-[var(--hero-radius)] bg-ink">
      {theme.heroImage ? (
        <Image
          src={theme.heroImage}
          alt=""
          fill
          priority
          sizes="(min-width: 1100px) 780px, 100vw"
          className="object-cover"
        />
      ) : null}
      <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_20%,rgba(0,0,0,.72)_100%)]" />
      <div className="relative max-w-[560px] p-[22px] text-white">
        <div className="inline-flex rounded-[20px] bg-accent px-2.5 py-[5px] text-[11.5px] leading-[1.2] font-bold tracking-[.06em] text-[#1b1408] uppercase">
          Especial
        </div>
        <h2 className="mt-2.5 mb-0 font-display text-[length:var(--hero-fs)] leading-[1.02] font-normal tracking-[-.015em] text-balance">
          {theme.heroTitle}
        </h2>
        {theme.heroText ? <p className="mt-1.5 mb-0 text-[15px] leading-[1.45] text-white/90">{theme.heroText}</p> : null}
      </div>
    </section>
  );
}
