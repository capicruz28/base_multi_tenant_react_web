/**
 * Almacenes — Listado y gestión. GET/POST /api/v1/inv/almacenes
 */
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, Warehouse, Plus, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { empresaService, sucursalService } from '@/features/org/services/org.service';
import type { Empresa, Sucursal } from '@/features/org/types/org.types';
import type { Almacen, AlmacenCreate, AlmacenUpdate } from '../types/inv.types';
import { InvPageLayout } from '../components/InvPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { usePermissions } from '@/core/auth/hooks/usePermissions';
import {
  useAlmacenes,
  useCreateAlmacen,
  useDeleteAlmacen,
  useReactivarAlmacen,
  useUpdateAlmacen,
} from '../hooks/almacenes.hooks';

const TIPOS_ALMACEN = ['general', 'materia_prima', 'producto_terminado', 'transito', 'consignacion', 'cuarentena'] as const;

const DEFAULT: AlmacenCreate = {
  empresa_id: '',
  codigo: '',
  nombre: '',
  tipo_almacen: 'general',
  permite_compras: true,
  es_activo: true,
};

export default function AlmacenesPage() {
  const { can } = usePermissions();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Almacen | null>(null);
  const [form, setForm] = useState<AlmacenCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<AlmacenUpdate>({});

  const loadEmpresas = useCallback(async () => {
    try {
      const data = await empresaService.list({ solo_activos: true });
      setEmpresas(data);
      if (data.length === 1 && !empresaFilter) setEmpresaFilter(data[0].empresa_id);
    } catch {
      setEmpresas([]);
    }
  }, [empresaFilter]);

  const loadSucursales = useCallback(async () => {
    if (!empresaFilter) {
      setSucursales([]);
      return;
    }
    try {
      const data = await sucursalService.list({ empresa_id: empresaFilter, solo_activos: true });
      setSucursales(data);
    } catch {
      setSucursales([]);
    }
  }, [empresaFilter]);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);
  useEffect(() => { loadSucursales(); }, [loadSucursales]);

  const almacenesQuery = useAlmacenes({
    empresa_id: empresaFilter || undefined,
    solo_activos: !mostrarInactivos,
    enabled: true,
  });
  const list = almacenesQuery.data ?? [];

  const createMutation = useCreateAlmacen();
  const updateMutation = useUpdateAlmacen();
  const deleteMutation = useDeleteAlmacen();
  const reactivarMutation = useReactivarAlmacen();

  const submitting =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || reactivarMutation.isPending;

  const openCreate = () => {
    setForm({ ...DEFAULT, empresa_id: empresaFilter || (empresas[0]?.empresa_id ?? '') });
    setCreateOpen(true);
  };
  const openEdit = (row: Almacen) => {
    setEditing(row);
    setEditForm({
      codigo: row.codigo,
      nombre: row.nombre,
      descripcion: row.descripcion ?? undefined,
      tipo_almacen: row.tipo_almacen,
      direccion: row.direccion ?? undefined,
      responsable_nombre: row.responsable_nombre ?? undefined,
      es_almacen_principal: row.es_almacen_principal ?? false,
      permite_ventas: row.permite_ventas ?? false,
      permite_compras: row.permite_compras ?? true,
      permite_produccion: row.permite_produccion ?? false,
      capacidad_m3: row.capacidad_m3 ?? undefined,
      capacidad_kg: row.capacidad_kg ?? undefined,
      capacidad_unidades: row.capacidad_unidades ?? undefined,
      centro_costo_id: row.centro_costo_id ?? undefined,
      es_activo: row.es_activo,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id || !form.codigo.trim() || !form.nombre.trim() || !form.tipo_almacen) {
      toast.error('Empresa, código, nombre y tipo son requeridos.');
      return;
    }
    try {
      await createMutation.mutateAsync(form);
      setCreateOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await updateMutation.mutateAsync({ almacenId: editing.almacen_id, payload: editForm });
      setEditOpen(false);
      setEditing(null);
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  const sucursalNombre = (id: string | null | undefined) => id ? sucursales.find((s) => s.sucursal_id === id)?.nombre ?? id : '-';
  const canCrear = can('inv', 'crear');
  const canEditar = can('inv', 'editar');
  const canEliminar = can('inv', 'eliminar');

  const eliminar = async (row: Almacen) => {
    if (!canEliminar) return;
    const ok = window.confirm(`¿Dar de baja el almacén "${row.nombre}"?`);
    if (!ok) return;
    try {
      await deleteMutation.mutateAsync({ almacenId: row.almacen_id });
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  const reactivar = async (row: Almacen) => {
    if (!canEditar) return;
    const ok = window.confirm(`¿Reactivar el almacén "${row.nombre}"?`);
    if (!ok) return;
    try {
      await reactivarMutation.mutateAsync({ almacenId: row.almacen_id });
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  return (
    <InvPageLayout
      title="Almacenes"
      description="Configurar almacenes físicos y virtuales."
      action={
        <Button
          onClick={openCreate}
          className="bg-brand-primary hover:bg-brand-primary-hover text-white"
          disabled={!empresas.length || !canCrear}
        >
          <Plus className="h-4 w-4 mr-2" /> Crear almacén
        </Button>
      }
    >
      <div className="mb-4 flex flex-col sm:flex-row gap-4 sm:items-end">
        {empresas.length > 0 && (
          <div>
            <Label className="mr-2">Empresa</Label>
            <select
              value={empresaFilter}
              onChange={(e) => setEmpresaFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="">Todas</option>
              {empresas.map((e) => (
                <option key={e.empresa_id} value={e.empresa_id}>
                  {e.razon_social}
                </option>
              ))}
            </select>
          </div>
        )}
        <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={mostrarInactivos}
            onChange={(e) => setMostrarInactivos(e.target.checked)}
          />
          Mostrar inactivos
        </label>
      </div>

      {almacenesQuery.isLoading && (
        <div className="flex justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      )}
      {almacenesQuery.error && !almacenesQuery.isLoading && (
        <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          {getErrorMessage(almacenesQuery.error).message}
        </p>
      )}
      {!almacenesQuery.isLoading && !almacenesQuery.error && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Principal</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Sucursal</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    <Warehouse className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    No hay almacenes.
                  </td>
                </tr>
              ) : (
                list.map((row) => (
                  <tr key={row.almacen_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.codigo}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.tipo_almacen}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.es_almacen_principal ? 'Sí' : 'No'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{sucursalNombre(row.sucursal_id)}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          row.es_activo
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                        }`}
                      >
                        {row.es_activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.es_activo ? (
                        <div className="inline-flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(row)}
                            disabled={!canEditar}
                            className="text-brand-primary hover:text-brand-primary/80"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => void eliminar(row)}
                            disabled={!canEliminar || submitting}
                            className="text-red-600 hover:text-red-600/80"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => void reactivar(row)}
                          disabled={!canEditar || submitting}
                          className="text-emerald-700 hover:text-emerald-700/80"
                        >
                          <RotateCcw className="h-4 w-4" />
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
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Crear almacén</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => { setForm((p) => ({ ...p, empresa_id: e.target.value })); setEmpresaFilter(e.target.value); }} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
            <div><Label>Sucursal</Label><select value={form.sucursal_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, sucursal_id: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"><option value="">Ninguna</option>{sucursales.map((s) => <option key={s.sucursal_id} value={s.sucursal_id}>{s.nombre}</option>)}</select></div>
            <div><Label>Código *</Label><input type="text" value={form.codigo} onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
            <div><Label>Nombre *</Label><input type="text" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
            <div><Label>Tipo *</Label><select value={form.tipo_almacen} onChange={(e) => setForm((p) => ({ ...p, tipo_almacen: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{TIPOS_ALMACEN.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}</select></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={form.es_almacen_principal ?? false} onChange={(e) => setForm((p) => ({ ...p, es_almacen_principal: e.target.checked }))} /><Label>Almacén principal</Label></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={form.permite_ventas ?? false} onChange={(e) => setForm((p) => ({ ...p, permite_ventas: e.target.checked }))} /><Label>Permite ventas</Label></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={form.permite_compras ?? true} onChange={(e) => setForm((p) => ({ ...p, permite_compras: e.target.checked }))} /><Label>Permite compras</Label></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar almacén</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div><Label>Código *</Label><input type="text" value={editForm.codigo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, codigo: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
            <div><Label>Nombre *</Label><input type="text" value={editForm.nombre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
            <div><Label>Tipo *</Label><select value={editForm.tipo_almacen ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, tipo_almacen: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{TIPOS_ALMACEN.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}</select></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={editForm.es_almacen_principal ?? false} onChange={(e) => setEditForm((p) => ({ ...p, es_almacen_principal: e.target.checked }))} /><Label>Almacén principal</Label></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={editForm.permite_ventas ?? false} onChange={(e) => setEditForm((p) => ({ ...p, permite_ventas: e.target.checked }))} /><Label>Permite ventas</Label></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={editForm.permite_compras ?? true} onChange={(e) => setEditForm((p) => ({ ...p, permite_compras: e.target.checked }))} /><Label>Permite compras</Label></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </InvPageLayout>
  );
}
