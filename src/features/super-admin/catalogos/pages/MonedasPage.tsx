/**
 * Monedas — Catálogo global (Super Admin). Piloto FA-001 WP-06 / WP-06.1.
 */
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { DollarSign } from 'lucide-react';
import type { CatMoneda, CatMonedaCreate, CatMonedaUpdate } from '@/types/catalogos.types';
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
import {
  PlatformCatalogToolbar,
  type PlatformCatalogFkField,
} from '../components/PlatformCatalogToolbar';
import { PlatformCatalogTable } from '../components/PlatformCatalogTable';
import { PlatformCatalogErrorState } from '../components/PlatformCatalogErrorState';
import { useStablePlatformCatalogListView } from '../utils/useStablePlatformCatalogListView';

const ENTITY_ID = 'moneda' as const;

const MonedasPage: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const config = getPlatformCatalogEntityConfig(ENTITY_ID);

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
  const [editing, setEditing] = useState<CatMoneda | null>(null);
  const [form, setForm] = useState<CatMonedaCreate>({ ...config.createDefault });
  const [editForm, setEditForm] = useState<CatMonedaUpdate>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});
  const [deactivateTarget, setDeactivateTarget] = useState<CatMoneda | null>(null);
  const [reactivateTarget, setReactivateTarget] = useState<CatMoneda | null>(null);

  const openCreate = () => {
    setForm({ ...config.createDefault });
    setFieldErrors({});
    setCreateOpen(true);
  };

  const openEdit = (row: CatMoneda) => {
    setEditing(row);
    setEditFieldErrors({});
    setEditForm({
      nombre: row.nombre,
      simbolo: row.simbolo,
      decimales: row.decimales ?? undefined,
      es_activo: row.es_activo ?? undefined,
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
    if (!form.codigo.trim() || !form.nombre.trim() || !form.simbolo.trim()) {
      toast.error('Código, nombre y símbolo son requeridos.');
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
      await update({ id: editing.moneda_id, payload: editForm });
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
      await deactivate(deactivateTarget.moneda_id);
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
      await reactivate(reactivateTarget.moneda_id);
      setReactivateTarget(null);
    } catch {
      /* toast en onError del hook */
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <DollarSign className="mx-auto h-12 w-12 text-text-soft" />
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
        onCreate={openCreate}
        isFetching={isFetching}
        disabled={uiDisabled}
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
            <DialogTitle>Crear moneda</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => void handleCreate(e)} className="flex flex-col min-h-0 flex-1">
            <DialogBody className="px-6 pb-2">
              <div className="space-y-4">
                <div>
                  <Label>Código *</Label>
                  <input
                    type="text"
                    value={form.codigo}
                    onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))}
                    className={inputClass('codigo')}
                    required
                    maxLength={3}
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
                <div>
                  <Label>Símbolo *</Label>
                  <input
                    type="text"
                    value={form.simbolo}
                    onChange={(e) => setForm((p) => ({ ...p, simbolo: e.target.value }))}
                    className={inputClass('simbolo')}
                    required
                    maxLength={5}
                  />
                </div>
                <div>
                  <Label>Decimales</Label>
                  <input
                    type="number"
                    min={0}
                    max={6}
                    value={form.decimales ?? 2}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, decimales: parseInt(e.target.value, 10) || 0 }))
                    }
                    className={inputClass('decimales')}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.es_activo ?? true}
                    onChange={(e) => setForm((p) => ({ ...p, es_activo: e.target.checked }))}
                  />
                  <Label>Activo</Label>
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
            <DialogTitle>Editar moneda</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => void handleUpdate(e)} className="flex flex-col min-h-0 flex-1">
            <DialogBody className="px-6 pb-2">
              <div className="space-y-4">
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
                <div>
                  <Label>Símbolo *</Label>
                  <input
                    type="text"
                    value={editForm.simbolo ?? ''}
                    onChange={(e) => setEditForm((p) => ({ ...p, simbolo: e.target.value }))}
                    className={inputClass('simbolo', true)}
                    required
                    maxLength={5}
                  />
                </div>
                <div>
                  <Label>Decimales</Label>
                  <input
                    type="number"
                    min={0}
                    max={6}
                    value={editForm.decimales ?? ''}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        decimales: e.target.value === '' ? undefined : parseInt(e.target.value, 10),
                      }))
                    }
                    className={inputClass('decimales', true)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editForm.es_activo ?? true}
                    onChange={(e) => setEditForm((p) => ({ ...p, es_activo: e.target.checked }))}
                  />
                  <Label>Activo</Label>
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
        title="Desactivar moneda"
        message={
          deactivateTarget
            ? `¿Desactivar la moneda "${deactivateTarget.nombre}"?`
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
        title="Reactivar moneda"
        message={
          reactivateTarget
            ? `¿Reactivar la moneda "${reactivateTarget.nombre}"?`
            : ''
        }
        confirmText="Reactivar"
        cancelText="Cancelar"
        variant="info"
        loading={reactivateMutation.isPending}
      />
    </div>
  );
};

export default MonedasPage;
