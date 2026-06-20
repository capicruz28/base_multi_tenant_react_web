/**
 * FA-001 — Adapter envelope Familia A (PA-005) → ErpPaginatedResponse.
 * Sin HTTP, sin React Query. Validación buscar delegada al service vía buildQueryParams.
 */
import type { ErpPaginatedResponse } from '@/core/list/erp-list.types';
import { buildQueryParams } from '../services/platform-catalog-global.service';
import type {
  PlatformCatalogEnvelopeMapping,
  PlatformCatalogListParams,
  PlatformCatalogListUiState,
} from '../types/platform-catalog.types';

export class PlatformCatalogAdapterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlatformCatalogAdapterError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function assertPaginatedShape(
  raw: unknown,
  envelope: PlatformCatalogEnvelopeMapping,
): Record<string, unknown> {
  if (Array.isArray(raw)) {
    throw new PlatformCatalogAdapterError(
      'Respuesta inválida: se esperaba envelope paginado, se recibió un array plano.',
    );
  }

  if (!isRecord(raw)) {
    throw new PlatformCatalogAdapterError(
      'Respuesta inválida: se esperaba un objeto envelope paginado.',
    );
  }

  const items = raw[envelope.itemsKey];
  if (!Array.isArray(items)) {
    throw new PlatformCatalogAdapterError(
      `Respuesta inválida: falta o es inválido el campo "${envelope.itemsKey}".`,
    );
  }

  const total = raw[envelope.totalKey];
  if (typeof total !== 'number' || !Number.isFinite(total) || total < 0) {
    throw new PlatformCatalogAdapterError(
      `Respuesta inválida: "${envelope.totalKey}" debe ser un número ≥ 0.`,
    );
  }

  const paginaActual = raw.pagina_actual;
  if (
    typeof paginaActual !== 'number' ||
    !Number.isFinite(paginaActual) ||
    paginaActual < 1
  ) {
    throw new PlatformCatalogAdapterError(
      'Respuesta inválida: "pagina_actual" debe ser un número ≥ 1.',
    );
  }

  const totalPaginas = raw.total_paginas;
  if (
    typeof totalPaginas !== 'number' ||
    !Number.isFinite(totalPaginas) ||
    totalPaginas < 0
  ) {
    throw new PlatformCatalogAdapterError(
      'Respuesta inválida: "total_paginas" debe ser un número ≥ 0.',
    );
  }

  return raw;
}

export function isPlatformCatalogPaginatedResponse(
  raw: unknown,
  envelope: PlatformCatalogEnvelopeMapping,
): boolean {
  if (!isRecord(raw)) {
    return false;
  }

  const items = raw[envelope.itemsKey];
  const total = raw[envelope.totalKey];
  const paginaActual = raw.pagina_actual;
  const totalPaginas = raw.total_paginas;

  return (
    Array.isArray(items) &&
    typeof total === 'number' &&
    Number.isFinite(total) &&
    total >= 0 &&
    typeof paginaActual === 'number' &&
    Number.isFinite(paginaActual) &&
    paginaActual >= 1 &&
    typeof totalPaginas === 'number' &&
    Number.isFinite(totalPaginas) &&
    totalPaginas >= 0
  );
}

export function adaptPlatformCatalogEnvelope<T>(
  raw: unknown,
  envelope: PlatformCatalogEnvelopeMapping,
  limitApplied: number,
): ErpPaginatedResponse<T> {
  const body = assertPaginatedShape(raw, envelope);
  const items = body[envelope.itemsKey] as T[];
  const total = body[envelope.totalKey] as number;

  return {
    items,
    total,
    pagina_actual: body.pagina_actual as number,
    total_paginas: body.total_paginas as number,
    limit: limitApplied,
  };
}

/**
 * UI state → PlatformCatalogListParams (skip + filtros).
 * Normalización buscar/limit/skip vía buildQueryParams del service (Scope Freeze §8.3).
 */
export function buildPlatformCatalogHttpParams(
  state: PlatformCatalogListUiState,
): PlatformCatalogListParams {
  return buildQueryParams({
    page: state.page,
    limit: state.limit,
    solo_activos: state.soloActivos,
    buscar: state.buscar,
    pais_id: state.paisId ?? undefined,
    departamento_id: state.departamentoId ?? undefined,
    provincia_id: state.provinciaId ?? undefined,
    ubigeo: state.ubigeo ?? undefined,
  });
}
