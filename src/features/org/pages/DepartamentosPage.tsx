/**
 * Departamentos — Listado y gestión. GET/POST /api/v1/org/departamentos
 */
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, Layers, Plus, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { centroCostoService, sucursalService } from '../services/org.service';
import type { Empresa, Departamento, DepartamentoCreate, DepartamentoUpdate, CentroCosto, Sucursal } from '../types/org.types';
import { OrgPageLayout } from '../components/OrgPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogBody, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { FormSection } from '../components/FormSection';
import { usePermissions } from '@/core/auth/hooks/usePermissions';
import { useEmpresas } from '../hooks/empresa.hooks';
import {
  useCreateDepartamento,
  useDeleteDepartamento,
  useDepartamentos,
  useReactivarDepartamento,
  useUpdateDepartamento,
} from '../hooks/departamento.hooks';

const inputClass = 'mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm';
const DEFAULT: DepartamentoCreate = {
  empresa_id: '',
  codigo: '',
  nombre: '',
  descripcion: undefined,
  departamento_padre_id: undefined,
  tipo_departamento: undefined,
  jefe_nombre: undefined,
  centro_costo_id: undefined,
  sucursal_id: undefined,
  es_activo: true,
};

export default function DepartamentosPage() {
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [buscar, setBuscar] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Departamento | null>(null);
  const [form, setForm] = useState<DepartamentoCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<DepartamentoUpdate>({});
  const [deleteTarget, setDeleteTarget] = useState<Departamento | null>(null);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [centrosCosto, setCentrosCosto] = useState<CentroCosto[]>([]);

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

  const listQuery = useDepartamentos({
    empresa_id: empresaFilter || undefined,
    solo_activos: !includeInactive,
    buscar,
  });
  const list: Departamento[] = listQuery.data ?? [];
  const loading = listQuery.isLoading;
  const error = listQuery.error ? getErrorMessage(listQuery.error).message : null;

  const createDepartamento = useCreateDepartamento();
  const updateDepartamento = useUpdateDepartamento();
  const deleteDepartamento = useDeleteDepartamento();
  const reactivarDepartamento = useReactivarDepartamento();

  const submitting = createDepartamento.isPending || updateDepartamento.isPending;
  const deleting = deleteDepartamento.isPending;
  const reactivatingId = reactivarDepartamento.variables?.departamentoId ?? null;

  const loadSucursalesYCentros = async (empresaId: string) => {
    if (!empresaId) {
      setSucursales([]);
      setCentrosCosto([]);
      return;
    }
    try {
      const [suc, cc] = await Promise.all([
        sucursalService.list({ empresa_id: empresaId, solo_activos: true }),
        centroCostoService.list({ empresa_id: empresaId, solo_activos: true }),
      ]);
      setSucursales(suc);
      setCentrosCosto(cc);
    } catch {
      setSucursales([]);
      setCentrosCosto([]);
    }
  };

  const openCreate = () => {
    const empId = empresaFilter || (empresas[0]?.empresa_id ?? '');
    setForm({ ...DEFAULT, empresa_id: empId });
    loadSucursalesYCentros(empId);
    setCreateOpen(true);
  };

  const departamentosMismaEmpresa = list.filter((d) => d.empresa_id === (form.empresa_id || empresaFilter));
  const departamentosParaEdit = list.filter((d) => d.empresa_id === editing?.empresa_id && d.departamento_id !== editing?.departamento_id);
  const openEdit = (row: Departamento) => {
    setEditing(row);
    loadSucursalesYCentros(row.empresa_id);
    setEditForm({
      codigo: row.codigo,
      nombre: row.nombre,
      descripcion: row.descripcion ?? undefined,
      departamento_padre_id: row.departamento_padre_id ?? undefined,
      tipo_departamento: row.tipo_departamento ?? undefined,
      jefe_nombre: row.jefe_nombre ?? undefined,
      centro_costo_id: row.centro_costo_id ?? undefined,
      sucursal_id: row.sucursal_id ?? undefined,
      es_activo: row.es_activo,
    });
    setEditOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDepartamento.mutateAsync({
        departamentoId: deleteTarget.departamento_id,
        empresa_id: deleteTarget.empresa_id,
      });
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  const departamentoNombre = (id: string) => list.find((d) => d.departamento_id === id)?.nombre ?? id;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id || !form.codigo.trim() || !form.nombre.trim()) {
      toast.error('Empresa, código y nombre son requeridos.');
      return;
    }
    try {
      await createDepartamento.mutateAsync(form);
      setCreateOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await updateDepartamento.mutateAsync({
        departamentoId: editing.departamento_id,
        payload: editForm,
        empresa_id: editing.empresa_id,
      });
      setEditOpen(false);
      setEditing(null);
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  const handleReactivar = async (row: Departamento) => {
    try {
      await reactivarDepartamento.mutateAsync({ departamentoId: row.departamento_id, empresa_id: row.empresa_id });
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  const empresaNombre = (id: string) => empresas.find((e) => e.empresa_id === id)?.razon_social ?? id;

  return (
    <OrgPageLayout
      title="Departamentos"
      description="Estructura organizacional jerárquica por áreas."
      action={
        canCrear ? (
          <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!empresas.length}>
            <Plus className="h-4 w-4 mr-2" /> Crear departamento
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
                id="dept_include_inactive"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <Label htmlFor="dept_include_inactive">Ver inactivos</Label>
            </div>
          </div>
        )}
        <div className="w-full md:w-80">
          <Label htmlFor="buscar_departamento">Buscar</Label>
          <input
            id="buscar_departamento"
            type="text"
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
            placeholder="Código, nombre..."
          />
        </div>
        {empresas.length === 0 && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="dept_include_inactive2"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            <Label htmlFor="dept_include_inactive2">Ver inactivos</Label>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Padre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Empresa</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><Layers className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay departamentos.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.departamento_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.codigo}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.departamento_padre_id ? departamentoNombre(row.departamento_padre_id) : '—'}</td>
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
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0"><DialogTitle>Crear departamento</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col min-h-0 flex-1">
            <DialogBody className="px-6 pb-2 space-y-5">
              <FormSection title="Información general">
                <div className="space-y-3">
                  <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => { const v = e.target.value; setForm((p) => ({ ...p, empresa_id: v })); loadSucursalesYCentros(v); }} className={inputClass} required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
                  <div><Label>Código *</Label><input type="text" value={form.codigo} onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))} className={inputClass} required /></div>
                  <div><Label>Nombre *</Label><input type="text" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} className={inputClass} required /></div>
                  <div><Label>Descripción</Label><input type="text" value={form.descripcion ?? ''} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value || undefined }))} className={inputClass} /></div>
                </div>
              </FormSection>
              <FormSection title="Organización">
                <div className="space-y-3">
                  <div><Label>Departamento padre</Label><select value={form.departamento_padre_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, departamento_padre_id: e.target.value || undefined }))} className={inputClass}><option value="">— Ninguno (raíz) —</option>{departamentosMismaEmpresa.map((d) => <option key={d.departamento_id} value={d.departamento_id}>{d.codigo} — {d.nombre}</option>)}</select></div>
                  <div><Label>Tipo de departamento</Label><input type="text" value={form.tipo_departamento ?? ''} onChange={(e) => setForm((p) => ({ ...p, tipo_departamento: e.target.value || undefined }))} className={inputClass} placeholder="Ej. operativo, soporte" /></div>
                  <div><Label>Centro de costo</Label><select value={form.centro_costo_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, centro_costo_id: e.target.value || undefined }))} className={inputClass}><option value="">— Ninguno —</option>{centrosCosto.map((c) => <option key={c.centro_costo_id} value={c.centro_costo_id}>{c.codigo} — {c.nombre}</option>)}</select></div>
                  <div><Label>Sucursal</Label><select value={form.sucursal_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, sucursal_id: e.target.value || undefined }))} className={inputClass}><option value="">— Ninguna —</option>{sucursales.map((s) => <option key={s.sucursal_id} value={s.sucursal_id}>{s.codigo} — {s.nombre}</option>)}</select></div>
                </div>
              </FormSection>
              <FormSection title="Responsable">
                <div><Label>Jefe / responsable</Label><input type="text" value={form.jefe_nombre ?? ''} onChange={(e) => setForm((p) => ({ ...p, jefe_nombre: e.target.value || undefined }))} className={inputClass} /></div>
              </FormSection>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="dept_create_activo" checked={form.es_activo ?? true} onChange={(e) => setForm((p) => ({ ...p, es_activo: e.target.checked }))} className="rounded border-gray-300 dark:border-gray-600" />
                <Label htmlFor="dept_create_activo">Activo</Label>
              </div>
            </DialogBody>
            <DialogFooter className="px-6 py-4 flex-shrink-0 border-t border-gray-200 dark:border-gray-700"><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0"><DialogTitle>Editar departamento</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="flex flex-col min-h-0 flex-1">
            <DialogBody className="px-6 pb-2 space-y-5">
              <FormSection title="Información general">
                <div className="space-y-3">
                  <div><Label>Código *</Label><input type="text" value={editForm.codigo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, codigo: e.target.value }))} className={inputClass} required /></div>
                  <div><Label>Nombre *</Label><input type="text" value={editForm.nombre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))} className={inputClass} required /></div>
                  <div><Label>Descripción</Label><input type="text" value={editForm.descripcion ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, descripcion: e.target.value || undefined }))} className={inputClass} /></div>
                </div>
              </FormSection>
              <FormSection title="Organización">
                <div className="space-y-3">
                  <div><Label>Departamento padre</Label><select value={editForm.departamento_padre_id ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, departamento_padre_id: e.target.value || undefined }))} className={inputClass}><option value="">— Ninguno (raíz) —</option>{departamentosParaEdit.map((d) => <option key={d.departamento_id} value={d.departamento_id}>{d.codigo} — {d.nombre}</option>)}</select></div>
                  <div><Label>Tipo de departamento</Label><input type="text" value={editForm.tipo_departamento ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, tipo_departamento: e.target.value || undefined }))} className={inputClass} /></div>
                  <div><Label>Centro de costo</Label><select value={editForm.centro_costo_id ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, centro_costo_id: e.target.value || undefined }))} className={inputClass}><option value="">— Ninguno —</option>{centrosCosto.map((c) => <option key={c.centro_costo_id} value={c.centro_costo_id}>{c.codigo} — {c.nombre}</option>)}</select></div>
                  <div><Label>Sucursal</Label><select value={editForm.sucursal_id ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, sucursal_id: e.target.value || undefined }))} className={inputClass}><option value="">— Ninguna —</option>{sucursales.map((s) => <option key={s.sucursal_id} value={s.sucursal_id}>{s.codigo} — {s.nombre}</option>)}</select></div>
                </div>
              </FormSection>
              <FormSection title="Responsable">
                <div><Label>Jefe / responsable</Label><input type="text" value={editForm.jefe_nombre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, jefe_nombre: e.target.value || undefined }))} className={inputClass} /></div>
              </FormSection>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="dept_edit_activo" checked={editForm.es_activo ?? true} onChange={(e) => setEditForm((p) => ({ ...p, es_activo: e.target.checked }))} className="rounded border-gray-300 dark:border-gray-600" />
                <Label htmlFor="dept_edit_activo">Activo</Label>
              </div>
            </DialogBody>
            <DialogFooter className="px-6 py-4 flex-shrink-0 border-t border-gray-200 dark:border-gray-700"><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteConfirm} title="Eliminar departamento" message={deleteTarget ? `¿Eliminar el departamento "${deleteTarget.nombre}"?` : ''} confirmText="Eliminar" cancelText="Cancelar" variant="danger" loading={deleting} />
    </OrgPageLayout>
  );
}
