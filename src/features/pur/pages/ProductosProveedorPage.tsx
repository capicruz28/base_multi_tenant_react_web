/**
 * Productos por Proveedor — Listado y gestión. GET/POST /api/v1/pur/productos-proveedor
 */
import React, { useState, useEffect } from 'react';
import { Loader, Package, Plus, Pencil, RotateCcw } from 'lucide-react';
import type { ProductoProveedor, ProductoProveedorCreate, ProductoProveedorUpdate, PurListParams } from '../types/pur.types';
import type { CatMoneda } from '@/types/catalogos.types';
import { unidadMedidaService } from '@/features/inv/services/inv.service';
import type { UnidadMedida } from '@/features/inv/types/inv.types';
import { PurPageLayout } from '../components/PurPageLayout';
import { catalogosService } from '@/core/services';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { usePermissions } from '@/core/auth/hooks/usePermissions';
import { useProveedores } from '../hooks/useProveedores';
import {
  useProductosProveedor,
  useCreateProductoProveedor,
  useUpdateProductoProveedor,
  useReactivarProductoProveedor,
} from '../hooks/useProductosProveedor';

const inputClass =
  'mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm';

const EMPTY_CREATE: ProductoProveedorCreate = {
  proveedor_id: '',
  producto_id: '',
  precio_unitario: 0,
  moneda_id: '',
  unidad_medida_id: '',
  es_proveedor_preferido: false,
  es_activo: true,
};

export default function ProductosProveedorPage() {
  const { can } = usePermissions();
  const canWrite = can('compras', 'crear') || can('compras', 'editar');

  const [proveedorFilter, setProveedorFilter] = useState('');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ProductoProveedor | null>(null);
  const [form, setForm] = useState<ProductoProveedorCreate>(EMPTY_CREATE);
  const [editForm, setEditForm] = useState<ProductoProveedorUpdate>({});

  const [monedas, setMonedas] = useState<CatMoneda[]>([]);
  const [unidades, setUnidades] = useState<UnidadMedida[]>([]);

  const listParams: PurListParams = {
    solo_activos: !mostrarInactivos,
    ...(proveedorFilter ? { proveedor_id: proveedorFilter } : {}),
  };

  const { data: proveedores = [] } = useProveedores({ solo_activos: true });
  const { data: list = [], isLoading, error } = useProductosProveedor(listParams);
  const createMut = useCreateProductoProveedor();
  const updateMut = useUpdateProductoProveedor();
  const reactivarMut = useReactivarProductoProveedor();

  useEffect(() => {
    catalogosService.listMonedas({ solo_activos: true }).then(setMonedas).catch(() => setMonedas([]));
    unidadMedidaService.list({ solo_activos: true }).then(setUnidades).catch(() => setUnidades([]));
  }, []);

  const openCreate = () => {
    setForm({ ...EMPTY_CREATE, proveedor_id: proveedorFilter || (proveedores[0]?.proveedor_id ?? '') });
    setCreateOpen(true);
  };

  const openEdit = (row: ProductoProveedor) => {
    setEditing(row);
    setEditForm({
      codigo_proveedor: row.codigo_proveedor ?? undefined,
      descripcion_proveedor: row.descripcion_proveedor ?? undefined,
      precio_unitario: parseFloat(row.precio_unitario) || 0,
      moneda_id: row.moneda_id,
      unidad_medida_id: row.unidad_medida_id,
      cantidad_minima: row.cantidad_minima ? parseFloat(row.cantidad_minima) : undefined,
      multiplo_compra: row.multiplo_compra ? parseFloat(row.multiplo_compra) : undefined,
      tiempo_entrega_dias: row.tiempo_entrega_dias ?? undefined,
      fecha_vigencia_desde: row.fecha_vigencia_desde ?? undefined,
      fecha_vigencia_hasta: row.fecha_vigencia_hasta ?? undefined,
      es_proveedor_preferido: row.es_proveedor_preferido ?? false,
      prioridad: row.prioridad ?? undefined,
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
    updateMut.mutate({ id: editing.producto_proveedor_id, payload: editForm }, {
      onSuccess: () => { setEditOpen(false); setEditing(null); },
    });
  };

  const monedaNombre = (id: string) => {
    const m = monedas.find((x) => x.moneda_id === id);
    return m ? `${m.codigo}` : id;
  };

  const unidadNombre = (id: string) => {
    const u = unidades.find((x) => x.unidad_medida_id === id);
    return u ? u.nombre : id;
  };

  const proveedorNombre = (id: string) =>
    proveedores.find((p) => p.proveedor_id === id)?.razon_social ?? id;

  return (
    <PurPageLayout
      title="Catálogo de Productos por Proveedor"
      description="Precios, moneda, unidades y vigencias por proveedor."
      action={
        canWrite ? (
          <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!proveedores.length}>
            <Plus className="h-4 w-4 mr-2" /> Agregar
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Producto</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Precio</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Moneda</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">U. Medida</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Preferido</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                {canWrite && <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={canWrite ? 8 : 7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><Package className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay productos registrados.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.producto_proveedor_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{proveedorNombre(row.proveedor_id)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.descripcion_proveedor ?? row.producto_id}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white font-medium">{parseFloat(row.precio_unitario).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{monedaNombre(row.moneda_id)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{unidadNombre(row.unidad_medida_id)}</td>
                    <td className="px-4 py-3 text-center">
                      {row.es_proveedor_preferido
                        ? <span className="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">Sí</span>
                        : <span className="text-gray-400">—</span>}
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
                          <Button variant="ghost" size="icon" onClick={() => reactivarMut.mutate({ id: row.producto_proveedor_id })} disabled={reactivarMut.isPending} title="Reactivar" className="text-green-600 hover:text-green-700">
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
          <DialogHeader><DialogTitle>Agregar producto-proveedor</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div><Label>Proveedor *</Label><select value={form.proveedor_id} onChange={(e) => setForm((p) => ({ ...p, proveedor_id: e.target.value }))} className={inputClass} required><option value="">Seleccionar</option>{proveedores.map((p) => <option key={p.proveedor_id} value={p.proveedor_id}>{p.razon_social}</option>)}</select></div>
            <div><Label>Producto ID *</Label><input type="text" placeholder="UUID del producto" value={form.producto_id} onChange={(e) => setForm((p) => ({ ...p, producto_id: e.target.value }))} className={inputClass} required /></div>
            <div><Label>Código Proveedor</Label><input type="text" value={form.codigo_proveedor ?? ''} onChange={(e) => setForm((p) => ({ ...p, codigo_proveedor: e.target.value || undefined }))} className={inputClass} /></div>
            <div><Label>Descripción (del proveedor)</Label><input type="text" value={form.descripcion_proveedor ?? ''} onChange={(e) => setForm((p) => ({ ...p, descripcion_proveedor: e.target.value || undefined }))} className={inputClass} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Precio unitario *</Label><input type="number" step="0.000001" min={0} value={form.precio_unitario} onChange={(e) => setForm((p) => ({ ...p, precio_unitario: parseFloat(e.target.value) || 0 }))} className={inputClass} required /></div>
              <div>
                <Label>Moneda *</Label>
                <select value={form.moneda_id} onChange={(e) => setForm((p) => ({ ...p, moneda_id: e.target.value }))} className={inputClass} required>
                  <option value="">— Seleccionar —</option>
                  {monedas.map((m) => <option key={m.moneda_id} value={m.moneda_id}>{m.codigo} — {m.nombre}</option>)}
                </select>
              </div>
              <div>
                <Label>Unidad de medida *</Label>
                <select value={form.unidad_medida_id} onChange={(e) => setForm((p) => ({ ...p, unidad_medida_id: e.target.value }))} className={inputClass} required>
                  <option value="">— Seleccionar —</option>
                  {unidades.map((u) => <option key={u.unidad_medida_id} value={u.unidad_medida_id}>{u.nombre} ({u.codigo})</option>)}
                </select>
              </div>
              <div><Label>Cantidad mínima</Label><input type="number" step="0.01" min={0} value={form.cantidad_minima ?? ''} onChange={(e) => setForm((p) => ({ ...p, cantidad_minima: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputClass} /></div>
              <div><Label>Múltiplo de compra</Label><input type="number" step="0.01" min={0} value={form.multiplo_compra ?? ''} onChange={(e) => setForm((p) => ({ ...p, multiplo_compra: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputClass} /></div>
              <div><Label>Tiempo entrega (días)</Label><input type="number" min={0} value={form.tiempo_entrega_dias ?? ''} onChange={(e) => setForm((p) => ({ ...p, tiempo_entrega_dias: e.target.value ? parseInt(e.target.value) : undefined }))} className={inputClass} /></div>
              <div><Label>Vigencia desde</Label><input type="date" value={form.fecha_vigencia_desde ?? ''} onChange={(e) => setForm((p) => ({ ...p, fecha_vigencia_desde: e.target.value || undefined }))} className={inputClass} /></div>
              <div><Label>Vigencia hasta</Label><input type="date" value={form.fecha_vigencia_hasta ?? ''} onChange={(e) => setForm((p) => ({ ...p, fecha_vigencia_hasta: e.target.value || undefined }))} className={inputClass} /></div>
              <div><Label>Prioridad</Label><input type="number" min={1} value={form.prioridad ?? ''} onChange={(e) => setForm((p) => ({ ...p, prioridad: e.target.value ? parseInt(e.target.value) : undefined }))} className={inputClass} /></div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="preferido-c" checked={form.es_proveedor_preferido ?? false} onChange={(e) => setForm((p) => ({ ...p, es_proveedor_preferido: e.target.checked }))} className="rounded" />
              <Label htmlFor="preferido-c">Proveedor preferido</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMut.isPending} className="bg-brand-primary hover:bg-brand-primary-hover">Agregar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Modal Editar ── */}
      <Dialog open={editOpen} onOpenChange={(o) => { if (!o) setEditing(null); setEditOpen(o); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Editar producto-proveedor</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div><Label>Código Proveedor</Label><input type="text" value={editForm.codigo_proveedor ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, codigo_proveedor: e.target.value || undefined }))} className={inputClass} /></div>
            <div><Label>Descripción (del proveedor)</Label><input type="text" value={editForm.descripcion_proveedor ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, descripcion_proveedor: e.target.value || undefined }))} className={inputClass} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Precio unitario *</Label><input type="number" step="0.000001" min={0} value={editForm.precio_unitario ?? 0} onChange={(e) => setEditForm((p) => ({ ...p, precio_unitario: parseFloat(e.target.value) || 0 }))} className={inputClass} required /></div>
              <div>
                <Label>Moneda *</Label>
                <select value={editForm.moneda_id ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, moneda_id: e.target.value || undefined }))} className={inputClass} required>
                  <option value="">— Seleccionar —</option>
                  {monedas.map((m) => <option key={m.moneda_id} value={m.moneda_id}>{m.codigo} — {m.nombre}</option>)}
                </select>
              </div>
              <div>
                <Label>Unidad de medida *</Label>
                <select value={editForm.unidad_medida_id ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, unidad_medida_id: e.target.value || undefined }))} className={inputClass} required>
                  <option value="">— Seleccionar —</option>
                  {unidades.map((u) => <option key={u.unidad_medida_id} value={u.unidad_medida_id}>{u.nombre} ({u.codigo})</option>)}
                </select>
              </div>
              <div><Label>Cantidad mínima</Label><input type="number" step="0.01" min={0} value={editForm.cantidad_minima ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, cantidad_minima: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputClass} /></div>
              <div><Label>Múltiplo de compra</Label><input type="number" step="0.01" min={0} value={editForm.multiplo_compra ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, multiplo_compra: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputClass} /></div>
              <div><Label>Tiempo entrega (días)</Label><input type="number" min={0} value={editForm.tiempo_entrega_dias ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, tiempo_entrega_dias: e.target.value ? parseInt(e.target.value) : undefined }))} className={inputClass} /></div>
              <div><Label>Vigencia desde</Label><input type="date" value={editForm.fecha_vigencia_desde ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_vigencia_desde: e.target.value || undefined }))} className={inputClass} /></div>
              <div><Label>Vigencia hasta</Label><input type="date" value={editForm.fecha_vigencia_hasta ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_vigencia_hasta: e.target.value || undefined }))} className={inputClass} /></div>
              <div><Label>Prioridad</Label><input type="number" min={1} value={editForm.prioridad ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, prioridad: e.target.value ? parseInt(e.target.value) : undefined }))} className={inputClass} /></div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="preferido-e" checked={editForm.es_proveedor_preferido ?? false} onChange={(e) => setEditForm((p) => ({ ...p, es_proveedor_preferido: e.target.checked }))} className="rounded" />
              <Label htmlFor="preferido-e">Proveedor preferido</Label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="activo-pp-e" checked={editForm.es_activo ?? true} onChange={(e) => setEditForm((p) => ({ ...p, es_activo: e.target.checked }))} className="rounded" />
              <Label htmlFor="activo-pp-e">Activo</Label>
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
