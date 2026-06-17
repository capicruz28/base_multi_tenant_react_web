/**
 * Sucursales — Listado y gestión. GET/POST /api/v1/org/sucursales
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { MapPin, Plus, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { IamTableEmptyState } from '@/features/admin/components/iam';
import { useDebouncedSearch } from '@/core/list';
import { OrgToolbarSearch } from '../components/OrgToolbarSearch';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import type { Sucursal, SucursalCreate, SucursalUpdate } from '../types/org.types';
import type { CatPais, CatDepartamento, CatProvincia, CatDistrito } from '@/types/catalogos.types';
import { OrgPageLayout } from '../components/OrgPageLayout';
import { FormSection } from '../components/FormSection';
import { getErrorMessage } from '@/core/services/error.service';
import { catalogosService } from '@/core/services';
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
import { usePermissions } from '@/core/auth/hooks/usePermissions';
import { useCentrosCosto } from '../hooks/centro-costo.hooks';
import { useOrgSessionScope, useOrgScopeEmpresaReset } from '../hooks/useOrgSessionScope';
import { OrgCompanyToolbar } from '../components/OrgCompanyToolbar';
import { OrgTableSkeleton } from '../components/OrgTableSkeleton';
import { OrgSessionEmpresaField } from '../components/OrgSessionEmpresaField';
import { assertBodyEmpresaMatchesSession } from '../utils/org-body-scope';
import {
  useCreateSucursal,
  useDeleteSucursal,
  useReactivarSucursal,
  useSucursales,
  useUpdateSucursal,
} from '../hooks/sucursal.hooks';
import { OrgDiscardConfirmDialog } from '../components/OrgDiscardConfirmDialog';
import type { OrgDiscardPending } from '../types/org-discard.types';
import { createOrgDiscardHandlers } from '../utils/org-discard-handlers';
import { orgDialogGuardProps } from '../utils/org-dialog-guard-props';
import {
  buildEditSucursalFormSnapshot,
  geoFromIds,
  isCreateSucursalDirty,
  isEditSucursalDirty,
  type EditSucursalFormSnapshot,
} from '../utils/form-dirty/sucursal-form-dirty';

const inputClass = 'mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm';

const SUCURSAL_DEFAULT: SucursalCreate = {
  empresa_id: '',
  codigo: '',
  nombre: '',
  descripcion: '',
  tipo_sucursal: 'sede',
  direccion: '',
  referencia: '',
  telefono: '',
  email: '',
  responsable_nombre: '',
  centro_costo_id: undefined,
  zona_horaria: '',
  horario_atencion: '',
  fecha_apertura: undefined,
  fecha_cierre: undefined,
  es_casa_matriz: false,
  es_punto_venta: false,
  es_almacen: false,
  es_planta_produccion: false,
  es_activo: true,
};

export default function SucursalesPage() {
  const { scopeEmpresaId, canQueryCompanyScoped } = useOrgSessionScope();
  const [includeInactive, setIncludeInactive] = useState(false);
  const search = useDebouncedSearch();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Sucursal | null>(null);
  const [form, setForm] = useState<SucursalCreate>(SUCURSAL_DEFAULT);
  const [editForm, setEditForm] = useState<SucursalUpdate>({});
  const [deleteTarget, setDeleteTarget] = useState<Sucursal | null>(null);
  const [reactivarTarget, setReactivarTarget] = useState<Sucursal | null>(null);
  const [paises, setPaises] = useState<CatPais[]>([]);
  const [departamentos, setDepartamentos] = useState<CatDepartamento[]>([]);
  const [provincias, setProvincias] = useState<CatProvincia[]>([]);
  const [distritos, setDistritos] = useState<CatDistrito[]>([]);
  const [selectedPaisId, setSelectedPaisId] = useState<string>('');
  const [selectedDepartamentoId, setSelectedDepartamentoId] = useState<string>('');
  const [selectedProvinciaId, setSelectedProvinciaId] = useState<string>('');
  const [selectedDistritoId, setSelectedDistritoId] = useState<string>('');
  const [editFormSnapshot, setEditFormSnapshot] = useState<EditSucursalFormSnapshot | null>(null);
  const [discardPending, setDiscardPending] = useState<OrgDiscardPending>(null);

  const { can } = usePermissions();
  const canCrear = can('org', 'crear');
  const canEditar = can('org', 'editar');
  const canEliminar = can('org', 'eliminar');

  const resetLocalFilters = useCallback(() => {
    search.clear();
    setIncludeInactive(false);
    setCreateOpen(false);
    setEditOpen(false);
    setEditing(null);
    setEditFormSnapshot(null);
    setDiscardPending(null);
    setSelectedPaisId('');
    setSelectedDepartamentoId('');
    setSelectedProvinciaId('');
    setSelectedDistritoId('');
    setDeleteTarget(null);
    setReactivarTarget(null);
  }, [search.clear]);
  useOrgScopeEmpresaReset(resetLocalFilters);

  const createGeo = useMemo(
    () => geoFromIds(selectedPaisId, selectedDepartamentoId, selectedProvinciaId, selectedDistritoId),
    [selectedPaisId, selectedDepartamentoId, selectedProvinciaId, selectedDistritoId],
  );

  const listQuery = useSucursales({
    solo_activos: !includeInactive,
    buscar: search.debouncedValue,
    enabled: canQueryCompanyScoped,
  });
  const list: Sucursal[] = listQuery.data ?? [];
  const loading = listQuery.isLoading;
  const error = listQuery.error ? getErrorMessage(listQuery.error).message : null;

  const centrosCostoQuery = useCentrosCosto({
    solo_activos: true,
    enabled: !!scopeEmpresaId,
  });
  const centrosCosto = centrosCostoQuery.data ?? [];

  const createSucursal = useCreateSucursal();
  const updateSucursal = useUpdateSucursal();
  const deleteSucursal = useDeleteSucursal();
  const reactivarSucursal = useReactivarSucursal();

  const submitting = createSucursal.isPending || updateSucursal.isPending;
  const deleting = deleteSucursal.isPending;
  const hasSearch = search.hasSearch;
  const TABLE_COLSPAN = 8;

  // Cargar catálogos geográficos una sola vez (igual que en EmpresaPage)
  useEffect(() => {
    catalogosService
      .listPaises({ solo_activos: true })
      .then(setPaises)
      .catch(() => setPaises([]));
    catalogosService
      .listDepartamentos({ solo_activos: true })
      .then(setDepartamentos)
      .catch(() => setDepartamentos([]));
    catalogosService
      .listProvincias({ solo_activos: true })
      .then(setProvincias)
      .catch(() => setProvincias([]));
    catalogosService
      .listDistritos({ solo_activos: true })
      .then(setDistritos)
      .catch(() => setDistritos([]));
  }, []);

  const isCreateDialogDirty = useMemo(
    () => isCreateSucursalDirty({ form, geo: createGeo }),
    [form, createGeo],
  );
  const isEditDialogDirty = useMemo(
    () => isEditSucursalDirty({ form: editForm, geo: createGeo }, editFormSnapshot),
    [editForm, createGeo, editFormSnapshot],
  );

  const closeCreate = useCallback(() => {
    if (!submitting) {
      setCreateOpen(false);
      setForm({ ...SUCURSAL_DEFAULT, empresa_id: scopeEmpresaId ?? '' });
      setSelectedPaisId('');
      setSelectedDepartamentoId('');
      setSelectedProvinciaId('');
      setSelectedDistritoId('');
      setDiscardPending((pending) => (pending === 'create' ? null : pending));
    }
  }, [scopeEmpresaId, submitting]);

  const closeEdit = useCallback(() => {
    if (!submitting) {
      setEditOpen(false);
      setEditing(null);
      setEditForm({});
      setEditFormSnapshot(null);
      setSelectedPaisId('');
      setSelectedDepartamentoId('');
      setSelectedProvinciaId('');
      setSelectedDistritoId('');
      setDiscardPending((pending) => (pending === 'edit' ? null : pending));
    }
  }, [submitting]);

  const {
    handleRequestCloseCreate,
    handleRequestCloseEdit,
    handleDiscardCancel,
    handleDiscardConfirm,
    handleCreateDialogOpenChange,
    handleEditDialogOpenChange,
  } = useMemo(
    () =>
      createOrgDiscardHandlers({
        discardPending,
        setDiscardPending,
        isSubmitting: submitting,
        isCreateDirty: isCreateDialogDirty,
        isEditDirty: isEditDialogDirty,
        setCreateOpen,
        setEditOpen,
        closeCreate,
        closeEdit,
        contextPrefix: 'org-sucursal',
      }),
    [discardPending, submitting, isCreateDialogDirty, isEditDialogDirty, closeCreate, closeEdit],
  );

  const openCreate = () => {
    setDiscardPending(null);
    const empId = scopeEmpresaId ?? '';
    setForm({ ...SUCURSAL_DEFAULT, empresa_id: empId });
    setSelectedPaisId('');
    setSelectedDepartamentoId('');
    setSelectedProvinciaId('');
    setSelectedDistritoId('');
    setCreateOpen(true);
  };
  const openEdit = (row: Sucursal) => {
    setDiscardPending(null);
    setEditing(row);
    const pid = row.pais_id ?? '';
    const did = row.departamento_id ?? '';
    const prid = row.provincia_id ?? '';
    const distid = row.distrito_id ?? '';
    const nextEditForm: SucursalUpdate = {
      codigo: row.codigo,
      nombre: row.nombre,
      descripcion: row.descripcion ?? undefined,
      tipo_sucursal: row.tipo_sucursal ?? undefined,
      direccion: row.direccion ?? undefined,
      referencia: row.referencia ?? undefined,
      pais_id: pid || undefined,
      departamento_id: did || undefined,
      provincia_id: prid || undefined,
      distrito_id: distid || undefined,
      codigo_postal: row.codigo_postal ?? undefined,
      ubigeo: row.ubigeo ?? undefined,
      telefono: row.telefono ?? undefined,
      email: row.email ?? undefined,
      responsable_nombre: row.responsable_nombre ?? undefined,
      centro_costo_id: row.centro_costo_id ?? undefined,
      zona_horaria: row.zona_horaria ?? undefined,
      horario_atencion: row.horario_atencion ?? undefined,
      fecha_apertura: row.fecha_apertura ?? undefined,
      fecha_cierre: row.fecha_cierre ?? undefined,
      es_casa_matriz: row.es_casa_matriz ?? false,
      es_punto_venta: row.es_punto_venta ?? false,
      es_almacen: row.es_almacen ?? false,
      es_planta_produccion: row.es_planta_produccion ?? false,
      es_activo: row.es_activo,
    };
    const geo = geoFromIds(pid, did, prid, distid);
    setEditForm(nextEditForm);
    setSelectedPaisId(pid);
    setSelectedDepartamentoId(did);
    setSelectedProvinciaId(prid);
    setSelectedDistritoId(distid);
    setEditFormSnapshot(buildEditSucursalFormSnapshot({ form: nextEditForm, geo }));
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scopeEmpresaId || !form.codigo.trim() || !form.nombre.trim()) {
      toast.error('Código y nombre son requeridos.');
      return;
    }
    try {
      const payload = assertBodyEmpresaMatchesSession(
        { ...form },
        scopeEmpresaId,
      );
      if (payload.fecha_apertura === '') delete payload.fecha_apertura;
      if (payload.fecha_cierre === '') delete payload.fecha_cierre;
      await createSucursal.mutateAsync(payload);
      closeCreate();
    } catch {
      /* toast de error: onError en useCreateSucursal */
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      const payload = { ...editForm };
      if (payload.fecha_apertura === '') delete payload.fecha_apertura;
      if (payload.fecha_cierre === '') delete payload.fecha_cierre;
      await updateSucursal.mutateAsync({
        sucursalId: editing.sucursal_id,
        payload,
      });
      closeEdit();
    } catch {
      /* toast de error: onError en useUpdateSucursal */
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSucursal.mutateAsync({ sucursalId: deleteTarget.sucursal_id });
      setDeleteTarget(null);
    } catch {
      /* toast de error: onError en useDeleteSucursal */
    }
  };

  const confirmarReactivar = async () => {
    if (!reactivarTarget) return;
    try {
      await reactivarSucursal.mutateAsync({ sucursalId: reactivarTarget.sucursal_id });
      setReactivarTarget(null);
    } catch {
      /* toast de error: onError en useReactivarSucursal */
    }
  };

  return (
    <OrgPageLayout>
      <OrgCompanyToolbar
        actions={
          canCrear ? (
            <Button
              onClick={openCreate}
              disabled={!scopeEmpresaId || discardPending !== null}
              className="bg-brand-primary hover:bg-brand-primary-hover text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear sucursal
            </Button>
          ) : null
        }
      >
        <OrgToolbarSearch
          value={search.inputValue}
          onChange={search.setInputValue}
          placeholder="Código, nombre, dirección..."
          aria-label="Buscar sucursales"
          disabled={discardPending !== null}
        />
        <label className="flex shrink-0 items-center gap-1.5 text-sm text-text-soft cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
            className="rounded border border-border-base"
          />
          Ver inactivos
        </label>
      </OrgCompanyToolbar>

      {loading && <OrgTableSkeleton columns={TABLE_COLSPAN} />}
      {error && !loading && (
        <p className="text-error bg-error/10 p-4 rounded-lg">{error}</p>
      )}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border border-border-base shadow">
          <table className="min-w-full divide-y divide-border-base">
            <thead className="bg-subtle">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Teléfono</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Responsable</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-text-soft uppercase">Casa matriz</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-text-soft uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-text-soft uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border-base">
              {list.length === 0 ? (
                <IamTableEmptyState
                  colSpan={TABLE_COLSPAN}
                  icon={MapPin}
                  title={
                    hasSearch
                      ? 'No se encontraron sucursales que coincidan con la búsqueda.'
                      : includeInactive
                        ? 'No hay sucursales registradas.'
                        : 'No hay sucursales activas.'
                  }
                  description={
                    hasSearch ? 'Pruebe con otro término o limpie el filtro de búsqueda.' : undefined
                  }
                  actionLabel={
                    !hasSearch && !includeInactive && canCrear && scopeEmpresaId ? 'Crear sucursal' : undefined
                  }
                  onAction={
                    !hasSearch && !includeInactive && canCrear && scopeEmpresaId ? openCreate : undefined
                  }
                  actionDisabled={discardPending !== null}
                />
              ) : (
                list.map((row) => (
                  <tr key={row.sucursal_id} className="hover:bg-overlay dark:hover:bg-overlay">
                    <td className="px-4 py-3 text-sm font-medium text-text-base">{row.codigo}</td>
                    <td className="px-4 py-3 text-sm text-text-base">{row.nombre}</td>
                    <td className="px-4 py-3 text-sm text-text-base">{row.tipo_sucursal ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-text-base">{row.telefono ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-text-base">{row.responsable_nombre ?? '-'}</td>
                    <td className="px-4 py-3 text-center">
                      {row.es_casa_matriz ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20 dark:text-brand-primary">Sí</span>
                      ) : (
                        <span className="text-xs text-text-soft">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.es_activo ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">Activa</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-error/10 text-error">Inactiva</span>
                      )}
                    </td>
                    <td className="px-4 py-3 flex items-center justify-center gap-1">
                      {row.es_activo ? (
                        <>
                          {canEditar && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(row)}
                              disabled={discardPending !== null}
                              className="text-brand-primary hover:text-brand-primary/80"
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canEliminar && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteTarget(row)}
                              disabled={discardPending !== null}
                              className="text-error hover:text-error hover:bg-error/10"
                              title="Desactivar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      ) : (
                        canEditar && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setReactivarTarget(row)}
                            disabled={reactivarSucursal.isPending || discardPending !== null}
                            className="text-success hover:text-success/80"
                            title="Reactivar"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <OrgDiscardConfirmDialog
        discardPending={discardPending}
        entityLabel="la sucursal"
        onClose={handleDiscardCancel}
        onConfirm={handleDiscardConfirm}
      />
      <ConfirmDialog
        isOpen={!!deleteTarget && discardPending === null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Desactivar sucursal"
        message={deleteTarget ? `¿Desactivar sucursal '${deleteTarget.nombre}'? Podrá reactivarla después.` : ''}
        confirmText="Desactivar"
        cancelText="Cancelar"
        variant="danger"
        loading={deleting}
      />
      <ConfirmDialog
        isOpen={!!reactivarTarget && discardPending === null}
        onClose={() => setReactivarTarget(null)}
        onConfirm={() => void confirmarReactivar()}
        title="Reactivar sucursal"
        message={reactivarTarget ? `¿Reactivar sucursal '${reactivarTarget.nombre}'? Volverá a estar disponible.` : ''}
        confirmText="Reactivar"
        cancelText="Cancelar"
        variant="info"
        loading={reactivarSucursal.isPending}
      />

      <Dialog open={createOpen} onOpenChange={handleCreateDialogOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col gap-0 p-0" {...orgDialogGuardProps}>
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0"><DialogTitle>Crear sucursal</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col min-h-0 flex-1">
            <DialogBody className="px-6 pb-2 space-y-5">
              <FormSection title="Información general">
                <div className="space-y-3">
                  <OrgSessionEmpresaField />
                  <div><Label>Código *</Label><input type="text" value={form.codigo} onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))} className={`${inputClass} uppercase`} required /></div>
                  <div><Label>Nombre *</Label><input type="text" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} className={inputClass} required /></div>
                  <div>
                    <Label>Tipo de sucursal</Label>
                    <select value={form.tipo_sucursal ?? 'sede'} onChange={(e) => setForm((p) => ({ ...p, tipo_sucursal: e.target.value }))} className={inputClass}>
                      <option value="sede">Sede</option>
                      <option value="punto_venta">Punto de venta</option>
                      <option value="almacen">Almacén</option>
                      <option value="virtual">Virtual</option>
                    </select>
                  </div>
                  <div><Label>Descripción</Label><input type="text" value={form.descripcion ?? ''} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value || undefined }))} className={inputClass} /></div>
                </div>
              </FormSection>
              <FormSection title="Ubicación / Dirección">
                <div className="space-y-3">
                  <div><Label>Dirección</Label><input type="text" value={form.direccion ?? ''} onChange={(e) => setForm((p) => ({ ...p, direccion: e.target.value || undefined }))} className={inputClass} /></div>
                  <div><Label>Referencia</Label><input type="text" value={form.referencia ?? ''} onChange={(e) => setForm((p) => ({ ...p, referencia: e.target.value || undefined }))} className={inputClass} /></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>País</Label>
                      <select
                        value={selectedPaisId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setSelectedPaisId(id);
                          setSelectedDepartamentoId('');
                          setSelectedProvinciaId('');
                          setSelectedDistritoId('');
                          setForm((p) => ({ ...p, pais_id: id || undefined, departamento_id: undefined, provincia_id: undefined, distrito_id: undefined }));
                        }}
                        className={inputClass}
                      >
                        <option value="">— Seleccionar —</option>
                        {paises.map((p) => (
                          <option key={p.pais_id} value={p.pais_id}>{p.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Departamento</Label>
                      <select
                        value={selectedDepartamentoId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setSelectedDepartamentoId(id);
                          setSelectedProvinciaId('');
                          setSelectedDistritoId('');
                          setForm((p) => ({ ...p, departamento_id: id || undefined, provincia_id: undefined, distrito_id: undefined }));
                        }}
                        className={inputClass}
                      >
                        <option value="">— Seleccionar —</option>
                        {departamentos.filter((d) => !selectedPaisId || d.pais_id === selectedPaisId).map((d) => (
                          <option key={d.departamento_id} value={d.departamento_id}>{d.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Provincia</Label>
                      <select
                        value={selectedProvinciaId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setSelectedProvinciaId(id);
                          setSelectedDistritoId('');
                          setForm((p) => ({ ...p, provincia_id: id || undefined, distrito_id: undefined }));
                        }}
                        className={inputClass}
                      >
                        <option value="">— Seleccionar —</option>
                        {provincias.filter((p) => !selectedDepartamentoId || p.departamento_id === selectedDepartamentoId).map((p) => (
                          <option key={p.provincia_id} value={p.provincia_id}>{p.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Distrito</Label>
                      <select
                        value={selectedDistritoId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setSelectedDistritoId(id);
                          setForm((p) => ({ ...p, distrito_id: id || undefined }));
                        }}
                        className={inputClass}
                      >
                        <option value="">— Seleccionar —</option>
                        {distritos.filter((d) => !selectedProvinciaId || d.provincia_id === selectedProvinciaId).map((d) => (
                          <option key={d.distrito_id} value={d.distrito_id}>{d.nombre} ({d.ubigeo})</option>
                        ))}
                      </select>
                    </div>
                    <div><Label>Código postal</Label><input type="text" value={form.codigo_postal ?? ''} onChange={(e) => setForm((p) => ({ ...p, codigo_postal: e.target.value || undefined }))} className={`${inputClass} uppercase`} /></div>
                    <div><Label>Ubigeo</Label><input type="text" value={form.ubigeo ?? ''} onChange={(e) => setForm((p) => ({ ...p, ubigeo: e.target.value || undefined }))} className={`${inputClass} uppercase`} placeholder="Ej. 150101" /></div>
                  </div>
                </div>
              </FormSection>
              <FormSection title="Contacto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><Label>Teléfono</Label><input type="text" value={form.telefono ?? ''} onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value || undefined }))} className={inputClass} /></div>
                  <div><Label>Email</Label><input type="email" value={form.email ?? ''} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value || undefined }))} className={`${inputClass} lowercase`} /></div>
                </div>
              </FormSection>
              <FormSection title="Configuración operativa">
                <div className="space-y-3">
                  <div>
                    <Label>Centro de costo</Label>
                    <select value={form.centro_costo_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, centro_costo_id: e.target.value || undefined }))} className={inputClass}>
                      <option value="">— Ninguno —</option>
                      {centrosCosto.map((cc) => (<option key={cc.centro_costo_id} value={cc.centro_costo_id}>{cc.codigo} — {cc.nombre}</option>))}
                    </select>
                  </div>
                  <div><Label>Zona horaria</Label><input type="text" value={form.zona_horaria ?? ''} onChange={(e) => setForm((p) => ({ ...p, zona_horaria: e.target.value || undefined }))} className={inputClass} placeholder="America/Lima" /></div>
                  <div><Label>Horario de atención</Label><input type="text" value={form.horario_atencion ?? ''} onChange={(e) => setForm((p) => ({ ...p, horario_atencion: e.target.value || undefined }))} className={inputClass} placeholder="Ej. Lun-Vie 8:00-18:00" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Fecha apertura</Label><input type="date" value={form.fecha_apertura ?? ''} onChange={(e) => setForm((p) => ({ ...p, fecha_apertura: e.target.value || undefined }))} className={inputClass} /></div>
                    <div><Label>Fecha cierre</Label><input type="date" value={form.fecha_cierre ?? ''} onChange={(e) => setForm((p) => ({ ...p, fecha_cierre: e.target.value || undefined }))} className={inputClass} /></div>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2"><input type="checkbox" checked={form.es_casa_matriz ?? false} onChange={(e) => setForm((p) => ({ ...p, es_casa_matriz: e.target.checked }))} className="rounded border border-border-base" /><Label>Casa matriz</Label></div>
                    <div className="flex items-center gap-2"><input type="checkbox" checked={form.es_punto_venta ?? false} onChange={(e) => setForm((p) => ({ ...p, es_punto_venta: e.target.checked }))} className="rounded border border-border-base" /><Label>Punto de venta</Label></div>
                    <div className="flex items-center gap-2"><input type="checkbox" checked={form.es_almacen ?? false} onChange={(e) => setForm((p) => ({ ...p, es_almacen: e.target.checked }))} className="rounded border border-border-base" /><Label>Almacén</Label></div>
                    <div className="flex items-center gap-2"><input type="checkbox" checked={form.es_planta_produccion ?? false} onChange={(e) => setForm((p) => ({ ...p, es_planta_produccion: e.target.checked }))} className="rounded border border-border-base" /><Label>Planta de producción</Label></div>
                  </div>
                </div>
              </FormSection>
              <FormSection title="Responsable">
                <div><Label>Nombre del responsable</Label><input type="text" value={form.responsable_nombre ?? ''} onChange={(e) => setForm((p) => ({ ...p, responsable_nombre: e.target.value || undefined }))} className={inputClass} /></div>
              </FormSection>
            </DialogBody>
            <DialogFooter className="px-6 py-4 flex-shrink-0 border-t border-border-base">
              <Button type="button" variant="outline" onClick={handleRequestCloseCreate}>Cancelar</Button>
              <Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={handleEditDialogOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col gap-0 p-0" {...orgDialogGuardProps}>
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0"><DialogTitle>Editar sucursal</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="flex flex-col min-h-0 flex-1">
            <DialogBody className="px-6 pb-2 space-y-5">
              <FormSection title="Información general">
                <div className="space-y-3">
                  <div><Label>Código *</Label><input type="text" value={editForm.codigo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, codigo: e.target.value }))} className={`${inputClass} uppercase`} required /></div>
                  <div><Label>Nombre *</Label><input type="text" value={editForm.nombre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))} className={inputClass} required /></div>
                  <div>
                    <Label>Tipo de sucursal</Label>
                    <select value={editForm.tipo_sucursal ?? 'sede'} onChange={(e) => setEditForm((p) => ({ ...p, tipo_sucursal: e.target.value }))} className={inputClass}>
                      <option value="sede">Sede</option>
                      <option value="punto_venta">Punto de venta</option>
                      <option value="almacen">Almacén</option>
                      <option value="virtual">Virtual</option>
                    </select>
                  </div>
                  <div><Label>Descripción</Label><input type="text" value={editForm.descripcion ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, descripcion: e.target.value || undefined }))} className={inputClass} /></div>
                </div>
              </FormSection>
              <FormSection title="Ubicación / Dirección">
                <div className="space-y-3">
                  <div><Label>Dirección</Label><input type="text" value={editForm.direccion ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, direccion: e.target.value || undefined }))} className={inputClass} /></div>
                  <div><Label>Referencia</Label><input type="text" value={editForm.referencia ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, referencia: e.target.value || undefined }))} className={inputClass} /></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>País</Label>
                      <select
                        value={selectedPaisId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setSelectedPaisId(id);
                          setSelectedDepartamentoId('');
                          setSelectedProvinciaId('');
                          setSelectedDistritoId('');
                          setEditForm((p) => ({ ...p, pais_id: id || undefined, departamento_id: undefined, provincia_id: undefined, distrito_id: undefined }));
                        }}
                        className={inputClass}
                      >
                        <option value="">— Seleccionar —</option>
                        {paises.map((p) => (
                          <option key={p.pais_id} value={p.pais_id}>{p.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Departamento</Label>
                      <select
                        value={selectedDepartamentoId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setSelectedDepartamentoId(id);
                          setSelectedProvinciaId('');
                          setSelectedDistritoId('');
                          setEditForm((p) => ({ ...p, departamento_id: id || undefined, provincia_id: undefined, distrito_id: undefined }));
                        }}
                        className={inputClass}
                      >
                        <option value="">— Seleccionar —</option>
                        {departamentos.filter((d) => !selectedPaisId || d.pais_id === selectedPaisId).map((d) => (
                          <option key={d.departamento_id} value={d.departamento_id}>{d.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Provincia</Label>
                      <select
                        value={selectedProvinciaId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setSelectedProvinciaId(id);
                          setSelectedDistritoId('');
                          setEditForm((p) => ({ ...p, provincia_id: id || undefined, distrito_id: undefined }));
                        }}
                        className={inputClass}
                      >
                        <option value="">— Seleccionar —</option>
                        {provincias.filter((p) => !selectedDepartamentoId || p.departamento_id === selectedDepartamentoId).map((p) => (
                          <option key={p.provincia_id} value={p.provincia_id}>{p.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Distrito</Label>
                      <select
                        value={selectedDistritoId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setSelectedDistritoId(id);
                          setEditForm((p) => ({ ...p, distrito_id: id || undefined }));
                        }}
                        className={inputClass}
                      >
                        <option value="">— Seleccionar —</option>
                        {distritos.filter((d) => !selectedProvinciaId || d.provincia_id === selectedProvinciaId).map((d) => (
                          <option key={d.distrito_id} value={d.distrito_id}>{d.nombre} ({d.ubigeo})</option>
                        ))}
                      </select>
                    </div>
                    <div><Label>Código postal</Label><input type="text" value={editForm.codigo_postal ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, codigo_postal: e.target.value || undefined }))} className={`${inputClass} uppercase`} /></div>
                    <div><Label>Ubigeo</Label><input type="text" value={editForm.ubigeo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, ubigeo: e.target.value || undefined }))} className={`${inputClass} uppercase`} /></div>
                  </div>
                </div>
              </FormSection>
              <FormSection title="Contacto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><Label>Teléfono</Label><input type="text" value={editForm.telefono ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, telefono: e.target.value || undefined }))} className={inputClass} /></div>
                  <div><Label>Email</Label><input type="email" value={editForm.email ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value || undefined }))} className={`${inputClass} lowercase`} /></div>
                </div>
              </FormSection>
              <FormSection title="Configuración operativa">
                <div className="space-y-3">
                  <div>
                    <Label>Centro de costo</Label>
                    <select value={editForm.centro_costo_id ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, centro_costo_id: e.target.value || undefined }))} className={inputClass}>
                      <option value="">— Ninguno —</option>
                      {centrosCosto.map((cc) => (<option key={cc.centro_costo_id} value={cc.centro_costo_id}>{cc.codigo} — {cc.nombre}</option>))}
                    </select>
                  </div>
                  <div><Label>Zona horaria</Label><input type="text" value={editForm.zona_horaria ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, zona_horaria: e.target.value || undefined }))} className={inputClass} /></div>
                  <div><Label>Horario de atención</Label><input type="text" value={editForm.horario_atencion ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, horario_atencion: e.target.value || undefined }))} className={inputClass} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Fecha apertura</Label><input type="date" value={editForm.fecha_apertura ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_apertura: e.target.value || undefined }))} className={inputClass} /></div>
                    <div><Label>Fecha cierre</Label><input type="date" value={editForm.fecha_cierre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_cierre: e.target.value || undefined }))} className={inputClass} /></div>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2"><input type="checkbox" checked={editForm.es_casa_matriz ?? false} onChange={(e) => setEditForm((p) => ({ ...p, es_casa_matriz: e.target.checked }))} className="rounded border border-border-base" /><Label>Casa matriz</Label></div>
                    <div className="flex items-center gap-2"><input type="checkbox" checked={editForm.es_punto_venta ?? false} onChange={(e) => setEditForm((p) => ({ ...p, es_punto_venta: e.target.checked }))} className="rounded border border-border-base" /><Label>Punto de venta</Label></div>
                    <div className="flex items-center gap-2"><input type="checkbox" checked={editForm.es_almacen ?? false} onChange={(e) => setEditForm((p) => ({ ...p, es_almacen: e.target.checked }))} className="rounded border border-border-base" /><Label>Almacén</Label></div>
                    <div className="flex items-center gap-2"><input type="checkbox" checked={editForm.es_planta_produccion ?? false} onChange={(e) => setEditForm((p) => ({ ...p, es_planta_produccion: e.target.checked }))} className="rounded border border-border-base" /><Label>Planta de producción</Label></div>
                  </div>
                </div>
              </FormSection>
              <FormSection title="Responsable">
                <div><Label>Nombre del responsable</Label><input type="text" value={editForm.responsable_nombre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, responsable_nombre: e.target.value || undefined }))} className={inputClass} /></div>
              </FormSection>
            </DialogBody>
            <DialogFooter className="px-6 py-4 flex-shrink-0 border-t border-border-base">
              <Button type="button" variant="outline" onClick={handleRequestCloseEdit}>Cancelar</Button>
              <Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </OrgPageLayout>
  );
}
