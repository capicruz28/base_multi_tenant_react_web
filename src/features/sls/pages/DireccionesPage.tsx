/**
 * Direcciones de Cliente — Listado y gestión. GET/POST /api/v1/sls/direcciones
 */
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, MapPin, Plus, Pencil } from 'lucide-react';
import { clienteService } from '../services/sls.service';
import { direccionClienteService } from '../services/sls.service';
import type { Cliente } from '../types/sls.types';
import type { DireccionCliente, DireccionClienteCreate, DireccionClienteUpdate } from '../types/sls.types';
import { SlsPageLayout } from '../components/SlsPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const DEFAULT: DireccionClienteCreate = {
  cliente_venta_id: '',
  codigo_direccion: null,
  nombre_direccion: null,
  direccion: null,
  referencia: null,
  pais: 'Perú',
  departamento: null,
  provincia: null,
  distrito: null,
  ubigeo: null,
  codigo_postal: null,
  contacto_nombre: null,
  contacto_telefono: null,
  es_direccion_fiscal: false,
  es_direccion_entrega_defecto: false,
  es_activo: true,
};

export default function DireccionesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [list, setList] = useState<DireccionCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clienteFilter, setClienteFilter] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<DireccionCliente | null>(null);
  const [form, setForm] = useState<DireccionClienteCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<DireccionClienteUpdate>({});
  const [submitting, setSubmitting] = useState(false);

  const loadClientes = useCallback(async () => {
    try {
      const data = await clienteService.list({ solo_activos: true });
      setClientes(data);
    } catch {
      setClientes([]);
    }
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { solo_activos: true };
      if (clienteFilter) params.cliente_venta_id = clienteFilter;
      const data = await direccionClienteService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [clienteFilter]);

  useEffect(() => { loadClientes(); }, [loadClientes]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    setForm({ ...DEFAULT, cliente_venta_id: clienteFilter || (clientes[0]?.cliente_venta_id ?? '') });
    setCreateOpen(true);
  };
  const openEdit = (row: DireccionCliente) => {
    setEditing(row);
    setEditForm({
      nombre_direccion: row.nombre_direccion ?? undefined,
      direccion: row.direccion ?? undefined,
      referencia: row.referencia ?? undefined,
      departamento: row.departamento ?? undefined,
      provincia: row.provincia ?? undefined,
      distrito: row.distrito ?? undefined,
      contacto_nombre: row.contacto_nombre ?? undefined,
      contacto_telefono: row.contacto_telefono ?? undefined,
      es_direccion_fiscal: row.es_direccion_fiscal,
      es_direccion_entrega_defecto: row.es_direccion_entrega_defecto,
      es_activo: row.es_activo,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cliente_venta_id || !form.direccion?.trim()) {
      toast.error('Completa cliente y dirección.');
      return;
    }
    setSubmitting(true);
    try {
      await direccionClienteService.create(form);
      toast.success('Dirección creada.');
      setCreateOpen(false);
      fetchList();
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    try {
      await direccionClienteService.update(editing.direccion_id, editForm);
      toast.success('Dirección actualizada.');
      setEditOpen(false);
      setEditing(null);
      fetchList();
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const clienteNombre = (id: string) => clientes.find((c) => c.cliente_venta_id === id)?.razon_social ?? id;

  return (
    <SlsPageLayout
      title="Direcciones de Cliente"
      description="Gestionar direcciones de entrega y facturación por cliente."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!clientes.length}>
          <Plus className="h-4 w-4 mr-2" /> Crear dirección
        </Button>
      }
    >
      <div className="mb-4">
        {clientes.length > 0 && (
          <div>
            <Label className="mr-2">Cliente</Label>
            <select value={clienteFilter} onChange={(e) => setClienteFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
              <option value="">Todos</option>
              {clientes.map((c) => <option key={c.cliente_venta_id} value={c.cliente_venta_id}>{c.razon_social}</option>)}
            </select>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Dirección</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Distrito</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><MapPin className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay direcciones.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.direccion_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{clienteNombre(row.cliente_venta_id)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.nombre_direccion ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.direccion ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.distrito ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {row.es_direccion_fiscal && <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded mr-1">Fiscal</span>}
                      {row.es_direccion_entrega_defecto && <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Entrega</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(row)} className="text-brand-primary hover:text-brand-primary/80"><Pencil className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Crear dirección</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div><Label>Cliente *</Label><select value={form.cliente_venta_id} onChange={(e) => setForm((p) => ({ ...p, cliente_venta_id: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{clientes.map((c) => <option key={c.cliente_venta_id} value={c.cliente_venta_id}>{c.razon_social}</option>)}</select></div>
            <div><Label>Nombre Dirección</Label><input type="text" value={form.nombre_direccion ?? ''} onChange={(e) => setForm((p) => ({ ...p, nombre_direccion: e.target.value || null }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
            <div><Label>Dirección *</Label><input type="text" value={form.direccion ?? ''} onChange={(e) => setForm((p) => ({ ...p, direccion: e.target.value || null }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Departamento</Label><input type="text" value={form.departamento ?? ''} onChange={(e) => setForm((p) => ({ ...p, departamento: e.target.value || null }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Provincia</Label><input type="text" value={form.provincia ?? ''} onChange={(e) => setForm((p) => ({ ...p, provincia: e.target.value || null }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Distrito</Label><input type="text" value={form.distrito ?? ''} onChange={(e) => setForm((p) => ({ ...p, distrito: e.target.value || null }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Código Postal</Label><input type="text" value={form.codigo_postal ?? ''} onChange={(e) => setForm((p) => ({ ...p, codigo_postal: e.target.value || null }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Dirección</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.es_direccion_fiscal} onChange={(e) => setForm((p) => ({ ...p, es_direccion_fiscal: e.target.checked }))} className="rounded" /> Fiscal</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.es_direccion_entrega_defecto} onChange={(e) => setForm((p) => ({ ...p, es_direccion_entrega_defecto: e.target.checked }))} className="rounded" /> Entrega por Defecto</label>
              </div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Editar dirección</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div><Label>Dirección</Label><input type="text" value={editForm.direccion ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, direccion: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
            <div className="space-y-2">
              <Label>Tipo de Dirección</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2"><input type="checkbox" checked={editForm.es_direccion_fiscal} onChange={(e) => setEditForm((p) => ({ ...p, es_direccion_fiscal: e.target.checked }))} className="rounded" /> Fiscal</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={editForm.es_direccion_entrega_defecto} onChange={(e) => setEditForm((p) => ({ ...p, es_direccion_entrega_defecto: e.target.checked }))} className="rounded" /> Entrega por Defecto</label>
              </div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SlsPageLayout>
  );
}
