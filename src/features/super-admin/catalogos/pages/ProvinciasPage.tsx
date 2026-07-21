/**
 * Provincias — Catálogo global (Super Admin). FA-001 WP-09.
 * FK: departamento_id → cat_departamento (toolbar, tabla getFkLabel; create PlatformCatalogFkSelect; edit solo lectura).
 */
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { MapPinned } from 'lucide-react';
import type {
  CatProvincia,
  CatProvinciaCreate,
  CatProvinciaUpdate,
} from '@/types/catalogos.types';
import { useAuth } from '@/shared/context/AuthContext';
import { getValidationErrors } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogBody,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { ErpPagination } from '@/shared/components/erp-list';
import { getPlatformCatalogEntityConfig } from '../config/platform-catalog.entities';
import { usePlatformGlobalCatalogList } from '../hooks/usePlatformGlobalCatalogList';
import { usePlatformCatalogMutations } from '../hooks/usePlatformCatalogMutations';
import { usePlatformCatalogFkWarmPrefetch } from '../hooks/usePlatformCatalogFkWarmPrefetch';
import {
  PlatformCatalogToolbar,
  type PlatformCatalogFkField,
} from '../components/PlatformCatalogToolbar';
import { PlatformCatalogTable } from '../components/PlatformCatalogTable';
import { PlatformCatalogFkSelect } from '../components/PlatformCatalogFkSelect';
import { getFkLabel } from '../utils/platform-catalog-fk-label-cache';
import { PlatformCatalogErrorState } from '../components/PlatformCatalogErrorState';
import { useStablePlatformCatalogListView } from '../utils/useStablePlatformCatalogListView';
import { CatalogSyncDialog } from '../components/CatalogSyncDialog';
import { CatalogSyncResultDialog } from '../components/CatalogSyncResultDialog';
import { usePlatformCatalogSyncFlow } from '../hooks/usePlatformCatalogSyncFlow';

const ENTITY_ID = 'provincia' as const;

const ProvinciasPage: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const config = getPlatformCatalogEntityConfig(ENTITY_ID);
  const syncFlow = usePlatformCatalogSyncFlow(ENTITY_ID);

  const {
    items,
    pagination,
    isLoading,
    isFetching,
    errorMessage,
    search,
    soloActivos,
    setSoloActivos,
    fkState,
    setPaisId,
    setDepartamentoId,
    setProvinciaId,
    setUbigeo,
    setPage,
    setLimit,
    refetch,
  } = usePlatformGlobalCatalogList(ENTITY_ID, { enabled: isSuperAdmin });

  usePlatformCatalogFkWarmPrefetch(ENTITY_ID, isSuperAdmin);

  const {
    create,
    update,
    deactivate,
    reactivate,
    createMutation,
    updateMutation,
    deactivateMutation,
    reactivateMutation,
    isAnyPending,
  } = usePlatformCatalogMutations(ENTITY_ID);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<CatProvincia | null>(null);
  const [form, setForm] = useState<CatProvinciaCreate>({ ...config.createDefault });
  const [editForm, setEditForm] = useState<CatProvinciaUpdate>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});
  const [deactivateTarget, setDeactivateTarget] = useState<CatProvincia | null>(null);
  const [reactivateTarget, setReactivateTarget] = useState<CatProvincia | null>(null);

  const openCreate = () => {
    setForm({
      ...config.createDefault,
      departamento_id: fkState.departamentoId ?? '',
    });
    setFieldErrors({});
    setCreateOpen(true);
  };

  const openEdit = (row: CatProvincia) => {
    setEditing(row);
    setEditFieldErrors({});
    setEditForm({
      departamento_id: row.departamento_id,
      codigo: row.codigo,
      nombre: row.nombre,
    });
    setEditOpen(true);
  };

  const handleFkChange = (field: PlatformCatalogFkField, value: string | null) => {
    if (field === 'paisId') {
      setPaisId(value);
    } else if (field === 'departamentoId') {
      setDepartamentoId(value);
    } else {
      setProvinciaId(value);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.departamento_id || !form.codigo.trim() || !form.nombre.trim()) {
      toast.error('Departamento, código y nombre son requeridos.');
      return;
    }
    setFieldErrors({});
    try {
      await create(form);
      setCreateOpen(false);
    } catch (err) {
      const { fieldErrors: nextErrors } = getValidationErrors(err);
      setFieldErrors(nextErrors);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) {
      return;
    }
    setEditFieldErrors({});
    try {
      await update({ id: editing.provincia_id, payload: editForm });
      setEditOpen(false);
      setEditing(null);
    } catch (err) {
      const { fieldErrors: nextErrors } = getValidationErrors(err);
      setEditFieldErrors(nextErrors);
    }
  };

  const confirmDeactivate = async () => {
    if (!deactivateTarget) {
      return;
    }
    try {
      await deactivate(deactivateTarget.provincia_id);
      setDeactivateTarget(null);
    } catch {
      /* toast en onError del hook */
    }
  };

  const confirmReactivate = async () => {
    if (!reactivateTarget) {
      return;
    }
    try {
      await reactivate(reactivateTarget.provincia_id);
      setReactivateTarget(null);
    } catch {
      /* toast en onError del hook */
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <MapPinned className="mx-auto h-12 w-12 text-text-soft" />
          <h3 className="mt-2 text-sm font-medium text-text-base">Acceso restringido</h3>
          <p className="mt-1 text-sm text-text-soft">No tienes permisos para acceder a este catálogo.</p>
        </div>
      </div>
    );
  }

  const inputClass = (key: string, isEdit = false) =>
    `mt-1 w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-brand-primary bg-surface dark:bg-subtle dark:text-text-base text-sm ${
      (isEdit ? editFieldErrors : fieldErrors)[key] ? 'border-error' : 'border-border-base'
    }`;

  const uiDisabled = isAnyPending;

  const { displayItems, displayPagination, showInitialSkeleton } =
    useStablePlatformCatalogListView(items, pagination, isLoading, isFetching);

  const listIsRefreshing = isFetching && displayItems.length > 0;

  return (
    <div className="w-full">
      <PlatformCatalogToolbar
        config={config}
        search={{
          inputValue: search.inputValue,
          setInputValue: search.setInputValue,
        }}
        soloActivos={soloActivos}
        onSoloActivosChange={setSoloActivos}
        fkState={fkState}
        onFkChange={handleFkChange}
        ubigeo={fkState.ubigeo}
        onUbigeoChange={setUbigeo}
        onRefresh={() => void refetch()}
        onSyncDedicated={syncFlow.openSyncDialog}
        onCreate={openCreate}
        isFetching={isFetching}
        disabled={uiDisabled}
        syncDisabled={syncFlow.isSyncing}
      />

      {errorMessage && !isLoading ? (
        <PlatformCatalogErrorState
          message={errorMessage}
          onRetry={() => void refetch()}
          disabled={isFetching}
        />
      ) : null}

      {!errorMessage ? (
        <div
          className={`space-y-0 transition-opacity duration-150 ${listIsRefreshing ? 'opacity-70' : 'opacity-100'}`}
          aria-busy={listIsRefreshing}
        >
          <PlatformCatalogTable
            config={config}
            items={displayItems}
            isLoading={showInitialSkeleton}
            hasSearch={search.hasSearch}
            onEdit={openEdit}
            onDeactivate={setDeactivateTarget}
            onReactivate={setReactivateTarget}
            actionsDisabled={uiDisabled}
            onCreateClick={openCreate}
          />
          {displayPagination ? (
            <ErpPagination
              pagination={displayPagination}
              onPageChange={setPage}
              onLimitChange={setLimit}
              limitOptions={config.limitOptions}
              disabled={isFetching || uiDisabled}
              className="-mt-px rounded-b-lg border border-border-base shadow-sm"
            />
          ) : null}
        </div>
      ) : null}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
            <DialogTitle>Crear provincia</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => void handleCreate(e)} className="flex flex-col min-h-0 flex-1">
            <DialogBody className="px-6 pb-2">
              <div className="space-y-4">
                <div>
                  <Label>Departamento *</Label>
                  <div className="mt-1 max-w-none [&>div]:max-w-none">
                    <PlatformCatalogFkSelect
                      entityId="departamento"
                      value={form.departamento_id || null}
                      onChange={(value) =>
                        setForm((p) => ({ ...p, departamento_id: value ?? '' }))
                      }
                      scope={{}}
                      placeholder="Seleccionar departamento"
                      disabled={createMutation.isPending}
                      allowClear={false}
                    />
                  </div>
                </div>
                <div>
                  <Label>Código *</Label>
                  <input
                    type="text"
                    value={form.codigo}
                    onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))}
                    className={inputClass('codigo')}
                    required
                  />
                </div>
                <div>
                  <Label>Nombre *</Label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                    className={inputClass('nombre')}
                    required
                  />
                </div>
              </div>
            </DialogBody>
            <DialogFooter className="px-6 py-4 flex-shrink-0 border-t border-border-base">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="bg-brand-primary hover:bg-brand-primary-hover text-white"
              >
                Crear
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
          }
          setEditOpen(open);
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
            <DialogTitle>Editar provincia</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => void handleUpdate(e)} className="flex flex-col min-h-0 flex-1">
            <DialogBody className="px-6 pb-2">
              <div className="space-y-4">
                <div>
                  <Label>Departamento</Label>
                  <p className="mt-1 px-3 py-2 rounded-md border border-border-base bg-subtle text-text-base text-sm">
                    {getFkLabel('departamento', editForm.departamento_id)}
                  </p>
                </div>
                <div>
                  <Label>Código *</Label>
                  <input
                    type="text"
                    value={editForm.codigo ?? ''}
                    onChange={(e) => setEditForm((p) => ({ ...p, codigo: e.target.value }))}
                    className={inputClass('codigo', true)}
                    required
                  />
                </div>
                <div>
                  <Label>Nombre *</Label>
                  <input
                    type="text"
                    value={editForm.nombre ?? ''}
                    onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))}
                    className={inputClass('nombre', true)}
                    required
                  />
                </div>
              </div>
            </DialogBody>
            <DialogFooter className="px-6 py-4 flex-shrink-0 border-t border-border-base">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="bg-brand-primary hover:bg-brand-primary-hover text-white"
              >
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={() => void confirmDeactivate()}
        title="Desactivar provincia"
        message={
          deactivateTarget
            ? `¿Desactivar la provincia "${deactivateTarget.nombre}"?`
            : ''
        }
        confirmText="Desactivar"
        cancelText="Cancelar"
        variant="danger"
        loading={deactivateMutation.isPending}
      />

      <ConfirmDialog
        isOpen={!!reactivateTarget}
        onClose={() => setReactivateTarget(null)}
        onConfirm={() => void confirmReactivate()}
        title="Reactivar provincia"
        message={
          reactivateTarget
            ? `¿Reactivar la provincia "${reactivateTarget.nombre}"?`
            : ''
        }
        confirmText="Reactivar"
        cancelText="Cancelar"
        variant="info"
        loading={reactivateMutation.isPending}
      />

      <CatalogSyncDialog {...syncFlow.syncDialogProps} />
      <CatalogSyncResultDialog {...syncFlow.resultDialogProps} />
    </div>
  );
};

export default ProvinciasPage;
