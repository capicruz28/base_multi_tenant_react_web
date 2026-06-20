import { Plus, RefreshCw } from 'lucide-react';
import { OrgToolbarSearch } from '@/features/org/components/OrgToolbarSearch';
import type { PlatformCatalogListFkState } from '../hooks/usePlatformGlobalCatalogList';
import type {
  PlatformCatalogEntityConfig,
  PlatformCatalogEntityId,
  PlatformCatalogCreateByEntityId,
  PlatformCatalogItemByEntityId,
  PlatformCatalogToolbarFkFilter,
} from '../types/platform-catalog.types';
import { PlatformCatalogFkSelect } from './PlatformCatalogFkSelect';

export interface PlatformCatalogToolbarSearchProps {
  inputValue: string;
  setInputValue: (value: string) => void;
}

export type PlatformCatalogFkField = 'paisId' | 'departamentoId' | 'provinciaId';

export interface PlatformCatalogToolbarProps<
  E extends PlatformCatalogEntityId = PlatformCatalogEntityId,
> {
  config: PlatformCatalogEntityConfig<
    PlatformCatalogItemByEntityId[E],
    PlatformCatalogCreateByEntityId[E]
  >;
  search: PlatformCatalogToolbarSearchProps;
  soloActivos: boolean;
  onSoloActivosChange: (soloActivos: boolean) => void;
  fkState: Pick<PlatformCatalogListFkState, PlatformCatalogFkField>;
  onFkChange: (field: PlatformCatalogFkField, value: string | null) => void;
  ubigeo: string | null;
  onUbigeoChange: (value: string | null) => void;
  onRefresh: () => void;
  onCreate: () => void;
  isFetching?: boolean;
  disabled?: boolean;
}

const FK_FILTER_LABELS: Record<
  Exclude<PlatformCatalogToolbarFkFilter, 'ubigeo'>,
  { placeholder: string; field: PlatformCatalogFkField; entityId: 'pais' | 'departamento' | 'provincia' }
> = {
  pais: { placeholder: 'Todos los países', field: 'paisId', entityId: 'pais' },
  departamento: {
    placeholder: 'Todos los departamentos',
    field: 'departamentoId',
    entityId: 'departamento',
  },
  provincia: {
    placeholder: 'Todas las provincias',
    field: 'provinciaId',
    entityId: 'provincia',
  },
};

const ubigeoInputClass =
  'px-3 py-2 w-full min-w-[8rem] max-w-xs shrink-0 border border-border-base rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base text-sm disabled:opacity-50 disabled:cursor-not-allowed';

/**
 * Toolbar FK: solo `<select>` visible (paridad legacy Provincias/Distritos).
 * PlatformCatalogFkSelect incluye IamSearchInput para modales; aquí se oculta vía layout.
 */
const TOOLBAR_FK_FILTER_WRAP_CLASS =
  'shrink-0 min-w-[12rem] [&>div]:max-w-none [&>div]:gap-0 [&>div>div:first-child]:hidden';

function capitalizeLabel(label: string): string {
  if (!label) {
    return label;
  }
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * FA-001 WP-05 — Toolbar catálogo global (Scope Freeze §9.1).
 * Sin lógica de negocio; estado y handlers vía props.
 */
export function PlatformCatalogToolbar<E extends PlatformCatalogEntityId>({
  config,
  search,
  soloActivos,
  onSoloActivosChange,
  fkState,
  onFkChange,
  ubigeo,
  onUbigeoChange,
  onRefresh,
  onCreate,
  isFetching = false,
  disabled = false,
}: PlatformCatalogToolbarProps<E>) {
  /** Mutaciones / flujo bloqueado — no incluir isFetching (paridad INV Productos). */
  const mutationDisabled = disabled;
  /** Refresh: evitar doble disparo durante fetch activo. */
  const refreshDisabled = disabled || isFetching;
  const createLabel = `Nuevo ${capitalizeLabel(config.singularLabel)}`;

  return (
    <div className="mb-6 bg-surface rounded-lg shadow-sm border border-border-base p-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-wrap">
          <OrgToolbarSearch
            value={search.inputValue}
            onChange={search.setInputValue}
            placeholder={config.searchPlaceholder}
            disabled={mutationDisabled}
            aria-label={`Buscar ${config.title.toLowerCase()}`}
          />

          {config.toolbarFkFilters.map((filter) => {
            if (filter === 'ubigeo') {
              return (
                <input
                  key="ubigeo"
                  type="text"
                  value={ubigeo ?? ''}
                  onChange={(e) => onUbigeoChange(e.target.value || null)}
                  placeholder="Ubigeo"
                  disabled={mutationDisabled}
                  className={ubigeoInputClass}
                  aria-label="Filtrar por ubigeo"
                />
              );
            }

            const meta = FK_FILTER_LABELS[filter];
            const scope =
              filter === 'pais'
                ? {}
                : filter === 'departamento'
                  ? { paisId: fkState.paisId }
                  : { paisId: fkState.paisId, departamentoId: fkState.departamentoId };

            return (
              <div key={filter} className={TOOLBAR_FK_FILTER_WRAP_CLASS}>
                <PlatformCatalogFkSelect
                  entityId={meta.entityId}
                  value={fkState[meta.field]}
                  onChange={(value) => onFkChange(meta.field, value)}
                  scope={scope}
                  placeholder={meta.placeholder}
                  disabled={mutationDisabled}
                  allowClear
                />
              </div>
            );
          })}

          <label className="flex shrink-0 items-center gap-2 px-3 py-2 border border-border-base rounded-lg cursor-pointer hover:bg-overlay select-none">
            <input
              type="checkbox"
              checked={!soloActivos}
              onChange={(e) => onSoloActivosChange(!e.target.checked)}
              disabled={mutationDisabled}
              className="rounded border-border-base text-brand-primary focus:ring-brand-primary"
              aria-label="Ver inactivos"
            />
            <span className="text-sm text-text-soft">Ver inactivos</span>
          </label>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshDisabled}
            className="p-2 text-text-soft hover:text-text-base hover:bg-overlay rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Actualizar"
            aria-label="Actualizar listado"
          >
            <RefreshCw className={`h-5 w-5 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={onCreate}
            disabled={mutationDisabled}
            className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" aria-hidden />
            {createLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
