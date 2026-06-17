import { describe, it, expect } from 'vitest';
import {
  appendErpListPaginationSort,
  buildErpListQueryParams,
  resolveErpListFetchParams,
} from '../erp-list-query-params';
import { ERP_LIST_DEFAULT_LIMIT } from '../erp-list.constants';

describe('erp-list-query-params', () => {
  it('buildErpListQueryParams incluye filtros base y omite vacíos', () => {
    const q = buildErpListQueryParams(
      { solo_activos: true, empresa_id: undefined, estado: '' },
      { buscar: '  abc  ' },
    );
    expect(q).toEqual({ solo_activos: true, buscar: 'abc' });
  });

  it('appendErpListPaginationSort acopla limit solo con page', () => {
    const q: Record<string, string | number | boolean> = { solo_activos: true };
    appendErpListPaginationSort(q, { limit: 25 });
    expect(q.limit).toBeUndefined();
    expect(q.page).toBeUndefined();

    appendErpListPaginationSort(q, { page: 2, limit: 25 });
    expect(q).toMatchObject({ page: 2, limit: 25 });
  });

  it('appendErpListPaginationSort no envía sort_dir sin sort_by', () => {
    const q: Record<string, string | number | boolean> = {};
    appendErpListPaginationSort(q, { sort_dir: 'desc' });
    expect(q.sort_dir).toBeUndefined();
  });

  it('appendErpListPaginationSort envía sort_by y sort_dir juntos', () => {
    const q: Record<string, string | number | boolean> = {};
    appendErpListPaginationSort(q, { sort_by: 'nombre', sort_dir: 'asc' });
    expect(q).toEqual({ sort_by: 'nombre', sort_dir: 'asc' });
  });

  it('appendErpListPaginationSort limita máximo a 100', () => {
    const q: Record<string, string | number | boolean> = {};
    appendErpListPaginationSort(q, { page: 1, limit: 500 });
    expect(q.limit).toBe(100);
  });

  it('resolveErpListFetchParams fuerza paginación en Tier C', () => {
    const params = resolveErpListFetchParams(
      { solo_activos: true },
      { tier: 'C', forcePagination: true },
      { page: 3, limit: 50, debouncedBuscar: 'x' },
    );
    expect(params).toMatchObject({
      page: 3,
      limit: 50,
      buscar: 'x',
      solo_activos: true,
    });
  });

  it('resolveErpListFetchParams no pagina Tier A por defecto', () => {
    const params = resolveErpListFetchParams(
      { solo_activos: true },
      { tier: 'A' },
      { page: 1, limit: 50 },
    );
    expect(params.page).toBeUndefined();
    expect(params.limit).toBeUndefined();
  });

  it('resolveErpListFetchParams pagina Tier B con forcePagination (Productos)', () => {
    const params = resolveErpListFetchParams(
      { solo_activos: true },
      { tier: 'B', forcePagination: true, defaultLimit: 50, sortableColumns: [] },
      { page: 2, limit: 50, sort_by: 'nombre', sort_dir: 'asc' },
    );
    expect(params).toMatchObject({
      page: 2,
      limit: 50,
      sort_by: 'nombre',
      sort_dir: 'asc',
      solo_activos: true,
    });
  });

  it('resolveErpListFetchParams usa default limit', () => {
    const params = resolveErpListFetchParams(
      {},
      { tier: 'C', forcePagination: true },
      { page: 1, limit: ERP_LIST_DEFAULT_LIMIT },
    );
    expect(params.limit).toBe(ERP_LIST_DEFAULT_LIMIT);
  });
});
