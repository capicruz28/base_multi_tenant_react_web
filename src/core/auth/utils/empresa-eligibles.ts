import type { EmpresaDisponible, EmpresaOption } from '@/features/auth/types/auth.types';

export function resolveEmpresaLabel(empresa: {
  razon_social: string;
  nombre_comercial?: string | null;
}): string {
  const comercial = empresa.nombre_comercial?.trim();
  if (comercial) return comercial;
  const razon = empresa.razon_social?.trim();
  return razon || '';
}

export function normalizeEmpresasElegibles(raw: unknown): EmpresaOption[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const result: EmpresaOption[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const record = item as EmpresaDisponible & Record<string, unknown>;
    const empresaId = String(record.empresa_id ?? '').trim();
    if (!empresaId || seen.has(empresaId)) continue;
    const razonSocial = String(record.razon_social ?? '').trim();
    if (!razonSocial) continue;
    seen.add(empresaId);
    result.push({
      empresa_id: empresaId,
      razon_social: razonSocial,
      nombre_comercial:
        record.nombre_comercial === null || record.nombre_comercial === undefined
          ? null
          : String(record.nombre_comercial),
    });
  }
  return result;
}

export function mapOrgEmpresaToOption(empresa: {
  empresa_id: string;
  razon_social: string;
  nombre_comercial?: string | null;
}): EmpresaOption {
  return {
    empresa_id: empresa.empresa_id,
    razon_social: empresa.razon_social,
    nombre_comercial: empresa.nombre_comercial ?? null,
  };
}

export function normalizeEmpresaId(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Comparación UUID tolerante a mayúsculas/minúsculas. */
export function isSameEmpresaId(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const left = normalizeEmpresaId(a);
  const right = normalizeEmpresaId(b);
  if (!left || !right) return false;
  return left.toLowerCase() === right.toLowerCase();
}

export function findEmpresaById(
  list: EmpresaOption[],
  empresaId: string | null | undefined,
): EmpresaOption | undefined {
  if (!empresaId) return undefined;
  return list.find((e) => isSameEmpresaId(e.empresa_id, empresaId));
}
