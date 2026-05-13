/**
 * Contactos de Proveedor — Listado y gestión. GET/POST /api/v1/pur/contactos
 */
import React, { useState } from 'react';
import { Loader, Users, Plus, Pencil, RotateCcw } from 'lucide-react';
import type { ContactoProveedor, ContactoProveedorCreate, ContactoProveedorUpdate, PurListParams } from '../types/pur.types';
import { PurPageLayout } from '../components/PurPageLayout';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { usePermissions } from '@/core/auth/hooks/usePermissions';
import { useProveedores } from '../hooks/useProveedores';
import {
  useContactosProveedor,
  useCreateContactoProveedor,
  useUpdateContactoProveedor,
  useReactivarContactoProveedor,
} from '../hooks/useContactosProveedor';

const inputClass =
  'mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm';

const DEFAULT: ContactoProveedorCreate = {
  proveedor_id: '',
  nombre_completo: '',
  cargo: null,
  area: null,
  telefono: null,
  telefono_movil: null,
  email: null,
  es_contacto_principal: false,
  es_contacto_cotizaciones: false,
  es_contacto_cobranzas: false,
  es_activo: true,
};

export default function ContactosPage() {
  const { can } = usePermissions();
  const canWrite = can('compras', 'crear') || can('compras', 'editar');

  const [proveedorFilter, setProveedorFilter] = useState('');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ContactoProveedor | null>(null);
  const [form, setForm] = useState<ContactoProveedorCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<ContactoProveedorUpdate>({});

  const listParams: PurListParams = {
    solo_activos: !mostrarInactivos,
    ...(proveedorFilter ? { proveedor_id: proveedorFilter } : {}),
  };

  const { data: proveedores = [] } = useProveedores({ solo_activos: true });
  const { data: list = [], isLoading, error } = useContactosProveedor(listParams);
  const createMut = useCreateContactoProveedor();
  const updateMut = useUpdateContactoProveedor();
  const reactivarMut = useReactivarContactoProveedor();

  const proveedorNombre = (id: string) =>
    proveedores.find((p) => p.proveedor_id === id)?.razon_social ?? id;

  const openCreate = () => {
    setForm({ ...DEFAULT, proveedor_id: proveedorFilter || (proveedores[0]?.proveedor_id ?? '') });
    setCreateOpen(true);
  };

  const openEdit = (row: ContactoProveedor) => {
    setEditing(row);
    setEditForm({
      nombre_completo: row.nombre_completo,
      cargo: row.cargo ?? undefined,
      area: row.area ?? undefined,
      telefono: row.telefono ?? undefined,
      telefono_movil: row.telefono_movil ?? undefined,
      email: row.email ?? undefined,
      es_contacto_principal: row.es_contacto_principal ?? false,
      es_contacto_cotizaciones: row.es_contacto_cotizaciones ?? false,
      es_contacto_cobranzas: row.es_contacto_cobranzas ?? false,
      es_activo: row.es_activo,
    });
    setEditOpen(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMut.mutate(form, { onSuccess: () => setCreateOpen(false) });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    updateMut.mutate({ id: editing.contacto_id, payload: editForm }, {
      onSuccess: () => { setEditOpen(false); setEditing(null); },
    });
  };

  return (
    <PurPageLayout
      title="Contactos de Proveedor"
      description="Gestionar vendedores y contactos del proveedor."
      action={
        canWrite ? (
          <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!proveedores.length}>
            <Plus className="h-4 w-4 mr-2" /> Crear contacto
          </Button>
        ) : undefined
      }
    >
      <div className="mb-4 flex flex-col sm:flex-row gap-4 flex-wrap">
        {proveedores.length > 0 && (
          <div>
            <Label className="mr-2">Proveedor</Label>
            <select value={proveedorFilter} onChange={(e) => setProveedorFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
              <option value="">Todos</option>
              {proveedores.map((p) => <option key={p.proveedor_id} value={p.proveedor_id}>{p.razon_social}</option>)}
            </select>
          </div>
        )}
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={mostrarInactivos} onChange={(e) => setMostrarInactivos(e.target.checked)} className="rounded" />
          Mostrar inactivos
        </label>
      </div>

      {isLoading && <div className="flex justify-center py-12"><Loader className="h-8 w-8 animate-spin text-brand-primary" /></div>}
      {error && !isLoading && <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">{error.message}</p>}

      {!isLoading && !error && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Proveedor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cargo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Teléfono</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Principal</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                {canWrite && <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={canWrite ? 8 : 7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><Users className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay contactos.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.contacto_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{proveedorNombre(row.proveedor_id)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.nombre_completo}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.cargo ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.telefono ?? row.telefono_movil ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.email ?? '-'}</td>
                    <td className="px-4 py-3 text-center">
                      {row.es_contacto_principal
                        ? <span className="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">Sí</span>
                        : <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">No</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.es_activo
                        ? <span className="px-2 py-0.5 text-xs rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">Activo</span>
                        : <span className="px-2 py-0.5 text-xs rounded bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">Inactivo</span>}
                    </td>
                    {canWrite && (
                      <td className="px-4 py-3 text-center flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(row)} title="Editar" className="text-brand-primary hover:text-brand-primary/80">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {!row.es_activo && (
                          <Button variant="ghost" size="icon" onClick={() => reactivarMut.mutate({ id: row.contacto_id })} disabled={reactivarMut.isPending} title="Reactivar" className="text-green-600 hover:text-green-700">
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal Crear ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Crear contacto</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div><Label>Proveedor *</Label><select value={form.proveedor_id} onChange={(e) => setForm((p) => ({ ...p, proveedor_id: e.target.value }))} className={inputClass} required><option value="">Seleccionar</option>{proveedores.map((p) => <option key={p.proveedor_id} value={p.proveedor_id}>{p.razon_social}</option>)}</select></div>
            <div><Label>Nombre Completo *</Label><input type="text" value={form.nombre_completo} onChange={(e) => setForm((p) => ({ ...p, nombre_completo: e.target.value }))} className={inputClass} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Cargo</Label><input type="text" value={form.cargo ?? ''} onChange={(e) => setForm((p) => ({ ...p, cargo: e.target.value || null }))} className={inputClass} /></div>
              <div><Label>Área</Label><input type="text" value={form.area ?? ''} onChange={(e) => setForm((p) => ({ ...p, area: e.target.value || null }))} className={inputClass} /></div>
              <div><Label>Teléfono</Label><input type="text" value={form.telefono ?? ''} onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value || null }))} className={inputClass} /></div>
              <div><Label>Teléfono Móvil</Label><input type="text" value={form.telefono_movil ?? ''} onChange={(e) => setForm((p) => ({ ...p, telefono_movil: e.target.value || null }))} className={inputClass} /></div>
              <div className="col-span-2"><Label>Email</Label><input type="email" value={form.email ?? ''} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value || null }))} className={inputClass} /></div>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Contacto</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.es_contacto_principal ?? false} onChange={(e) => setForm((p) => ({ ...p, es_contacto_principal: e.target.checked }))} className="rounded" /> Principal</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.es_contacto_cotizaciones ?? false} onChange={(e) => setForm((p) => ({ ...p, es_contacto_cotizaciones: e.target.checked }))} className="rounded" /> Cotizaciones</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.es_contacto_cobranzas ?? false} onChange={(e) => setForm((p) => ({ ...p, es_contacto_cobranzas: e.target.checked }))} className="rounded" /> Cobranzas</label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMut.isPending} className="bg-brand-primary hover:bg-brand-primary-hover">Crear</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Modal Editar ── */}
      <Dialog open={editOpen} onOpenChange={(o) => { if (!o) setEditing(null); setEditOpen(o); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Editar contacto</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div><Label>Nombre Completo *</Label><input type="text" value={editForm.nombre_completo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nombre_completo: e.target.value }))} className={inputClass} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Cargo</Label><input type="text" value={editForm.cargo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, cargo: e.target.value || undefined }))} className={inputClass} /></div>
              <div><Label>Área</Label><input type="text" value={editForm.area ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, area: e.target.value || undefined }))} className={inputClass} /></div>
              <div><Label>Teléfono</Label><input type="text" value={editForm.telefono ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, telefono: e.target.value || undefined }))} className={inputClass} /></div>
              <div><Label>Teléfono Móvil</Label><input type="text" value={editForm.telefono_movil ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, telefono_movil: e.target.value || undefined }))} className={inputClass} /></div>
              <div className="col-span-2"><Label>Email</Label><input type="email" value={editForm.email ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value || undefined }))} className={inputClass} /></div>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Contacto</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2"><input type="checkbox" checked={editForm.es_contacto_principal ?? false} onChange={(e) => setEditForm((p) => ({ ...p, es_contacto_principal: e.target.checked }))} className="rounded" /> Principal</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={editForm.es_contacto_cotizaciones ?? false} onChange={(e) => setEditForm((p) => ({ ...p, es_contacto_cotizaciones: e.target.checked }))} className="rounded" /> Cotizaciones</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={editForm.es_contacto_cobranzas ?? false} onChange={(e) => setEditForm((p) => ({ ...p, es_contacto_cobranzas: e.target.checked }))} className="rounded" /> Cobranzas</label>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="edit-activo-c" checked={editForm.es_activo ?? true} onChange={(e) => setEditForm((p) => ({ ...p, es_activo: e.target.checked }))} className="rounded" />
              <Label htmlFor="edit-activo-c">Activo</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={updateMut.isPending} className="bg-brand-primary hover:bg-brand-primary-hover">Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PurPageLayout>
  );
}
