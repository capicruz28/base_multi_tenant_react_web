import { describe, it, expect } from 'vitest';
import {
  derivePaginationMeta,
  isPaginated,
  normalizeListResponse,
  unwrapListItems,
} from '../erp-list-normalize';

describe('erp-list-normalize', () => {
  const sampleItems = [{ id: '1' }, { id: '2' }];

  const envelope = {
    items: sampleItems,
    total: 42,
    pagina_actual: 2,
    total_paginas: 5,
    limit: 10,
  };

  it('isPaginated detecta envelope', () => {
    expect(isPaginated(envelope)).toBe(true);
    expect(isPaginated(sampleItems)).toBe(false);
    expect(isPaginated(null)).toBe(false);
  });

  it('normalizeListResponse preserva envelope', () => {
    const result = normalizeListResponse(envelope, 'B');
    expect(result).toEqual(envelope);
  });

  it('normalizeListResponse convierte list[] legacy a envelope sintético', () => {
    const result = normalizeListResponse(sampleItems, 'A');
    expect(result.items).toEqual(sampleItems);
    expect(result.total).toBe(2);
    expect(result.pagina_actual).toBe(1);
    expect(result.total_paginas).toBe(1);
    expect(result.limit).toBe(2);
  });

  it('normalizeListResponse maneja array vacío', () => {
    const result = normalizeListResponse([], 'A');
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.total_paginas).toBe(0);
  });

  it('unwrapListItems extrae items de envelope o array', () => {
    expect(unwrapListItems(envelope)).toEqual(sampleItems);
    expect(unwrapListItems(sampleItems)).toEqual(sampleItems);
  });

  it('derivePaginationMeta calcula hasPrev/hasNext sin campos backend', () => {
    const meta = derivePaginationMeta(envelope);
    expect(meta.hasPrev).toBe(true);
    expect(meta.hasNext).toBe(true);
    expect(meta.total).toBe(42);
  });

  it('derivePaginationMeta primera página sin anterior', () => {
    const meta = derivePaginationMeta({ ...envelope, pagina_actual: 1 });
    expect(meta.hasPrev).toBe(false);
    expect(meta.hasNext).toBe(true);
  });
});
