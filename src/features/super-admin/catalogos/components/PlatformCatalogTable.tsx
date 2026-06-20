import { Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { IamTableEmptyState } from '@/features/admin/components/iam';
import { InvTableSkeleton } from '@/features/inv/components/InvTableSkeleton';
import { Button } from '@/shared/components/ui/button';
import { getFkLabel } from '../utils/platform-catalog-fk-label-cache';
import type {
  PlatformCatalogColumnAccessor,
  PlatformCatalogColumnDef,
  PlatformCatalogCreateByEntityId,
  PlatformCatalogEntityConfig,
  PlatformCatalogEntityId,
  PlatformCatalogItemByEntityId,
} from '../types/platform-catalog.types';

export interface PlatformCatalogTableProps<
  E extends PlatformCatalogEntityId = PlatformCatalogEntityId,
> {
  config: PlatformCatalogEntityConfig<
    PlatformCatalogItemByEntityId[E],
    PlatformCatalogCreateByEntityId[E]
  >;
  items: PlatformCatalogItemByEntityId[E][];
  isLoading: boolean;
  hasSearch: boolean;
  onEdit: (item: PlatformCatalogItemByEntityId[E]) => void;
  onDeactivate: (item: PlatformCatalogItemByEntityId[E]) => void;
  onReactivate: (item: PlatformCatalogItemByEntityId[E]) => void;
  actionsDisabled?: boolean;
  onCreateClick?: () => void;
}

function getRowId<E extends PlatformCatalogEntityId>(
  entityId: E,
  item: PlatformCatalogItemByEntityId[E],
): string {
  switch (entityId) {
    case 'moneda':
      return (item as PlatformCatalogItemByEntityId['moneda']).moneda_id;
    case 'pais':
      return (item as PlatformCatalogItemByEntityId['pais']).pais_id;
    case 'departamento':
      return (item as PlatformCatalogItemByEntityId['departamento']).departamento_id;
    case 'provincia':
      return (item as PlatformCatalogItemByEntityId['provincia']).provincia_id;
    case 'distrito':
      return (item as PlatformCatalogItemByEntityId['distrito']).distrito_id;
    default: {
      const _exhaustive: never = entityId;
      return _exhaustive;
    }
  }
}

function resolveFkUuid(
  item: Record<string, unknown>,
  accessor: 'fk:pais' | 'fk:departamento' | 'fk:provincia',
): string | null | undefined {
  switch (accessor) {
    case 'fk:pais':
      return item.pais_id as string | null | undefined;
    case 'fk:departamento':
      return item.departamento_id as string | null | undefined;
    case 'fk:provincia':
      return item.provincia_id as string | null | undefined;
    default:
      return undefined;
  }
}

function formatCellValue<TItem>(
  item: TItem,
  column: PlatformCatalogColumnDef<TItem>,
): string {
  const accessor = column.accessor as PlatformCatalogColumnAccessor<TItem>;
  const record = item as Record<string, unknown>;

  if (accessor === 'fk:pais') {
    return getFkLabel('pais', resolveFkUuid(record, 'fk:pais'));
  }
  if (accessor === 'fk:departamento') {
    return getFkLabel('departamento', resolveFkUuid(record, 'fk:departamento'));
  }
  if (accessor === 'fk:provincia') {
    return getFkLabel('provincia', resolveFkUuid(record, 'fk:provincia'));
  }

  const raw = record[accessor];
  if (raw === null || raw === undefined || raw === '') {
    return '—';
  }
  return String(raw);
}

function capitalizeLabel(label: string): string {
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * FA-001 WP-05 — Tabla catálogo global (Scope Freeze §9.1).
 * Solo render; columnas desde registry; RB-ROW-01 en acciones.
 */
export function PlatformCatalogTable<E extends PlatformCatalogEntityId>({
  config,
  items,
  isLoading,
  hasSearch,
  onEdit,
  onDeactivate,
  onReactivate,
  actionsDisabled = false,
  onCreateClick,
}: PlatformCatalogTableProps<E>) {
  const tableColSpan = config.columns.length + 1;
  const EmptyIcon = config.emptyIcon;

  if (isLoading) {
    return <InvTableSkeleton columns={tableColSpan} />;
  }

  const emptyTitle = hasSearch
    ? `No se encontraron ${config.title.toLowerCase()} que coincidan con la búsqueda.`
    : `No hay ${config.title.toLowerCase()} registrados.`;

  const emptyDescription = hasSearch
    ? 'Pruebe con otro término o limpie el filtro de búsqueda.'
    : undefined;

  const createActionLabel =
    !hasSearch && onCreateClick
      ? `Nuevo ${capitalizeLabel(config.singularLabel)}`
      : undefined;

  return (
    <div className="overflow-x-auto rounded-lg border border-border-base shadow">
      <table className="min-w-full divide-y divide-border-base">
        <thead className="bg-subtle">
          <tr>
            {config.columns.map((column) => (
              <th
                key={column.id}
                className={`px-4 py-3 text-left text-xs font-medium text-text-soft uppercase ${
                  column.hideOnMobile ? 'hidden sm:table-cell' : ''
                }`}
              >
                {column.header}
              </th>
            ))}
            <th className="px-4 py-3 text-center text-xs font-medium text-text-soft uppercase">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-surface divide-y divide-border-base">
          {items.length === 0 ? (
            <IamTableEmptyState
              colSpan={tableColSpan}
              icon={EmptyIcon}
              title={emptyTitle}
              description={emptyDescription}
              actionLabel={createActionLabel}
              onAction={!hasSearch ? onCreateClick : undefined}
              actionDisabled={actionsDisabled}
            />
          ) : (
            items.map((item) => {
              const rowId = getRowId(config.id, item);
              const isActive = (item as { es_activo?: boolean | null }).es_activo === true;

              return (
                <tr
                  key={rowId}
                  className="hover:bg-overlay dark:hover:bg-overlay"
                >
                  {config.columns.map((column) => {
                    if (column.accessor === 'es_activo') {
                      return (
                        <td
                          key={column.id}
                          className={`px-4 py-3 text-center ${
                            column.hideOnMobile ? 'hidden sm:table-cell' : ''
                          }`}
                        >
                          {isActive ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
                              Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-error/10 text-error">
                              Inactivo
                            </span>
                          )}
                        </td>
                      );
                    }

                    return (
                      <td
                        key={column.id}
                        className={`px-4 py-3 text-sm text-text-base ${
                          column.id === 'codigo' || column.id === 'codigo_iso2'
                            ? 'font-medium'
                            : ''
                        } ${column.hideOnMobile ? 'hidden sm:table-cell' : ''}`}
                      >
                        {formatCellValue(item, column)}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {isActive ? (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(item)}
                            disabled={actionsDisabled}
                            className="text-brand-primary hover:text-brand-primary/80"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => onDeactivate(item)}
                            disabled={actionsDisabled}
                            className="text-error hover:text-error hover:bg-error/10"
                            title="Desactivar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => onReactivate(item)}
                          disabled={actionsDisabled}
                          className="text-success hover:text-success/80"
                          title="Reactivar"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
