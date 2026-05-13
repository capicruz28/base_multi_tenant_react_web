/**
 * Centros de costo — Listado y gestión. GET/POST /api/v1/org/centros-costo
 */
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, DollarSign, Plus, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import type { Empresa, CentroCosto, CentroCostoCreate, CentroCostoUpdate } from '../types/org.types';
import { OrgPageLayout } from '../components/OrgPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogBody, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { FormSection } from '../components/FormSection';
import { usePermissions } from '@/core/auth/hooks/usePermissions';
import { useEmpresas } from '../hooks/empresa.hooks';
import {
  useCentrosCosto,
  useCreateCentroCosto,
  useDeleteCentroCosto,
  useReactivarCentroCosto,
  useUpdateCentroCosto,
} from '../hooks/centro-costo.hooks';

const inputClass = 'mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm';
const DEFAULT: CentroCostoCreate = {
  empresa_id: '',
  codigo: '',
  nombre: '',
  tipo_centro_costo: 'operativo',
  descripcion: '',
  centro_costo_padre_id: undefined,
  nivel: undefined,
  categoria: '',
  tiene_presupuesto: false,
  permite_imputacion_directa: true,
  responsable_nombre: '',
  fecha_inicio_vigencia: undefined,
  fecha_fin_vigencia: undefined,
  es_activo: true,
};

export default function CentrosCostoPage() {
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [buscar, setBuscar] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<CentroCosto | null>(null);
  const [form, setForm] = useState<CentroCostoCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<CentroCostoUpdate>({});
  const [deleteTarget, setDeleteTarget] = useState<CentroCosto | null>(null);

  const { can } = usePermissions();
  const canCrear = can('org', 'crear');
  const canEditar = can('org', 'editar');
  const canEliminar = can('org', 'eliminar');

  const empresasQuery = useEmpresas({ solo_activos: true });
  const empresas: Empresa[] = empresasQuery.data ?? [];
  useEffect(() => {
    if (empresas.length === 1 && !empresaFilter) setEmpresaFilter(empresas[0].empresa_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresas.length]);

  const listQuery = useCentrosCosto({
    empresa_id: empresaFilter || undefined,
    solo_activos: !includeInactive,
    buscar,
  });
  const list: CentroCosto[] = listQuery.data ?? [];
  const loading = listQuery.isLoading;
  const error = listQuery.error ? getErrorMessage(listQuery.error).message : null;

  const createCentroCosto = useCreateCentroCosto();
  const updateCentroCosto = useUpdateCentroCosto();
  const deleteCentroCosto = useDeleteCentroCosto();
  const reactivarCentroCosto = useReactivarCentroCosto();

  const submitting = createCentroCosto.isPending || updateCentroCosto.isPending;
  const deleting = deleteCentroCosto.isPending;
  const reactivatingId = reactivarCentroCosto.variables?.centroCostoId ?? null;

  const centrosMismaEmpresa = list.filter((c) => c.empresa_id === (form.empresa_id || empresaFilter));
  const centrosParaEdit = list.filter((c) => c.empresa_id === editing?.empresa_id && c.centro_costo_id !== editing?.centro_costo_id);
  const openCreate = () => {
    setForm({ ...DEFAULT, empresa_id: empresaFilter || (empresas[0]?.empresa_id ?? '') });
    setCreateOpen(true);
  };
  const openEdit = (row: CentroCosto) => {
    setEditing(row);
    setEditForm({
      codigo: row.codigo,
      nombre: row.nombre,
      tipo_centro_costo: row.tipo_centro_costo,
      descripcion: row.descripcion ?? undefined,
      centro_costo_padre_id: row.centro_costo_padre_id ?? undefined,
      nivel: row.nivel ?? undefined,
      categoria: row.categoria ?? undefined,
      tiene_presupuesto: row.tiene_presupuesto ?? false,
      permite_imputacion_directa: row.permite_imputacion_directa ?? true,
      responsable_nombre: row.responsable_nombre ?? undefined,
      fecha_inicio_vigencia: row.fecha_inicio_vigencia ?? undefined,
      fecha_fin_vigencia: row.fecha_fin_vigencia ?? undefined,
      es_activo: row.es_activo,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id || !form.codigo.trim() || !form.nombre.trim() || !form.tipo_centro_costo) {
      toast.error('Empresa, código, nombre y tipo son requeridos.');
      return;
    }
    try {
      const payload = { ...form };
      if (payload.fecha_inicio_vigencia === '') delete payload.fecha_inicio_vigencia;
      if (payload.fecha_fin_vigencia === '') delete payload.fecha_fin_vigencia;
      await createCentroCosto.mutateAsync(payload);
      setCreateOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      const payload = { ...editForm };
      if (payload.fecha_inicio_vigencia === '') delete payload.fecha_inicio_vigencia;
      if (payload.fecha_fin_vigencia === '') delete payload.fecha_fin_vigencia;
      await updateCentroCosto.mutateAsync({
        centroCostoId: editing.centro_costo_id,
        payload,
        empresa_id: editing.empresa_id,
      });
      setEditOpen(false);
      setEditing(null);
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCentroCosto.mutateAsync({
        centroCostoId: deleteTarget.centro_costo_id,
        empresa_id: deleteTarget.empresa_id,
      });
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  const handleReactivar = async (row: CentroCosto) => {
    try {
      await reactivarCentroCosto.mutateAsync({ centroCostoId: row.centro_costo_id, empresa_id: row.empresa_id });
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  const empresaNombre = (id: string) => empresas.find((e) => e.empresa_id === id)?.razon_social ?? id;

  return (
    <OrgPageLayout
      title="Centros de costo"
      description="Configurar centros para control de gastos por área."
      action={
        canCrear ? (
          <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!empresas.length}>
            <Plus className="h-4 w-4 mr-2" /> Crear centro de costo
          </Button>
        ) : null
      }
    >
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        {empresas.length > 0 && (
          <div className="flex items-end gap-3">
            <div>
              <Label className="mr-2">Empresa</Label>
              <select value={empresaFilter} onChange={(e) => setEmpresaFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
                <option value="">Todas</option>
                {empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 pb-1">
              <input
                type="checkbox"
                id="cc_include_inactive"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <Label htmlFor="cc_include_inactive">Ver inactivos</Label>
            </div>
          </div>
        )}
        <div className="w-full md:w-80">
          <Label htmlFor="buscar_centrocosto">Buscar</Label>
          <input
            id="buscar_centrocosto"
            type="text"
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
            placeholder="Código, nombre, tipo..."
          />
        </div>
        {empresas.length === 0 && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="cc_include_inactive2"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            <Label htmlFor="cc_include_inactive2">Ver inactivos</Label>
          </div>
        )}
      </div>
      {loading && <div className="flex justify-center py-12"><Loader className="h-8 w-8 animate-spin text-brand-primary" /></div>}
      {error && !loading && <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">{error}</p>}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Empresa</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><DollarSign className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay centros de costo.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.centro_costo_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.codigo}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.tipo_centro_costo}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{empresaNombre(row.empresa_id)}</td>
                    <td className="px-4 py-3 flex items-center justify-center gap-1">
                      {canEditar && (
                        <Button variant="ghost" size="icon" onClick={() => openEdit(row)} className="text-brand-primary hover:text-brand-primary/80" title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canEditar && !row.es_activo && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleReactivar(row)}
                          disabled={!!reactivatingId}
                          className="text-green-600 hover:text-green-700"
                          title="Reactivar"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                      {canEliminar && (
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(row)} className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" title="Eliminar">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar centro de costo"
        message={deleteTarget ? `¿Eliminar el centro de costo "${deleteTarget.nombre}" (${deleteTarget.codigo})?` : ''}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        loading={deleting}
      />
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0"><DialogTitle>Crear centro de costo</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col min-h-0 flex-1">
            <DialogBody className="px-6 pb-2 space-y-5">
              <FormSection title="Información general">
                <div className="space-y-3">
                  <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className={inputClass} required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
                  <div><Label>Código *</Label><input type="text" value={form.codigo} onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))} className={inputClass} required /></div>
                  <div><Label>Nombre *</Label><input type="text" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} className={inputClass} required /></div>
                  <div><Label>Tipo *</Label><select value={form.tipo_centro_costo} onChange={(e) => setForm((p) => ({ ...p, tipo_centro_costo: e.target.value }))} className={inputClass}><option value="operativo">Operativo</option><option value="administrativo">Administrativo</option><option value="proyecto">Proyecto</option></select></div>
                  <div><Label>Descripción</Label><input type="text" value={form.descripcion ?? ''} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value || undefined }))} className={inputClass} /></div>
                </div>
              </FormSection>
              <FormSection title="Jerarquía">
                <div className="space-y-3">
                  <div><Label>Centro de costo padre</Label><select value={form.centro_costo_padre_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, centro_costo_padre_id: e.target.value || undefined }))} className={inputClass}><option value="">— Ninguno (raíz) —</option>{centrosMismaEmpresa.map((c) => <option key={c.centro_costo_id} value={c.centro_costo_id}>{c.codigo} — {c.nombre}</option>)}</select></div>
                  <div><Label>Nivel</Label><input type="number" min={1} value={form.nivel ?? ''} onChange={(e) => setForm((p) => ({ ...p, nivel: e.target.value === '' ? undefined : parseInt(e.target.value, 10) }))} className={inputClass} placeholder="1" /></div>
                </div>
              </FormSection>
              <FormSection title="Clasificación y presupuesto">
                <div className="space-y-3">
                  <div><Label>Categoría</Label><input type="text" value={form.categoria ?? ''} onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value || undefined }))} className={inputClass} /></div>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2"><input type="checkbox" checked={form.tiene_presupuesto ?? false} onChange={(e) => setForm((p) => ({ ...p, tiene_presupuesto: e.target.checked }))} className="rounded border-gray-300 dark:border-gray-600" /><Label>Tiene presupuesto</Label></div>
                    <div className="flex items-center gap-2"><input type="checkbox" checked={form.permite_imputacion_directa ?? true} onChange={(e) => setForm((p) => ({ ...p, permite_imputacion_directa: e.target.checked }))} className="rounded border-gray-300 dark:border-gray-600" /><Label>Permite imputación directa</Label></div>
                  </div>
                </div>
              </FormSection>
              <FormSection title="Responsable y vigencia">
                <div className="space-y-3">
                  <div><Label>Responsable</Label><input type="text" value={form.responsable_nombre ?? ''} onChange={(e) => setForm((p) => ({ ...p, responsable_nombre: e.target.value || undefined }))} className={inputClass} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Fecha inicio vigencia</Label><input type="date" value={form.fecha_inicio_vigencia ?? ''} onChange={(e) => setForm((p) => ({ ...p, fecha_inicio_vigencia: e.target.value || undefined }))} className={inputClass} /></div>
                    <div><Label>Fecha fin vigencia</Label><input type="date" value={form.fecha_fin_vigencia ?? ''} onChange={(e) => setForm((p) => ({ ...p, fecha_fin_vigencia: e.target.value || undefined }))} className={inputClass} /></div>
                  </div>
                </div>
              </FormSection>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="cc_create_activo" checked={form.es_activo ?? true} onChange={(e) => setForm((p) => ({ ...p, es_activo: e.target.checked }))} className="rounded border-gray-300 dark:border-gray-600" />
                <Label htmlFor="cc_create_activo">Activo</Label>
              </div>
            </DialogBody>
            <DialogFooter className="px-6 py-4 flex-shrink-0 border-t border-gray-200 dark:border-gray-700"><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0"><DialogTitle>Editar centro de costo</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="flex flex-col min-h-0 flex-1">
            <DialogBody className="px-6 pb-2 space-y-5">
              <FormSection title="Información general">
                <div className="space-y-3">
                  <div><Label>Código *</Label><input type="text" value={editForm.codigo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, codigo: e.target.value }))} className={inputClass} required /></div>
                  <div><Label>Nombre *</Label><input type="text" value={editForm.nombre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))} className={inputClass} required /></div>
                  <div><Label>Tipo *</Label><select value={editForm.tipo_centro_costo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, tipo_centro_costo: e.target.value }))} className={inputClass}><option value="operativo">Operativo</option><option value="administrativo">Administrativo</option><option value="proyecto">Proyecto</option></select></div>
                  <div><Label>Descripción</Label><input type="text" value={editForm.descripcion ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, descripcion: e.target.value || undefined }))} className={inputClass} /></div>
                </div>
              </FormSection>
              <FormSection title="Jerarquía">
                <div className="space-y-3">
                  <div><Label>Centro de costo padre</Label><select value={editForm.centro_costo_padre_id ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, centro_costo_padre_id: e.target.value || undefined }))} className={inputClass}><option value="">— Ninguno (raíz) —</option>{centrosParaEdit.map((c) => <option key={c.centro_costo_id} value={c.centro_costo_id}>{c.codigo} — {c.nombre}</option>)}</select></div>
                  <div><Label>Nivel</Label><input type="number" min={1} value={editForm.nivel ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nivel: e.target.value === '' ? undefined : parseInt(e.target.value, 10) }))} className={inputClass} /></div>
                </div>
              </FormSection>
              <FormSection title="Clasificación y presupuesto">
                <div className="space-y-3">
                  <div><Label>Categoría</Label><input type="text" value={editForm.categoria ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, categoria: e.target.value || undefined }))} className={inputClass} /></div>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2"><input type="checkbox" checked={editForm.tiene_presupuesto ?? false} onChange={(e) => setEditForm((p) => ({ ...p, tiene_presupuesto: e.target.checked }))} className="rounded border-gray-300 dark:border-gray-600" /><Label>Tiene presupuesto</Label></div>
                    <div className="flex items-center gap-2"><input type="checkbox" checked={editForm.permite_imputacion_directa ?? true} onChange={(e) => setEditForm((p) => ({ ...p, permite_imputacion_directa: e.target.checked }))} className="rounded border-gray-300 dark:border-gray-600" /><Label>Permite imputación directa</Label></div>
                  </div>
                </div>
              </FormSection>
              <FormSection title="Responsable y vigencia">
                <div className="space-y-3">
                  <div><Label>Responsable</Label><input type="text" value={editForm.responsable_nombre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, responsable_nombre: e.target.value || undefined }))} className={inputClass} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Fecha inicio vigencia</Label><input type="date" value={editForm.fecha_inicio_vigencia ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_inicio_vigencia: e.target.value || undefined }))} className={inputClass} /></div>
                    <div><Label>Fecha fin vigencia</Label><input type="date" value={editForm.fecha_fin_vigencia ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_fin_vigencia: e.target.value || undefined }))} className={inputClass} /></div>
                  </div>
                </div>
              </FormSection>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="cc_edit_activo" checked={editForm.es_activo ?? true} onChange={(e) => setEditForm((p) => ({ ...p, es_activo: e.target.checked }))} className="rounded border-gray-300 dark:border-gray-600" />
                <Label htmlFor="cc_edit_activo">Activo</Label>
              </div>
            </DialogBody>
            <DialogFooter className="px-6 py-4 flex-shrink-0 border-t border-gray-200 dark:border-gray-700"><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </OrgPageLayout>
  );
}
