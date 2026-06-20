import { describe, expect, it } from 'vitest';
import type {
  CatDepartamento,
  CatDistrito,
  CatMoneda,
  CatPais,
  CatProvincia,
} from '@/types/catalogos.types';
import type { PlatformCatalogListUiState } from '../types/platform-catalog.types';
import {
  PlatformCatalogAdapterError,
  adaptPlatformCatalogEnvelope,
  buildPlatformCatalogHttpParams,
  isPlatformCatalogPaginatedResponse,
} from './platform-catalog-envelope.adapter';

const ENVELOPE_MONEDA = { itemsKey: 'monedas', totalKey: 'total_monedas' } as const;
const ENVELOPE_PAIS = { itemsKey: 'paises', totalKey: 'total_paises' } as const;
const ENVELOPE_DEPARTAMENTO = {
  itemsKey: 'departamentos',
  totalKey: 'total_departamentos',
} as const;
const ENVELOPE_PROVINCIA = { itemsKey: 'provincias', totalKey: 'total_provincias' } as const;
const ENVELOPE_DISTRITO = { itemsKey: 'distritos', totalKey: 'total_distritos' } as const;

const BASE_UI_STATE: PlatformCatalogListUiState = {
  page: 1,
  limit: 50,
  soloActivos: true,
  paisId: null,
  departamentoId: null,
  provinciaId: null,
  ubigeo: null,
};

describe('platform-catalog-envelope.adapter', () => {
  describe('T-01 — Array plano → error', () => {
    it('lanza PlatformCatalogAdapterError ante array plano', () => {
      expect(() =>
        adaptPlatformCatalogEnvelope([], ENVELOPE_MONEDA, 50),
      ).toThrow(PlatformCatalogAdapterError);
    });
  });

  describe('T-02 — Envelope moneda válido', () => {
    it('mapea PaginatedCatMonedaResponse a ErpPaginatedResponse', () => {
      const moneda: CatMoneda = {
        moneda_id: '11111111-1111-1111-1111-111111111111',
        codigo: 'PEN',
        nombre: 'Sol',
        simbolo: 'S/',
        decimales: 2,
        es_activo: true,
      };
      const raw = {
        monedas: [moneda],
        total_monedas: 1,
        pagina_actual: 1,
        total_paginas: 1,
        items_por_pagina: 50,
      };

      expect(isPlatformCatalogPaginatedResponse(raw, ENVELOPE_MONEDA)).toBe(true);
      expect(adaptPlatformCatalogEnvelope<CatMoneda>(raw, ENVELOPE_MONEDA, 50)).toEqual({
        items: [moneda],
        total: 1,
        pagina_actual: 1,
        total_paginas: 1,
        limit: 50,
      });
    });
  });

  describe('T-03 — Envelope paises válido', () => {
    it('mapea PaginatedCatPaisResponse a ErpPaginatedResponse', () => {
      const pais: CatPais = {
        pais_id: '22222222-2222-2222-2222-222222222222',
        codigo_iso2: 'PE',
        codigo_iso3: 'PER',
        nombre: 'Perú',
        es_activo: true,
      };
      const raw = {
        paises: [pais],
        total_paises: 1,
        pagina_actual: 1,
        total_paginas: 1,
        items_por_pagina: 50,
      };

      expect(adaptPlatformCatalogEnvelope<CatPais>(raw, ENVELOPE_PAIS, 50)).toEqual({
        items: [pais],
        total: 1,
        pagina_actual: 1,
        total_paginas: 1,
        limit: 50,
      });
    });
  });

  describe('T-04 — Envelope departamentos válido', () => {
    it('mapea PaginatedCatDepartamentoResponse a ErpPaginatedResponse', () => {
      const departamento: CatDepartamento = {
        departamento_id: '33333333-3333-3333-3333-333333333333',
        pais_id: '22222222-2222-2222-2222-222222222222',
        codigo: '15',
        nombre: 'Lima',
        es_activo: true,
      };
      const raw = {
        departamentos: [departamento],
        total_departamentos: 1,
        pagina_actual: 1,
        total_paginas: 1,
        items_por_pagina: 50,
      };

      expect(
        adaptPlatformCatalogEnvelope<CatDepartamento>(raw, ENVELOPE_DEPARTAMENTO, 50),
      ).toEqual({
        items: [departamento],
        total: 1,
        pagina_actual: 1,
        total_paginas: 1,
        limit: 50,
      });
    });
  });

  describe('T-05 — Envelope provincias válido', () => {
    it('mapea PaginatedCatProvinciaResponse a ErpPaginatedResponse', () => {
      const provincia: CatProvincia = {
        provincia_id: '44444444-4444-4444-4444-444444444444',
        departamento_id: '33333333-3333-3333-3333-333333333333',
        codigo: '1501',
        nombre: 'Lima',
        es_activo: true,
      };
      const raw = {
        provincias: [provincia],
        total_provincias: 1,
        pagina_actual: 1,
        total_paginas: 1,
        items_por_pagina: 50,
      };

      expect(adaptPlatformCatalogEnvelope<CatProvincia>(raw, ENVELOPE_PROVINCIA, 50)).toEqual({
        items: [provincia],
        total: 1,
        pagina_actual: 1,
        total_paginas: 1,
        limit: 50,
      });
    });
  });

  describe('T-06 — Envelope distritos válido', () => {
    it('mapea PaginatedCatDistritoResponse a ErpPaginatedResponse', () => {
      const distrito: CatDistrito = {
        distrito_id: '55555555-5555-5555-5555-555555555555',
        provincia_id: '44444444-4444-4444-4444-444444444444',
        codigo: '150101',
        nombre: 'Lima',
        ubigeo: '150101',
        es_activo: true,
      };
      const raw = {
        distritos: [distrito],
        total_distritos: 1,
        pagina_actual: 1,
        total_paginas: 1,
        items_por_pagina: 50,
      };

      expect(adaptPlatformCatalogEnvelope<CatDistrito>(raw, ENVELOPE_DISTRITO, 50)).toEqual({
        items: [distrito],
        total: 1,
        pagina_actual: 1,
        total_paginas: 1,
        limit: 50,
      });
    });
  });

  describe('T-07 — itemsKey ausente → error', () => {
    it('lanza PlatformCatalogAdapterError si falta itemsKey', () => {
      const raw = {
        total_monedas: 0,
        pagina_actual: 1,
        total_paginas: 0,
        items_por_pagina: 50,
      };

      expect(isPlatformCatalogPaginatedResponse(raw, ENVELOPE_MONEDA)).toBe(false);
      expect(() =>
        adaptPlatformCatalogEnvelope(raw, ENVELOPE_MONEDA, 50),
      ).toThrow(PlatformCatalogAdapterError);
    });
  });

  describe('T-08 — page/limit → skip correcto', () => {
    it('calcula skip desde page y limit en buildPlatformCatalogHttpParams', () => {
      const params = buildPlatformCatalogHttpParams({
        ...BASE_UI_STATE,
        page: 3,
        limit: 50,
      });

      expect(params).toMatchObject({
        skip: 100,
        limit: 50,
        solo_activos: true,
      });
    });
  });

  describe('T-09 — buscar vacío omitido', () => {
    it('omite buscar cuando el valor está vacío tras trim', () => {
      const params = buildPlatformCatalogHttpParams({
        ...BASE_UI_STATE,
        buscar: '   ',
      });

      expect(params.buscar).toBeUndefined();
      expect('buscar' in params).toBe(false);
    });
  });

  describe('T-10 — buscar >100 truncado', () => {
    it('trunca buscar a 100 caracteres vía delegación al service', () => {
      const longBuscar = 'a'.repeat(101);
      const params = buildPlatformCatalogHttpParams({
        ...BASE_UI_STATE,
        buscar: longBuscar,
      });

      expect(params.buscar).toHaveLength(100);
      expect(params.buscar).toBe('a'.repeat(100));
    });
  });
});
