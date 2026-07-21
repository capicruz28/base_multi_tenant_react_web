/**
 * Resolución de secuencia Runtime — algoritmo contrato §7 (+ §6 / §8).
 * No inventa defaults desde Manifest.
 */

import type {
  CodigoRuntimeScopeContext,
  CodigoRuntimeScopeType,
  CodigoRuntimeSequenceItem,
  CodigoRuntimeSnapshot,
  ResolveRuntimeSequenceResult,
} from './runtime-snapshot.types';

function normId(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function idsEqual(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const left = normId(a);
  const right = normId(b);
  if (!left || !right) return false;
  return left === right;
}

function finalizeMatch(
  item: CodigoRuntimeSequenceItem,
): ResolveRuntimeSequenceResult {
  if (!item.es_activo) {
    return { status: 'inactive', item };
  }
  return { status: 'resolved', item };
}

function matchTenant(
  candidates: CodigoRuntimeSequenceItem[],
): ResolveRuntimeSequenceResult {
  // Contrato: único ítem; ids de scope null.
  const item = candidates[0];
  if (!item) return { status: 'not_found' };
  return finalizeMatch(item);
}

function matchEmpresa(
  candidates: CodigoRuntimeSequenceItem[],
  ctx: CodigoRuntimeScopeContext,
): ResolveRuntimeSequenceResult {
  const empresaId = ctx.empresaId;
  if (!normId(empresaId)) {
    return { status: 'not_found' };
  }
  const item = candidates.find((c) => idsEqual(c.empresa_id, empresaId));
  if (!item) return { status: 'not_found' };
  return finalizeMatch(item);
}

function matchAlmacen(
  candidates: CodigoRuntimeSequenceItem[],
  ctx: CodigoRuntimeScopeContext,
): ResolveRuntimeSequenceResult {
  const almacenId = ctx.almacenId;
  if (!normId(almacenId)) {
    return { status: 'not_found' };
  }
  const item = candidates.find((c) => {
    if (!idsEqual(c.almacen_id, almacenId)) return false;
    // Contrato §7: empresa si aplica.
    if (c.empresa_id != null && normId(c.empresa_id)) {
      return idsEqual(c.empresa_id, ctx.empresaId);
    }
    return true;
  });
  if (!item) return { status: 'not_found' };
  return finalizeMatch(item);
}

function matchPuntoVenta(
  candidates: CodigoRuntimeSequenceItem[],
  ctx: CodigoRuntimeScopeContext,
): ResolveRuntimeSequenceResult {
  const puntoVentaId = ctx.puntoVentaId;
  if (!normId(puntoVentaId)) {
    return { status: 'not_found' };
  }
  const item = candidates.find((c) =>
    idsEqual(c.punto_venta_id, puntoVentaId),
  );
  if (!item) return { status: 'not_found' };
  return finalizeMatch(item);
}

/**
 * Resuelve el ítem Runtime para una sequence_key + contexto de scope.
 * No usar el primer ítem de la lista sin filtrar (§7).
 */
export function resolveRuntimeSequence(params: {
  snapshot: CodigoRuntimeSnapshot | null | undefined;
  sequenceKey: string;
  scopeContext?: CodigoRuntimeScopeContext;
}): ResolveRuntimeSequenceResult {
  const sequenceKey = (params.sequenceKey ?? '').trim();
  if (!sequenceKey) {
    return { status: 'not_found' };
  }

  const items = params.snapshot?.items ?? [];
  const candidates = items.filter((item) => item.sequence_key === sequenceKey);
  if (candidates.length === 0) {
    return { status: 'not_found' };
  }

  const scopeType = candidates[0]?.scope_type as CodigoRuntimeScopeType | string;
  const ctx = params.scopeContext ?? {};

  switch (scopeType) {
    case 'TENANT':
      return matchTenant(candidates);
    case 'EMPRESA':
      return matchEmpresa(candidates, ctx);
    case 'ALMACEN':
      return matchAlmacen(candidates, ctx);
    case 'PUNTO_VENTA':
      return matchPuntoVenta(candidates, ctx);
    default:
      return { status: 'not_found' };
  }
}
