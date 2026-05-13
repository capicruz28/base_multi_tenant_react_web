/**
 * Tipos de Movimiento — Listado y gestión. GET/POST /api/v1/inv/tipos-movimiento
 */
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, ArrowLeftRight, Plus, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { TipoMovimiento, TipoMovimientoCreate, TipoMovimientoUpdate } from '../types/inv.types';
import { InvPageLayout } from '../components/InvPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { usePermissions } from '@/core/auth/hooks/usePermissions';
import {
  useCreateTipoMovimiento,
  useDeleteTipoMovimiento,
  useReactivarTipoMovimiento,
  useTiposMovimiento,
  useUpdateTipoMovimiento,
} from '../hooks/tipos-movimiento.hooks';

const CLASES_MOVIMIENTO = ['entrada', 'salida', 'transferencia', 'ajuste'] as const;

const DEFAULT: TipoMovimientoCreate = {
  empresa_id: '',
  codigo: '',
  nombre: '',
  clase_movimiento: 'entrada',
  afecta_costo: true,
  requiere_autorizacion: false,
  genera_asiento_contable: false,
  es_activo: true,
};

export default function TiposMovimientoPage() {
  const { can } = usePermissions();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<TipoMovimiento | null>(null);
  const [form, setForm] = useState<TipoMovimientoCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<TipoMovimientoUpdate>({});

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

  const tiposQuery = useTiposMovimiento({
    empresa_id: empresaFilter || undefined,
    solo_activos: !mostrarInactivos,
    enabled: true,
  });
  const list = tiposQuery.data ?? [];

  const createMutation = useCreateTipoMovimiento();
  const updateMutation = useUpdateTipoMovimiento();
  const deleteMutation = useDeleteTipoMovimiento();
  const reactivarMutation = useReactivarTipoMovimiento();

  const submitting =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || reactivarMutation.isPending;

  const openCreate = () => {
    setForm({ ...DEFAULT, empresa_id: empresaFilter || (empresas[0]?.empresa_id ?? '') });
    setCreateOpen(true);
  };
  const openEdit = (row: TipoMovimiento) => {
    setEditing(row);
    setEditForm({
      codigo: row.codigo,
      nombre: row.nombre,
      descripcion: row.descripcion ?? undefined,
      clase_movimiento: row.clase_movimiento,
      afecta_costo: row.afecta_costo ?? true,
      requiere_autorizacion: row.requiere_autorizacion ?? false,
      genera_asiento_contable: row.genera_asiento_contable ?? false,
      cuenta_contable_debito: row.cuenta_contable_debito ?? undefined,
      cuenta_contable_credito: row.cuenta_contable_credito ?? undefined,
      requiere_documento_referencia: row.requiere_documento_referencia ?? undefined,
      tipo_documento_referencia: row.tipo_documento_referencia ?? undefined,
      es_activo: row.es_activo,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id || !form.codigo.trim() || !form.nombre.trim() || !form.clase_movimiento) {
      toast.error('Empresa, código, nombre y clase son requeridos.');
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
      await updateMutation.mutateAsync({ tipoMovimientoId: editing.tipo_movimiento_id, payload: editForm });
      setEditOpen(false);
      setEditing(null);
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  const canCrear = can('inv', 'crear');
  const canEditar = can('inv', 'editar');
  const canEliminar = can('inv', 'eliminar');

  const eliminar = async (row: TipoMovimiento) => {
    if (!canEliminar) return;
    const ok = window.confirm(`¿Dar de baja el tipo "${row.nombre}"?`);
    if (!ok) return;
    try {
      await deleteMutation.mutateAsync({ tipoMovimientoId: row.tipo_movimiento_id });
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  const reactivar = async (row: TipoMovimiento) => {
    if (!canEditar) return;
    const ok = window.confirm(`¿Reactivar el tipo "${row.nombre}"?`);
    if (!ok) return;
    try {
      await reactivarMutation.mutateAsync({ tipoMovimientoId: row.tipo_movimiento_id });
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  return (
    <InvPageLayout
      title="Tipos de Movimiento"
      description="Definir tipos: compra, venta, ajuste, transferencia, etc."
      action={
        <Button
          onClick={openCreate}
          className="bg-brand-primary hover:bg-brand-primary-hover text-white"
          disabled={!empresas.length || !canCrear}
        >
          <Plus className="h-4 w-4 mr-2" /> Crear tipo
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

      {tiposQuery.isLoading && (
        <div className="flex justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      )}
      {tiposQuery.error && !tiposQuery.isLoading && (
        <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          {getErrorMessage(tiposQuery.error).message}
        </p>
      )}
      {!tiposQuery.isLoading && !tiposQuery.error && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Clase</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Afecta Costo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cuenta Débito</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cuenta Crédito</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    <ArrowLeftRight className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    No hay tipos de movimiento.
                  </td>
                </tr>
              ) : (
                list.map((row) => (
                  <tr key={row.tipo_movimiento_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.codigo}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.clase_movimiento}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.afecta_costo ? 'Sí' : 'No'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.cuenta_contable_debito ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.cuenta_contable_credito ?? '-'}</td>
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
          <DialogHeader><DialogTitle>Crear tipo de movimiento</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
            <div><Label>Código *</Label><input type="text" value={form.codigo} onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
            <div><Label>Nombre *</Label><input type="text" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
            <div><Label>Clase *</Label><select value={form.clase_movimiento} onChange={(e) => setForm((p) => ({ ...p, clase_movimiento: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{CLASES_MOVIMIENTO.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={form.afecta_costo ?? true} onChange={(e) => setForm((p) => ({ ...p, afecta_costo: e.target.checked }))} /><Label>Afecta costo</Label></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={form.requiere_autorizacion ?? false} onChange={(e) => setForm((p) => ({ ...p, requiere_autorizacion: e.target.checked }))} /><Label>Requiere autorización</Label></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={form.genera_asiento_contable ?? false} onChange={(e) => setForm((p) => ({ ...p, genera_asiento_contable: e.target.checked }))} /><Label>Genera asiento contable</Label></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Cuenta contable débito</Label>
                <input
                  type="text"
                  value={form.cuenta_contable_debito ?? ''}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      cuenta_contable_debito: e.target.value || undefined,
                    }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
              <div>
                <Label>Cuenta contable crédito</Label>
                <input
                  type="text"
                  value={form.cuenta_contable_credito ?? ''}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      cuenta_contable_credito: e.target.value || undefined,
                    }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.requiere_documento_referencia ?? false}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      requiere_documento_referencia: e.target.checked,
                    }))
                  }
                />
                <Label>Requiere documento referencia</Label>
              </div>
              <div>
                <Label>Tipo documento referencia</Label>
                <input
                  type="text"
                  value={form.tipo_documento_referencia ?? ''}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      tipo_documento_referencia: e.target.value || undefined,
                    }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar tipo de movimiento</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div><Label>Código *</Label><input type="text" value={editForm.codigo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, codigo: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
            <div><Label>Nombre *</Label><input type="text" value={editForm.nombre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
            <div><Label>Clase *</Label><select value={editForm.clase_movimiento ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, clase_movimiento: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{CLASES_MOVIMIENTO.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={editForm.afecta_costo ?? true} onChange={(e) => setEditForm((p) => ({ ...p, afecta_costo: e.target.checked }))} /><Label>Afecta costo</Label></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={editForm.requiere_autorizacion ?? false} onChange={(e) => setEditForm((p) => ({ ...p, requiere_autorizacion: e.target.checked }))} /><Label>Requiere autorización</Label></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={editForm.genera_asiento_contable ?? false} onChange={(e) => setEditForm((p) => ({ ...p, genera_asiento_contable: e.target.checked }))} /><Label>Genera asiento contable</Label></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Cuenta contable débito</Label>
                <input
                  type="text"
                  value={editForm.cuenta_contable_debito ?? ''}
                  onChange={(e) =>
                    setEditForm((p) => ({
                      ...p,
                      cuenta_contable_debito: e.target.value || undefined,
                    }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
              <div>
                <Label>Cuenta contable crédito</Label>
                <input
                  type="text"
                  value={editForm.cuenta_contable_credito ?? ''}
                  onChange={(e) =>
                    setEditForm((p) => ({
                      ...p,
                      cuenta_contable_credito: e.target.value || undefined,
                    }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editForm.requiere_documento_referencia ?? false}
                  onChange={(e) =>
                    setEditForm((p) => ({
                      ...p,
                      requiere_documento_referencia: e.target.checked,
                    }))
                  }
                />
                <Label>Requiere documento referencia</Label>
              </div>
              <div>
                <Label>Tipo documento referencia</Label>
                <input
                  type="text"
                  value={editForm.tipo_documento_referencia ?? ''}
                  onChange={(e) =>
                    setEditForm((p) => ({
                      ...p,
                      tipo_documento_referencia: e.target.value || undefined,
                    }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </InvPageLayout>
  );
}
