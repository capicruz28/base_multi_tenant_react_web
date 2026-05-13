/**
 * Cargos — Listado y gestión. GET/POST /api/v1/org/cargos
 */
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, Briefcase, Plus, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { departamentoService } from '../services/org.service';
import { catalogosService } from '@/core/services/catalogos.service';
import type { Empresa, Cargo, CargoCreate, CargoUpdate } from '../types/org.types';
import type { Departamento } from '../types/org.types';
import type { CatMoneda } from '@/types/catalogos.types';
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
  useCargos,
  useCreateCargo,
  useDeleteCargo,
  useReactivarCargo,
  useUpdateCargo,
} from '../hooks/cargo.hooks';

const inputClass = 'mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm';
const DEFAULT: CargoCreate = {
  empresa_id: '',
  codigo: '',
  nombre: '',
  descripcion: undefined,
  departamento_id: undefined,
  nivel_jerarquico: undefined,
  categoria: undefined,
  area_funcional: undefined,
  cargo_jefe_id: undefined,
  rango_salarial_min: undefined,
  rango_salarial_max: undefined,
  moneda_salarial: undefined,
  nivel_educacion_minimo: undefined,
  experiencia_minima_meses: undefined,
  requisitos_especificos: undefined,
  es_activo: true,
};

export default function CargosPage() {
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [buscar, setBuscar] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Cargo | null>(null);
  const [form, setForm] = useState<CargoCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<CargoUpdate>({});
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [departamentosParaTabla, setDepartamentosParaTabla] = useState<Departamento[]>([]);
  const [monedas, setMonedas] = useState<CatMoneda[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Cargo | null>(null);
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

  const listQuery = useCargos({
    empresa_id: empresaFilter || undefined,
    solo_activos: !includeInactive,
    buscar,
  });
  const list: Cargo[] = listQuery.data ?? [];
  const loading = listQuery.isLoading;
  const error = listQuery.error ? getErrorMessage(listQuery.error).message : null;

  const createCargo = useCreateCargo();
  const updateCargo = useUpdateCargo();
  const deleteCargo = useDeleteCargo();
  const reactivarCargo = useReactivarCargo();

  const submitting = createCargo.isPending || updateCargo.isPending;
  const deleting = deleteCargo.isPending;
  const reactivatingId = reactivarCargo.variables?.cargoId ?? null;
  useEffect(() => {
    if (empresaFilter) departamentoService.list({ empresa_id: empresaFilter, solo_activos: true }).then(setDepartamentosParaTabla).catch(() => setDepartamentosParaTabla([]));
    else setDepartamentosParaTabla([]);
  }, [empresaFilter]);

  useEffect(() => {
    catalogosService
      .listMonedas({ solo_activos: true })
      .then(setMonedas)
      .catch(() => setMonedas([]));
  }, []);

  const openCreate = () => {
    const empId = empresaFilter || (empresas[0]?.empresa_id ?? '');
    const defaultMonedaId = monedas[0]?.moneda_id ?? '';
    setForm({ ...DEFAULT, empresa_id: empId, moneda_salarial: defaultMonedaId });
    setCreateOpen(true);
    if (empId) departamentoService.list({ empresa_id: empId, solo_activos: true }).then(setDepartamentos).catch(() => setDepartamentos([]));
    else setDepartamentos([]);
  };
  const cargosMismaEmpresa = list.filter((c) => c.empresa_id === (form.empresa_id || empresaFilter));
  const cargosParaEdit = list.filter((c) => c.empresa_id === editing?.empresa_id && c.cargo_id !== editing?.cargo_id);
  const openEdit = (row: Cargo) => {
    setEditing(row);
    setEditForm({
      codigo: row.codigo,
      nombre: row.nombre,
      descripcion: row.descripcion ?? undefined,
      departamento_id: row.departamento_id ?? undefined,
      nivel_jerarquico: row.nivel_jerarquico ?? undefined,
      categoria: row.categoria ?? undefined,
      area_funcional: row.area_funcional ?? undefined,
      cargo_jefe_id: row.cargo_jefe_id ?? undefined,
      rango_salarial_min: row.rango_salarial_min ?? undefined,
      rango_salarial_max: row.rango_salarial_max ?? undefined,
      moneda_salarial: row.moneda_salarial,
      nivel_educacion_minimo: row.nivel_educacion_minimo ?? undefined,
      experiencia_minima_meses: row.experiencia_minima_meses ?? undefined,
      requisitos_especificos: row.requisitos_especificos ?? undefined,
      es_activo: row.es_activo,
    });
    setEditOpen(true);
    if (row.empresa_id) departamentoService.list({ empresa_id: row.empresa_id, solo_activos: true }).then(setDepartamentos).catch(() => setDepartamentos([]));
    else setDepartamentos([]);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCargo.mutateAsync({ cargoId: deleteTarget.cargo_id, empresa_id: deleteTarget.empresa_id });
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  const departamentoNombre = (id: string) => departamentosParaTabla.find((d) => d.departamento_id === id)?.nombre ?? departamentos.find((d) => d.departamento_id === id)?.nombre ?? id;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id || !form.codigo.trim() || !form.nombre.trim()) {
      toast.error('Empresa, código y nombre son requeridos.');
      return;
    }
    try {
      await createCargo.mutateAsync(form);
      setCreateOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await updateCargo.mutateAsync({ cargoId: editing.cargo_id, payload: editForm, empresa_id: editing.empresa_id });
      setEditOpen(false);
      setEditing(null);
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  const handleReactivar = async (row: Cargo) => {
    try {
      await reactivarCargo.mutateAsync({ cargoId: row.cargo_id, empresa_id: row.empresa_id });
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  const empresaNombre = (id: string) => empresas.find((e) => e.empresa_id === id)?.razon_social ?? id;

  return (
    <OrgPageLayout
      title="Cargos"
      description="Definir puestos de trabajo (gerente, operario, vendedor, etc.)."
      action={
        canCrear ? (
          <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!empresas.length}>
            <Plus className="h-4 w-4 mr-2" /> Crear cargo
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
                id="cargo_include_inactive"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <Label htmlFor="cargo_include_inactive">Ver inactivos</Label>
            </div>
          </div>
        )}
        <div className="w-full md:w-80">
          <Label htmlFor="buscar_cargo">Buscar</Label>
          <input
            id="buscar_cargo"
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
              id="cargo_include_inactive2"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            <Label htmlFor="cargo_include_inactive2">Ver inactivos</Label>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Departamento</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Empresa</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><Briefcase className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay cargos.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.cargo_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.codigo}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.departamento_id ? departamentoNombre(row.departamento_id) : '—'}</td>
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
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0"><DialogTitle>Crear cargo</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col min-h-0 flex-1">
            <DialogBody className="px-6 pb-2 space-y-5 overflow-y-auto">
              <FormSection title="Información general">
                <div className="space-y-3">
                  <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => { const v = e.target.value; setForm((p) => ({ ...p, empresa_id: v })); if (v) departamentoService.list({ empresa_id: v, solo_activos: true }).then(setDepartamentos).catch(() => setDepartamentos([])); else setDepartamentos([]); }} className={inputClass} required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
                  <div><Label>Código *</Label><input type="text" value={form.codigo} onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))} className={inputClass} required /></div>
                  <div><Label>Nombre *</Label><input type="text" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} className={inputClass} required /></div>
                  <div><Label>Descripción</Label><input type="text" value={form.descripcion ?? ''} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value || undefined }))} className={inputClass} /></div>
                  <div><Label>Departamento</Label><select value={form.departamento_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, departamento_id: e.target.value || undefined }))} className={inputClass}><option value="">— Ninguno —</option>{departamentos.map((d) => <option key={d.departamento_id} value={d.departamento_id}>{d.codigo} — {d.nombre}</option>)}</select></div>
                </div>
              </FormSection>
              <FormSection title="Clasificación">
                <div className="space-y-3">
                  <div><Label>Nivel jerárquico</Label><input type="number" min={1} value={form.nivel_jerarquico ?? ''} onChange={(e) => setForm((p) => ({ ...p, nivel_jerarquico: e.target.value === '' ? undefined : parseInt(e.target.value, 10) }))} className={inputClass} placeholder="1" /></div>
                  <div><Label>Categoría</Label><input type="text" value={form.categoria ?? ''} onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value || undefined }))} className={inputClass} /></div>
                  <div><Label>Área funcional</Label><input type="text" value={form.area_funcional ?? ''} onChange={(e) => setForm((p) => ({ ...p, area_funcional: e.target.value || undefined }))} className={inputClass} /></div>
                  <div><Label>Cargo jefe</Label><select value={form.cargo_jefe_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, cargo_jefe_id: e.target.value || undefined }))} className={inputClass}><option value="">— Ninguno —</option>{cargosMismaEmpresa.map((c) => <option key={c.cargo_id} value={c.cargo_id}>{c.codigo} — {c.nombre}</option>)}</select></div>
                </div>
              </FormSection>
      <FormSection title="Compensación">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Rango salarial mín.</Label><input type="number" min={0} step={0.01} value={form.rango_salarial_min ?? ''} onChange={(e) => setForm((p) => ({ ...p, rango_salarial_min: e.target.value === '' ? undefined : parseFloat(e.target.value) }))} className={inputClass} /></div>
                    <div><Label>Rango salarial máx.</Label><input type="number" min={0} step={0.01} value={form.rango_salarial_max ?? ''} onChange={(e) => setForm((p) => ({ ...p, rango_salarial_max: e.target.value === '' ? undefined : parseFloat(e.target.value) }))} className={inputClass} /></div>
                  </div>
                  <div>
                    <Label>Moneda salarial *</Label>
                    <select
                      value={form.moneda_salarial}
                      onChange={(e) => setForm((p) => ({ ...p, moneda_salarial: e.target.value }))}
                      className={inputClass}
                      required
                    >
                      <option value="">— Seleccionar —</option>
                      {monedas.map((m) => (
                        <option key={m.moneda_id} value={m.moneda_id}>
                          {m.codigo} — {m.nombre} ({m.simbolo})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </FormSection>
              <FormSection title="Requisitos">
                <div className="space-y-3">
                  <div><Label>Nivel educación mínimo</Label><input type="text" value={form.nivel_educacion_minimo ?? ''} onChange={(e) => setForm((p) => ({ ...p, nivel_educacion_minimo: e.target.value || undefined }))} className={inputClass} placeholder="Ej. Secundaria, Universitario" /></div>
                  <div><Label>Experiencia mínima (meses)</Label><input type="number" min={0} value={form.experiencia_minima_meses ?? ''} onChange={(e) => setForm((p) => ({ ...p, experiencia_minima_meses: e.target.value === '' ? undefined : parseInt(e.target.value, 10) }))} className={inputClass} /></div>
                  <div><Label>Requisitos específicos</Label><textarea value={form.requisitos_especificos ?? ''} onChange={(e) => setForm((p) => ({ ...p, requisitos_especificos: e.target.value || undefined }))} className={inputClass} rows={2} /></div>
                </div>
              </FormSection>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="cargo_create_activo" checked={form.es_activo ?? true} onChange={(e) => setForm((p) => ({ ...p, es_activo: e.target.checked }))} className="rounded border-gray-300 dark:border-gray-600" />
                <Label htmlFor="cargo_create_activo">Activo</Label>
              </div>
            </DialogBody>
            <DialogFooter className="px-6 py-4 flex-shrink-0 border-t border-gray-200 dark:border-gray-700"><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0"><DialogTitle>Editar cargo</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="flex flex-col min-h-0 flex-1">
            <DialogBody className="px-6 pb-2 space-y-5 overflow-y-auto">
              <FormSection title="Información general">
                <div className="space-y-3">
                  <div><Label>Código *</Label><input type="text" value={editForm.codigo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, codigo: e.target.value }))} className={inputClass} required /></div>
                  <div><Label>Nombre *</Label><input type="text" value={editForm.nombre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))} className={inputClass} required /></div>
                  <div><Label>Descripción</Label><input type="text" value={editForm.descripcion ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, descripcion: e.target.value || undefined }))} className={inputClass} /></div>
                  <div><Label>Departamento</Label><select value={editForm.departamento_id ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, departamento_id: e.target.value || undefined }))} className={inputClass}><option value="">— Ninguno —</option>{departamentos.map((d) => <option key={d.departamento_id} value={d.departamento_id}>{d.codigo} — {d.nombre}</option>)}</select></div>
                </div>
              </FormSection>
              <FormSection title="Clasificación">
                <div className="space-y-3">
                  <div><Label>Nivel jerárquico</Label><input type="number" min={1} value={editForm.nivel_jerarquico ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nivel_jerarquico: e.target.value === '' ? undefined : parseInt(e.target.value, 10) }))} className={inputClass} /></div>
                  <div><Label>Categoría</Label><input type="text" value={editForm.categoria ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, categoria: e.target.value || undefined }))} className={inputClass} /></div>
                  <div><Label>Área funcional</Label><input type="text" value={editForm.area_funcional ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, area_funcional: e.target.value || undefined }))} className={inputClass} /></div>
                  <div><Label>Cargo jefe</Label><select value={editForm.cargo_jefe_id ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, cargo_jefe_id: e.target.value || undefined }))} className={inputClass}><option value="">— Ninguno —</option>{cargosParaEdit.map((c) => <option key={c.cargo_id} value={c.cargo_id}>{c.codigo} — {c.nombre}</option>)}</select></div>
                </div>
              </FormSection>
              <FormSection title="Compensación">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Rango salarial mín.</Label><input type="number" min={0} step={0.01} value={editForm.rango_salarial_min ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, rango_salarial_min: e.target.value === '' ? undefined : parseFloat(e.target.value) }))} className={inputClass} /></div>
                    <div><Label>Rango salarial máx.</Label><input type="number" min={0} step={0.01} value={editForm.rango_salarial_max ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, rango_salarial_max: e.target.value === '' ? undefined : parseFloat(e.target.value) }))} className={inputClass} /></div>
                  </div>
          <div>
            <Label>Moneda salarial *</Label>
            <select
              value={editForm.moneda_salarial ?? ''}
              onChange={(e) => setEditForm((p) => ({ ...p, moneda_salarial: e.target.value || undefined }))}
              className={inputClass}
              required
            >
              <option value="">— Seleccionar —</option>
              {monedas.map((m) => (
                <option key={m.moneda_id} value={m.moneda_id}>
                  {m.codigo} — {m.nombre} ({m.simbolo})
                </option>
              ))}
            </select>
          </div>
                </div>
              </FormSection>
              <FormSection title="Requisitos">
                <div className="space-y-3">
                  <div><Label>Nivel educación mínimo</Label><input type="text" value={editForm.nivel_educacion_minimo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nivel_educacion_minimo: e.target.value || undefined }))} className={inputClass} /></div>
                  <div><Label>Experiencia mínima (meses)</Label><input type="number" min={0} value={editForm.experiencia_minima_meses ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, experiencia_minima_meses: e.target.value === '' ? undefined : parseInt(e.target.value, 10) }))} className={inputClass} /></div>
                  <div><Label>Requisitos específicos</Label><textarea value={editForm.requisitos_especificos ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, requisitos_especificos: e.target.value || undefined }))} className={inputClass} rows={2} /></div>
                </div>
              </FormSection>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="cargo_edit_activo" checked={editForm.es_activo ?? true} onChange={(e) => setEditForm((p) => ({ ...p, es_activo: e.target.checked }))} className="rounded border-gray-300 dark:border-gray-600" />
                <Label htmlFor="cargo_edit_activo">Activo</Label>
              </div>
            </DialogBody>
            <DialogFooter className="px-6 py-4 flex-shrink-0 border-t border-gray-200 dark:border-gray-700"><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteConfirm} title="Eliminar cargo" message={deleteTarget ? `¿Eliminar el cargo "${deleteTarget.nombre}"?` : ''} confirmText="Eliminar" cancelText="Cancelar" variant="danger" loading={deleting} />
    </OrgPageLayout>
  );
}
