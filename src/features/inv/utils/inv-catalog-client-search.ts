/** Coincidencia parcial case-insensitive para búsqueda client-side en catálogos INV. */
export function matchesInvCatalogSearch(
  term: string,
  ...values: (string | null | undefined)[]
): boolean {
  const q = term.trim().toLowerCase();
  if (!q) return true;
  return values.some((v) => (v ?? '').toLowerCase().includes(q));
}
