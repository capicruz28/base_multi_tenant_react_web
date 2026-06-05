export { str, optId, optStr, bool, numOrUndef } from '@/features/org/utils/org-form-dirty.helpers';

/** Compara arrays de líneas normalizadas en orden (sin reordenar). */
export function lineasDirtyEqual<T>(
  a: T[],
  b: T[],
  normalizer: (line: T) => unknown,
  isEmptyTemplate: (line: T) => boolean,
): boolean {
  const normA = a.map(normalizer).filter((_, i) => !isEmptyTemplate(a[i]));
  const normB = b.map(normalizer).filter((_, i) => !isEmptyTemplate(b[i]));
  return JSON.stringify(normA) === JSON.stringify(normB);
}

export function formsDirtyEqual(current: unknown, baseline: unknown): boolean {
  return JSON.stringify(current) !== JSON.stringify(baseline);
}
