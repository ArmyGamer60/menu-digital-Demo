/** Slug público saneado a [a-z0-9-]: minúsculas, sin acentos, un solo guion seguido. */
export const sanitizeSlug = (v: string) =>
  v
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-{2,}/g, "-");
