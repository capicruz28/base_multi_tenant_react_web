/**
 * DEPRECATED (Fase 6 PERF): búsqueda client-side en catálogos INV migrada a server `buscar`.
 * Sin consumidores en código de aplicación; conservado por política de no eliminar utilidades legacy.
 */
export function matchesInvCatalogSearch(
  term: string,
  ...values: (string | null | undefined)[]
): boolean {
  const q = term.trim().toLowerCase();
  if (!q) return true;
  return values.some((v) => (v ?? '').toLowerCase().includes(q));
}
