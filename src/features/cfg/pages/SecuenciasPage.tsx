/**
 * CFG — Secuencias de código (listado + edit/lifecycle + preview).
 * Wave 5: Preview Dialog + hardening (supports_preview / NOT_ALLOWED).
 */

import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { Navigate } from 'react-router-dom';
import { Ban, Eye, Hash, Pencil, RotateCcw, ScanLine } from 'lucide-react';
import { usePermission } from '@/core/auth/PermissionContext';
import { useDebouncedSearch } from '@/core/list';
import { getErrorMessage } from '@/core/services/error.service';
import { CFG_PERMISSIONS } from '@/features/cfg/constants/cfg-permissions';
import { SECUENCIAS_LIST_CONFIG } from '@/features/cfg/constants/cfg-list.constants';
import { CFG_SCOPE_LABELS } from '@/features/cfg/constants/cfg-scope-labels';
import { CfgSecuenciaEditDialog } from '@/features/cfg/components/CfgSecuenciaEditDialog';
import { CfgSecuenciaPreviewDialog } from '@/features/cfg/components/CfgSecuenciaPreviewDialog';
import { CfgSecuenciaStatusBadges } from '@/features/cfg/components/CfgSecuenciaStatusBadges';
import { useCfgSecuenciasErpList } from '@/features/cfg/hooks/useCfgSecuenciasErpList';
import { useDesactivarCfgSecuencia } from '@/features/cfg/hooks/useDesactivarCfgSecuencia';
import { useReactivarCfgSecuencia } from '@/features/cfg/hooks/useReactivarCfgSecuencia';
import type { CfgDiscardPending } from '@/features/cfg/types/cfg-discard.types';
import type { CfgEsActivoFilterUi } from '@/features/cfg/types/cfg-list.types';
import type { CfgScopeType, CfgSecuencia } from '@/features/cfg/types/cfg.types';
import {
  formatCfgModulo,
  formatCfgScopeType,
} from '@/features/cfg/utils/cfg-display.utils';
import { OrgDiscardConfirmDialog } from '@/features/org/components/OrgDiscardConfirmDialog';
import { OrgPageLayout } from '@/features/org/components/OrgPageLayout';
import { OrgToolbarSearch } from '@/features/org/components/OrgToolbarSearch';
import type { OrgDiscardPending } from '@/features/org/types/org-discard.types';
import { createOrgDiscardHandlers } from '@/features/org/utils/org-discard-handlers';
import {
  ErpListTableShell,
  ErpListToolbar,
  ErpPagination,
  ErpSortableHeader,
} from '@/shared/components/erp-list';
import { Button } from '@/shared/components/ui/button';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';

const TABLE_COLSPAN = 7;

const selectClass =
  'px-3 py-2 border border-border-base rounded-md bg-surface text-text-base text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary';

const MODULO_FILTER_OPTIONS = ['ORG', 'INV'] as const;

function mapEsActivoFilter(
  filter: CfgEsActivoFilterUi,
): boolean | undefined {
  if (filter === 'activas') return true;
  if (filter === 'inactivas') return false;
  return undefined;
}

export default function SecuenciasPage() {
  const { hasPermission, permissionsInitialized } = usePermission();
  const search = useDebouncedSearch();

  const canConsultar = hasPermission(CFG_PERMISSIONS.SECUENCIAS_CONSULTAR);
  const canUpdate = hasPermission(CFG_PERMISSIONS.SECUENCIAS_ACTUALIZAR);

  const [moduloCodigo, setModuloCodigo] = useState('');
  const [esActivoFilter, setEsActivoFilter] =
    useState<CfgEsActivoFilterUi>('activas');
  const [scopeType, setScopeType] = useState<'' | CfgScopeType>('');

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDirty, setEditDirty] = useState(false);
  const [discardPending, setDiscardPending] = useState<CfgDiscardPending>(null);
  const [desactivarId, setDesactivarId] = useState<string | null>(null);
  const [reactivarId, setReactivarId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewInactiveHint, setPreviewInactiveHint] = useState(false);
  const [previewDisabledIds, setPreviewDisabledIds] = useState<Set<string>>(
    () => new Set(),
  );

  const esActivo = mapEsActivoFilter(esActivoFilter);

  const list = useCfgSecuenciasErpList({
    modulo_codigo: moduloCodigo || undefined,
    es_activo: esActivo,
    scope_type: scopeType || undefined,
    debouncedBuscar: search.debouncedValue || undefined,
    enabled: permissionsInitialized && canConsultar,
  });

  const desactivarMutation = useDesactivarCfgSecuencia();
  const reactivarMutation = useReactivarCfgSecuencia();

  const toolbarDisabled = discardPending !== null;

  const hasNonDefaultFilters =
    search.hasSearch ||
    moduloCodigo !== '' ||
    esActivoFilter !== 'activas' ||
    scopeType !== '';

  const clearFilters = useCallback(() => {
    search.clear();
    setModuloCodigo('');
    setEsActivoFilter('activas');
    setScopeType('');
    list.setPage(1);
  }, [search, list.setPage]);

  const closeEdit = useCallback(() => {
    setEditOpen(false);
    setEditId(null);
    setEditDirty(false);
    setDiscardPending((pending) => (pending === 'edit' ? null : pending));
  }, []);

  const {
    handleRequestCloseEdit,
    handleDiscardCancel,
    handleDiscardConfirm,
    handleEditDialogOpenChange,
  } = useMemo(
    () =>
      createOrgDiscardHandlers({
        discardPending: discardPending as OrgDiscardPending,
        setDiscardPending: setDiscardPending as Dispatch<
          SetStateAction<OrgDiscardPending>
        >,
        isSubmitting: false,
        isCreateDirty: false,
        isEditDirty: editDirty,
        setCreateOpen: () => undefined,
        setEditOpen,
        closeCreate: () => undefined,
        closeEdit,
        contextPrefix: 'cfg-secuencia',
      }),
    [discardPending, editDirty, closeEdit],
  );

  const openEdit = useCallback((row: CfgSecuencia) => {
    setDiscardPending(null);
    setDesactivarId(null);
    setReactivarId(null);
    setEditId(row.secuencia_id);
    setEditOpen(true);
  }, []);

  const openPreview = useCallback((row: CfgSecuencia) => {
    setDesactivarId(null);
    setReactivarId(null);
    setPreviewId(row.secuencia_id);
    setPreviewInactiveHint(!row.es_activo);
    setPreviewOpen(true);
  }, []);

  const requestPreviewFromEdit = useCallback(
    (id: string) => {
      const row = list.items.find((item) => item.secuencia_id === id);
      setPreviewId(id);
      setPreviewInactiveHint(row ? !row.es_activo : false);
      setPreviewOpen(true);
    },
    [list.items],
  );

  const handlePreviewNotAllowed = useCallback((id: string) => {
    setPreviewDisabledIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const canShowPreviewFor = useCallback(
    (row: CfgSecuencia) =>
      row.supports_preview !== false && !previewDisabledIds.has(row.secuencia_id),
    [previewDisabledIds],
  );

  const requestDesactivar = useCallback((id: string) => {
    setPreviewOpen(false);
    setPreviewId(null);
    setEditOpen(false);
    setEditId(null);
    setEditDirty(false);
    setDesactivarId(id);
  }, []);

  const requestReactivar = useCallback((id: string) => {
    setPreviewOpen(false);
    setPreviewId(null);
    setEditOpen(false);
    setEditId(null);
    setEditDirty(false);
    setReactivarId(id);
  }, []);

  const handleDesactivarConfirm = async () => {
    if (!desactivarId) return;
    try {
      await desactivarMutation.mutateAsync(desactivarId);
      setDesactivarId(null);
    } catch {
      /* toast en onError del hook */
    }
  };

  const handleReactivarConfirm = async () => {
    if (!reactivarId) return;
    try {
      await reactivarMutation.mutateAsync(reactivarId);
      setReactivarId(null);
    } catch {
      /* toast en onError del hook */
    }
  };

  const emptyTitle = useMemo(
    () =>
      hasNonDefaultFilters
        ? 'Sin resultados para la búsqueda'
        : 'No hay secuencias',
    [hasNonDefaultFilters],
  );

  const emptyDescription = useMemo(
    () =>
      hasNonDefaultFilters
        ? 'Prueba otros filtros o limpia la búsqueda.'
        : 'Aún no hay secuencias de código en este tenant.',
    [hasNonDefaultFilters],
  );

  if (!permissionsInitialized) {
    return (
      <OrgPageLayout>
        <p className="text-sm text-text-soft">Verificando permisos…</p>
      </OrgPageLayout>
    );
  }

  if (!canConsultar) {
    return (
      <Navigate
        to="/unauthorized"
        replace
        state={{ requiredPermission: CFG_PERMISSIONS.SECUENCIAS_CONSULTAR }}
      />
    );
  }

  const listError = list.isError
    ? getErrorMessage(list.error).message
    : null;

  const confirmOpen =
    discardPending === null && !editOpen && !previewOpen;

  return (
    <OrgPageLayout>
      <ErpListToolbar
        hasActiveFilters={hasNonDefaultFilters}
        onClearFilters={toolbarDisabled ? undefined : clearFilters}
      >
        <OrgToolbarSearch
          value={search.inputValue}
          onChange={search.setInputValue}
          placeholder="Clave o prefijo…"
          aria-label="Buscar secuencias de código"
          disabled={toolbarDisabled}
        />
        <label className="flex items-center gap-1.5 text-sm text-text-soft">
          <span className="sr-only">Módulo</span>
          <select
            value={moduloCodigo}
            onChange={(e) => setModuloCodigo(e.target.value)}
            className={selectClass}
            aria-label="Filtrar por módulo"
            disabled={toolbarDisabled}
          >
            <option value="">Todos los módulos</option>
            {MODULO_FILTER_OPTIONS.map((mod) => (
              <option key={mod} value={mod}>
                {mod}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-sm text-text-soft">
          <span className="sr-only">Estado</span>
          <select
            value={esActivoFilter}
            onChange={(e) =>
              setEsActivoFilter(e.target.value as CfgEsActivoFilterUi)
            }
            className={selectClass}
            aria-label="Filtrar por estado"
            disabled={toolbarDisabled}
          >
            <option value="activas">Activas</option>
            <option value="inactivas">Inactivas</option>
            <option value="todas">Todas</option>
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-sm text-text-soft">
          <span className="sr-only">Ámbito</span>
          <select
            value={scopeType}
            onChange={(e) =>
              setScopeType(e.target.value as '' | CfgScopeType)
            }
            className={selectClass}
            aria-label="Filtrar por ámbito"
            disabled={toolbarDisabled}
          >
            <option value="">Todos los ámbitos</option>
            {(Object.keys(CFG_SCOPE_LABELS) as CfgScopeType[]).map((key) => (
              <option key={key} value={key}>
                {CFG_SCOPE_LABELS[key]}
              </option>
            ))}
          </select>
        </label>
      </ErpListToolbar>

      {listError && !list.isLoading ? (
        <div
          className="rounded-lg border border-border-base bg-surface p-4"
          role="alert"
        >
          <p className="text-sm text-error">{listError}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => void list.refetch()}
          >
            Reintentar
          </Button>
        </div>
      ) : (
        <ErpListTableShell
          colSpan={TABLE_COLSPAN}
          loading={list.isLoading}
          error={null}
          isEmpty={!list.isLoading && list.items.length === 0}
          hasSearch={hasNonDefaultFilters}
          emptyIcon={Hash}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
        >
          <div className="overflow-x-auto rounded-lg border border-border-base shadow-sm">
            <table className="min-w-full divide-y divide-border-base">
              <thead className="bg-subtle">
                <tr>
                  <ErpSortableHeader
                    column="sequence_key"
                    label="Clave"
                    sortableColumns={SECUENCIAS_LIST_CONFIG.sortableColumns}
                    sort={list.sort}
                    onSort={list.toggleSort}
                  />
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase tracking-wider"
                  >
                    Módulo
                  </th>
                  <ErpSortableHeader
                    column="scope_type"
                    label="Ámbito"
                    sortableColumns={SECUENCIAS_LIST_CONFIG.sortableColumns}
                    sort={list.sort}
                    onSort={list.toggleSort}
                  />
                  <ErpSortableHeader
                    column="prefijo"
                    label="Prefijo"
                    sortableColumns={SECUENCIAS_LIST_CONFIG.sortableColumns}
                    sort={list.sort}
                    onSort={list.toggleSort}
                  />
                  <ErpSortableHeader
                    column="ultimo_numero"
                    label="Último N.º"
                    sortableColumns={SECUENCIAS_LIST_CONFIG.sortableColumns}
                    sort={list.sort}
                    onSort={list.toggleSort}
                  />
                  <ErpSortableHeader
                    column="es_activo"
                    label="Estado"
                    sortableColumns={SECUENCIAS_LIST_CONFIG.sortableColumns}
                    sort={list.sort}
                    onSort={list.toggleSort}
                  />
                  <th
                    scope="col"
                    className="px-4 py-3 text-center text-xs font-medium text-text-soft uppercase tracking-wider"
                  >
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-border-base">
                {list.items.map((row) => (
                  <tr key={row.secuencia_id} className="hover:bg-overlay">
                    <td className="px-4 py-3 text-sm font-mono text-text-base">
                      {row.sequence_key}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-base">
                      {formatCfgModulo(row.modulo_codigo)}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-base">
                      {formatCfgScopeType(row.scope_type)}
                    </td>
                    <td className="px-4 py-3 text-sm uppercase text-text-base">
                      {row.prefijo || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm tabular-nums text-text-base">
                      {row.ultimo_numero}
                    </td>
                    <td className="px-4 py-3">
                      <CfgSecuenciaStatusBadges
                        es_activo={row.es_activo}
                        config_locked={row.config_locked}
                        policy_drift={row.policy_drift}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {row.es_activo ? (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={toolbarDisabled}
                              aria-label={
                                canUpdate ? 'Editar secuencia' : 'Ver secuencia'
                              }
                              className="text-brand-primary hover:text-brand-primary/80"
                              onClick={() => openEdit(row)}
                            >
                              {canUpdate ? (
                                <Pencil className="h-4 w-4" aria-hidden />
                              ) : (
                                <Eye className="h-4 w-4" aria-hidden />
                              )}
                            </Button>
                            {canShowPreviewFor(row) ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                disabled={toolbarDisabled}
                                aria-label="Preview código estimado"
                                className="text-text-soft hover:text-text-base"
                                onClick={() => openPreview(row)}
                              >
                                <ScanLine className="h-4 w-4" aria-hidden />
                              </Button>
                            ) : null}
                            {canUpdate && !row.config_locked ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                disabled={toolbarDisabled}
                                aria-label="Desactivar secuencia"
                                className="text-error hover:bg-error/10"
                                onClick={() => {
                                  setPreviewOpen(false);
                                  setEditOpen(false);
                                  setEditId(null);
                                  setDesactivarId(row.secuencia_id);
                                }}
                              >
                                <Ban className="h-4 w-4" aria-hidden />
                              </Button>
                            ) : null}
                          </>
                        ) : (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={toolbarDisabled}
                              aria-label="Ver secuencia"
                              className="text-brand-primary hover:text-brand-primary/80"
                              onClick={() => openEdit(row)}
                            >
                              <Eye className="h-4 w-4" aria-hidden />
                            </Button>
                            {canShowPreviewFor(row) ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                disabled={toolbarDisabled}
                                aria-label="Preview código estimado"
                                className="text-text-soft hover:text-text-base"
                                onClick={() => openPreview(row)}
                              >
                                <ScanLine className="h-4 w-4" aria-hidden />
                              </Button>
                            ) : null}
                            {canUpdate && !row.config_locked ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                disabled={toolbarDisabled}
                                aria-label="Reactivar secuencia"
                                className="text-success hover:bg-success/10"
                                onClick={() => {
                                  setPreviewOpen(false);
                                  setEditOpen(false);
                                  setEditId(null);
                                  setReactivarId(row.secuencia_id);
                                }}
                              >
                                <RotateCcw className="h-4 w-4" aria-hidden />
                              </Button>
                            ) : null}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {list.pagination ? (
              <ErpPagination
                pagination={list.pagination}
                onPageChange={list.setPage}
                onLimitChange={list.setLimit}
                disabled={toolbarDisabled || list.isFetching}
              />
            ) : null}
          </div>
        </ErpListTableShell>
      )}

      <CfgSecuenciaEditDialog
        open={editOpen}
        secuenciaId={editId}
        onOpenChange={handleEditDialogOpenChange}
        onSaveSuccess={closeEdit}
        canUpdate={canUpdate}
        onRequestDesactivar={requestDesactivar}
        onRequestReactivar={requestReactivar}
        onRequestPreview={requestPreviewFromEdit}
        onDirtyChange={setEditDirty}
        previewDisabled={
          editId ? previewDisabledIds.has(editId) : false
        }
      />

      <CfgSecuenciaPreviewDialog
        open={previewOpen}
        secuenciaId={previewId}
        onOpenChange={(next) => {
          setPreviewOpen(next);
          if (!next) {
            setPreviewId(null);
            setPreviewInactiveHint(false);
          }
        }}
        secuenciaInactivaHint={previewInactiveHint}
        onPreviewNotAllowed={handlePreviewNotAllowed}
      />

      <OrgDiscardConfirmDialog
        discardPending={discardPending as OrgDiscardPending}
        entityLabel="la secuencia"
        onClose={handleDiscardCancel}
        onConfirm={handleDiscardConfirm}
      />

      <ConfirmDialog
        isOpen={!!desactivarId && confirmOpen}
        onClose={() => setDesactivarId(null)}
        onConfirm={() => void handleDesactivarConfirm()}
        title="Desactivar secuencia"
        message="¿Desactivar esta secuencia? No se eliminará; podrá reactivarla después."
        confirmText="Desactivar"
        cancelText="Cancelar"
        variant="danger"
        loading={desactivarMutation.isPending}
      />

      <ConfirmDialog
        isOpen={!!reactivarId && confirmOpen}
        onClose={() => setReactivarId(null)}
        onConfirm={() => void handleReactivarConfirm()}
        title="Reactivar secuencia"
        message="¿Reactivar esta secuencia?"
        confirmText="Reactivar"
        cancelText="Cancelar"
        variant="info"
        loading={reactivarMutation.isPending}
      />
    </OrgPageLayout>
  );
}
