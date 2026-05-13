/**
 * Unidades de Medida — Listado y gestión. GET/POST /api/v1/inv/unidades-medida
 */
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, Ruler, Plus, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { UnidadMedida, UnidadMedidaCreate, UnidadMedidaUpdate } from '../types/inv.types';
import { InvPageLayout } from '../components/InvPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { usePermissions } from '@/core/auth/hooks/usePermissions';
import {
  useCreateUnidadMedida,
  useDeleteUnidadMedida,
  useReactivarUnidadMedida,
  useUnidadesMedida,
  useUpdateUnidadMedida,
} from '../hooks/unidades-medida.hooks';

const TIPOS_UNIDAD = ['cantidad', 'peso', 'volumen', 'longitud', 'area', 'tiempo'] as const;

const DEFAULT: UnidadMedidaCreate = { empresa_id: '', codigo: '', nombre: '', tipo_unidad: 'cantidad', es_unidad_base: false, decimales_permitidos: 2, es_activo: true };

export default function UnidadesMedidaPage() {
  const { can } = usePermissions();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<UnidadMedida | null>(null);
  const [form, setForm] = useState<UnidadMedidaCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<UnidadMedidaUpdate>({});

  const loadEmpresas = useCallback(async () => {
    try {
      const data = await empresaService.list({ solo_activos: true });
      setEmpresas(data);
      if (data.length === 1 && !empresaFilter) setEmpresaFilter(data[0].empresa_id);
    } catch {
      setEmpresas([]);
    }
  }, [empresaFilter]);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);

  const unidadesQuery = useUnidadesMedida({
    empresa_id: empresaFilter || undefined,
    solo_activos: !mostrarInactivos,
    enabled: true,
  });
  const list = unidadesQuery.data ?? [];

  const createMutation = useCreateUnidadMedida();
  const updateMutation = useUpdateUnidadMedida();
  const deleteMutation = useDeleteUnidadMedida();
  const reactivarMutation = useReactivarUnidadMedida();

  const submitting =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || reactivarMutation.isPending;

  const openCreate = () => {
    setForm({ ...DEFAULT, empresa_id: empresaFilter || (empresas[0]?.empresa_id ?? '') });
    setCreateOpen(true);
  };
  const openEdit = (row: UnidadMedida) => {
    setEditing(row);
    setEditForm({ codigo: row.codigo, nombre: row.nombre, simbolo: row.simbolo ?? undefined, tipo_unidad: row.tipo_unidad, es_unidad_base: row.es_unidad_base ?? false, factor_conversion_base: row.factor_conversion_base ?? undefined, decimales_permitidos: row.decimales_permitidos ?? undefined, es_activo: row.es_activo });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id || !form.codigo.trim() || !form.nombre.trim() || !form.tipo_unidad) {
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
      await updateMutation.mutateAsync({ unidadMedidaId: editing.unidad_medida_id, payload: editForm });
      setEditOpen(false);
      setEditing(null);
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  const canCrear = can('inv', 'crear');
  const canEditar = can('inv', 'editar');
  const canEliminar = can('inv', 'eliminar');

  const eliminar = async (row: UnidadMedida) => {
    if (!canEliminar) return;
    const ok = window.confirm(`¿Dar de baja la unidad "${row.nombre}"?`);
    if (!ok) return;
    try {
      await deleteMutation.mutateAsync({ unidadMedidaId: row.unidad_medida_id });
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  const reactivar = async (row: UnidadMedida) => {
    if (!canEditar) return;
    const ok = window.confirm(`¿Reactivar la unidad "${row.nombre}"?`);
    if (!ok) return;
    try {
      await reactivarMutation.mutateAsync({ unidadMedidaId: row.unidad_medida_id });
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  return (
    <InvPageLayout
      title="Unidades de Medida"
      description="Gestionar UND, KG, MT, LT con factores de conversión."
      action={
        <Button
          onClick={openCreate}
          className="bg-brand-primary hover:bg-brand-primary-hover text-white"
          disabled={!empresas.length || !canCrear}
        >
          <Plus className="h-4 w-4 mr-2" /> Crear unidad
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

      {unidadesQuery.isLoading && (
        <div className="flex justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      )}
      {unidadesQuery.error && !unidadesQuery.isLoading && (
        <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          {getErrorMessage(unidadesQuery.error).message}
        </p>
      )}
      {!unidadesQuery.isLoading && !unidadesQuery.error && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Símbolo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Base</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    <Ruler className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    No hay unidades de medida.
                  </td>
                </tr>
              ) : (
                list.map((row) => (
                  <tr key={row.unidad_medida_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.codigo}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.simbolo ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.tipo_unidad}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.es_unidad_base ? 'Sí' : 'No'}</td>
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
          <DialogHeader><DialogTitle>Crear unidad de medida</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
            <div><Label>Código *</Label><input type="text" value={form.codigo} onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
            <div><Label>Nombre *</Label><input type="text" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
            <div><Label>Símbolo</Label><input type="text" value={form.simbolo ?? ''} onChange={(e) => setForm((p) => ({ ...p, simbolo: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
            <div><Label>Tipo *</Label><select value={form.tipo_unidad} onChange={(e) => setForm((p) => ({ ...p, tipo_unidad: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{TIPOS_UNIDAD.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={form.es_unidad_base ?? false} onChange={(e) => setForm((p) => ({ ...p, es_unidad_base: e.target.checked }))} /><Label>Es unidad base</Label></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar unidad de medida</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div><Label>Código *</Label><input type="text" value={editForm.codigo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, codigo: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
            <div><Label>Nombre *</Label><input type="text" value={editForm.nombre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
            <div><Label>Símbolo</Label><input type="text" value={editForm.simbolo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, simbolo: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
            <div><Label>Tipo *</Label><select value={editForm.tipo_unidad ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, tipo_unidad: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{TIPOS_UNIDAD.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={editForm.es_unidad_base ?? false} onChange={(e) => setEditForm((p) => ({ ...p, es_unidad_base: e.target.checked }))} /><Label>Es unidad base</Label></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </InvPageLayout>
  );
}
