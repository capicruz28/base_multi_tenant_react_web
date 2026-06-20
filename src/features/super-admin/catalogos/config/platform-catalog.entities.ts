/**
 * FA-001 — Entity Registry data-only (ADR OB-09).
 * Sin ReactNode, hooks, JSX ni lógica de negocio.
 * Code Review M-01: envelope literals `as const satisfies`.
 * Code Review M-02: column accessors sin *_id.
 * Code Review M-03: configs con `satisfies PlatformCatalogEntityConfig<…>`.
 */
import {
  DollarSign,
  Globe,
  LocateFixed,
  Map,
  MapPinned,
} from 'lucide-react';
import type {
  CatDepartamento,
  CatDepartamentoCreate,
  CatDistrito,
  CatDistritoCreate,
  CatMoneda,
  CatMonedaCreate,
  CatPais,
  CatPaisCreate,
  CatProvincia,
  CatProvinciaCreate,
} from '@/types/catalogos.types';
import type {
  PlatformCatalogEntityConfig,
  PlatformCatalogEntityId,
  PlatformCatalogEnvelopeMapping,
  PlatformCatalogItemByEntityId,
  PlatformCatalogCreateByEntityId,
} from '../types/platform-catalog.types';

const DEFAULT_LIMIT = 50;
const LIMIT_OPTIONS = [25, 50, 100] as const;

const WARM_PREFETCH_LIMIT = 1000;

const ENVELOPE_MONEDA = {
  itemsKey: 'monedas',
  totalKey: 'total_monedas',
} as const satisfies PlatformCatalogEnvelopeMapping;

const ENVELOPE_PAIS = {
  itemsKey: 'paises',
  totalKey: 'total_paises',
} as const satisfies PlatformCatalogEnvelopeMapping;

const ENVELOPE_DEPARTAMENTO = {
  itemsKey: 'departamentos',
  totalKey: 'total_departamentos',
} as const satisfies PlatformCatalogEnvelopeMapping;

const ENVELOPE_PROVINCIA = {
  itemsKey: 'provincias',
  totalKey: 'total_provincias',
} as const satisfies PlatformCatalogEnvelopeMapping;

const ENVELOPE_DISTRITO = {
  itemsKey: 'distritos',
  totalKey: 'total_distritos',
} as const satisfies PlatformCatalogEnvelopeMapping;

const MONEDA_CONFIG = {
  id: 'moneda',
  apiSegment: 'monedas',
  envelope: ENVELOPE_MONEDA,
  title: 'Monedas',
  singularLabel: 'moneda',
  searchPlaceholder: 'Buscar monedas...',
  emptyIcon: DollarSign,
  defaultLimit: DEFAULT_LIMIT,
  limitOptions: LIMIT_OPTIONS,
  columns: [
    { id: 'codigo', header: 'Código', accessor: 'codigo' },
    { id: 'nombre', header: 'Nombre', accessor: 'nombre' },
    { id: 'simbolo', header: 'Símbolo', accessor: 'simbolo' },
    { id: 'decimales', header: 'Decimales', accessor: 'decimales', hideOnMobile: true },
    { id: 'activo', header: 'Activo', accessor: 'es_activo' },
  ],
  toolbarFkFilters: [],
  createDefault: {
    codigo: '',
    nombre: '',
    simbolo: '',
    decimales: 2,
    es_activo: true,
  },
  requiresSuperAdmin: true,
} as const satisfies PlatformCatalogEntityConfig<CatMoneda, CatMonedaCreate>;

const PAIS_CONFIG = {
  id: 'pais',
  apiSegment: 'paises',
  envelope: ENVELOPE_PAIS,
  title: 'Países',
  singularLabel: 'país',
  searchPlaceholder: 'Buscar países...',
  emptyIcon: Globe,
  defaultLimit: DEFAULT_LIMIT,
  limitOptions: LIMIT_OPTIONS,
  columns: [
    { id: 'codigo_iso2', header: 'ISO2', accessor: 'codigo_iso2' },
    { id: 'codigo_iso3', header: 'ISO3', accessor: 'codigo_iso3', hideOnMobile: true },
    { id: 'nombre', header: 'Nombre', accessor: 'nombre' },
    { id: 'activo', header: 'Activo', accessor: 'es_activo' },
  ],
  toolbarFkFilters: [],
  createDefault: {
    codigo_iso2: '',
    codigo_iso3: '',
    nombre: '',
    es_activo: true,
  },
  requiresSuperAdmin: true,
} as const satisfies PlatformCatalogEntityConfig<CatPais, CatPaisCreate>;

const DEPARTAMENTO_CONFIG = {
  id: 'departamento',
  apiSegment: 'departamentos',
  envelope: ENVELOPE_DEPARTAMENTO,
  title: 'Departamentos',
  singularLabel: 'departamento',
  searchPlaceholder: 'Buscar departamentos...',
  emptyIcon: Map,
  defaultLimit: DEFAULT_LIMIT,
  limitOptions: LIMIT_OPTIONS,
  columns: [
    { id: 'codigo', header: 'Código', accessor: 'codigo' },
    { id: 'nombre', header: 'Nombre', accessor: 'nombre' },
    { id: 'pais', header: 'País', accessor: 'fk:pais' },
    { id: 'activo', header: 'Activo', accessor: 'es_activo' },
  ],
  toolbarFkFilters: ['pais'],
  fkWarmPrefetch: {
    parentEntityId: 'pais',
    params: {
      skip: 0,
      limit: WARM_PREFETCH_LIMIT,
      solo_activos: false,
    },
  },
  createDefault: {
    pais_id: '',
    codigo: '',
    nombre: '',
  },
  requiresSuperAdmin: true,
} as const satisfies PlatformCatalogEntityConfig<CatDepartamento, CatDepartamentoCreate>;

const PROVINCIA_CONFIG = {
  id: 'provincia',
  apiSegment: 'provincias',
  envelope: ENVELOPE_PROVINCIA,
  title: 'Provincias',
  singularLabel: 'provincia',
  searchPlaceholder: 'Buscar provincias...',
  emptyIcon: MapPinned,
  defaultLimit: DEFAULT_LIMIT,
  limitOptions: LIMIT_OPTIONS,
  columns: [
    { id: 'codigo', header: 'Código', accessor: 'codigo' },
    { id: 'nombre', header: 'Nombre', accessor: 'nombre' },
    { id: 'departamento', header: 'Departamento', accessor: 'fk:departamento' },
    { id: 'activo', header: 'Activo', accessor: 'es_activo' },
  ],
  toolbarFkFilters: ['departamento'],
  fkWarmPrefetch: {
    parentEntityId: 'departamento',
    params: {
      skip: 0,
      limit: WARM_PREFETCH_LIMIT,
      solo_activos: false,
    },
  },
  createDefault: {
    departamento_id: '',
    codigo: '',
    nombre: '',
  },
  requiresSuperAdmin: true,
} as const satisfies PlatformCatalogEntityConfig<CatProvincia, CatProvinciaCreate>;

const DISTRITO_CONFIG = {
  id: 'distrito',
  apiSegment: 'distritos',
  envelope: ENVELOPE_DISTRITO,
  title: 'Distritos',
  singularLabel: 'distrito',
  searchPlaceholder: 'Buscar distritos...',
  emptyIcon: LocateFixed,
  defaultLimit: DEFAULT_LIMIT,
  limitOptions: LIMIT_OPTIONS,
  columns: [
    { id: 'codigo', header: 'Código', accessor: 'codigo' },
    { id: 'nombre', header: 'Nombre', accessor: 'nombre' },
    { id: 'ubigeo', header: 'Ubigeo', accessor: 'ubigeo' },
    { id: 'provincia', header: 'Provincia', accessor: 'fk:provincia' },
    { id: 'activo', header: 'Activo', accessor: 'es_activo', hideOnMobile: true },
  ],
  toolbarFkFilters: ['pais', 'departamento', 'provincia'],
  fkWarmPrefetch: {
    parentEntityId: 'provincia',
    params: {
      skip: 0,
      limit: WARM_PREFETCH_LIMIT,
      solo_activos: false,
    },
  },
  createDefault: {
    provincia_id: '',
    codigo: '',
    nombre: '',
    ubigeo: '',
  },
  requiresSuperAdmin: true,
} as const satisfies PlatformCatalogEntityConfig<CatDistrito, CatDistritoCreate>;

export const PLATFORM_CATALOG_ENTITIES = {
  moneda: MONEDA_CONFIG,
  pais: PAIS_CONFIG,
  departamento: DEPARTAMENTO_CONFIG,
  provincia: PROVINCIA_CONFIG,
  distrito: DISTRITO_CONFIG,
} as const;

export function getPlatformCatalogEntityConfig<E extends PlatformCatalogEntityId>(
  entityId: E,
): PlatformCatalogEntityConfig<
  PlatformCatalogItemByEntityId[E],
  PlatformCatalogCreateByEntityId[E]
> {
  return PLATFORM_CATALOG_ENTITIES[entityId] as PlatformCatalogEntityConfig<
    PlatformCatalogItemByEntityId[E],
    PlatformCatalogCreateByEntityId[E]
  >;
}
