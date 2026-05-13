/**
 * Contactos de Cliente — Listado y gestión. GET/POST /api/v1/sls/contactos
 */
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, UserCircle, Plus, Pencil } from 'lucide-react';
import { clienteService } from '../services/sls.service';
import { contactoClienteService } from '../services/sls.service';
import type { Cliente } from '../types/sls.types';
import type { ContactoCliente, ContactoClienteCreate, ContactoClienteUpdate } from '../types/sls.types';
import { SlsPageLayout } from '../components/SlsPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const DEFAULT: ContactoClienteCreate = {
  cliente_venta_id: '',
  nombre_completo: '',
  cargo: null,
  area: null,
  telefono: null,
  telefono_movil: null,
  email: null,
  es_contacto_principal: false,
  es_contacto_comercial: false,
  es_contacto_cobranzas: false,
  fecha_nacimiento: null,
  observaciones: null,
  es_activo: true,
};

export default function ContactosPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [list, setList] = useState<ContactoCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clienteFilter, setClienteFilter] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ContactoCliente | null>(null);
  const [form, setForm] = useState<ContactoClienteCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<ContactoClienteUpdate>({});
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
      const data = await contactoClienteService.list(params);
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
  const openEdit = (row: ContactoCliente) => {
    setEditing(row);
    setEditForm({
      nombre_completo: row.nombre_completo,
      cargo: row.cargo ?? undefined,
      area: row.area ?? undefined,
      telefono: row.telefono ?? undefined,
      telefono_movil: row.telefono_movil ?? undefined,
      email: row.email ?? undefined,
      es_contacto_principal: row.es_contacto_principal,
      es_contacto_comercial: row.es_contacto_comercial,
      es_contacto_cobranzas: row.es_contacto_cobranzas,
      fecha_nacimiento: row.fecha_nacimiento ?? undefined,
      observaciones: row.observaciones ?? undefined,
      es_activo: row.es_activo,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cliente_venta_id || !form.nombre_completo.trim()) {
      toast.error('Completa cliente y nombre completo.');
      return;
    }
    setSubmitting(true);
    try {
      await contactoClienteService.create(form);
      toast.success('Contacto creado.');
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
      await contactoClienteService.update(editing.contacto_id, editForm);
      toast.success('Contacto actualizado.');
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
      title="Contactos de Cliente"
      description="Gestionar contactos por cliente."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!clientes.length}>
          <Plus className="h-4 w-4 mr-2" /> Crear contacto
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cargo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Teléfono</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><UserCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay contactos.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.contacto_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{clienteNombre(row.cliente_venta_id)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.nombre_completo}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.cargo ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.telefono ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.email ?? '-'}</td>
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
          <DialogHeader><DialogTitle>Crear contacto</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div><Label>Cliente *</Label><select value={form.cliente_venta_id} onChange={(e) => setForm((p) => ({ ...p, cliente_venta_id: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{clientes.map((c) => <option key={c.cliente_venta_id} value={c.cliente_venta_id}>{c.razon_social}</option>)}</select></div>
            <div><Label>Nombre Completo *</Label><input type="text" value={form.nombre_completo} onChange={(e) => setForm((p) => ({ ...p, nombre_completo: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Cargo</Label><input type="text" value={form.cargo ?? ''} onChange={(e) => setForm((p) => ({ ...p, cargo: e.target.value || null }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Área</Label><input type="text" value={form.area ?? ''} onChange={(e) => setForm((p) => ({ ...p, area: e.target.value || null }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Teléfono</Label><input type="text" value={form.telefono ?? ''} onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value || null }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Teléfono Móvil</Label><input type="text" value={form.telefono_movil ?? ''} onChange={(e) => setForm((p) => ({ ...p, telefono_movil: e.target.value || null }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Email</Label><input type="email" value={form.email ?? ''} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value || null }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Fecha Nacimiento</Label><input type="date" value={form.fecha_nacimiento ?? ''} onChange={(e) => setForm((p) => ({ ...p, fecha_nacimiento: e.target.value || null }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Contacto</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.es_contacto_principal} onChange={(e) => setForm((p) => ({ ...p, es_contacto_principal: e.target.checked }))} className="rounded" /> Principal</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.es_contacto_comercial} onChange={(e) => setForm((p) => ({ ...p, es_contacto_comercial: e.target.checked }))} className="rounded" /> Comercial</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.es_contacto_cobranzas} onChange={(e) => setForm((p) => ({ ...p, es_contacto_cobranzas: e.target.checked }))} className="rounded" /> Cobranzas</label>
              </div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Editar contacto</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div><Label>Nombre Completo *</Label><input type="text" value={editForm.nombre_completo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nombre_completo: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Cargo</Label><input type="text" value={editForm.cargo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, cargo: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Email</Label><input type="email" value={editForm.email ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Contacto</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2"><input type="checkbox" checked={editForm.es_contacto_principal} onChange={(e) => setEditForm((p) => ({ ...p, es_contacto_principal: e.target.checked }))} className="rounded" /> Principal</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={editForm.es_contacto_comercial} onChange={(e) => setEditForm((p) => ({ ...p, es_contacto_comercial: e.target.checked }))} className="rounded" /> Comercial</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={editForm.es_contacto_cobranzas} onChange={(e) => setEditForm((p) => ({ ...p, es_contacto_cobranzas: e.target.checked }))} className="rounded" /> Cobranzas</label>
              </div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SlsPageLayout>
  );
}
