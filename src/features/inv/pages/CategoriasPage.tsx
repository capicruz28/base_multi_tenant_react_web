/**
 * Categorías de Producto — Listado y gestión. GET/POST /api/v1/inv/categorias
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, FolderTree, Plus, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { Categoria, CategoriaCreate, CategoriaUpdate } from '../types/inv.types';
import { InvPageLayout } from '../components/InvPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { usePermissions } from '@/core/auth/hooks/usePermissions';
import {
  useCategorias,
  useCreateCategoria,
  useDeleteCategoria,
  useReactivarCategoria,
  useUpdateCategoria,
} from '../hooks/categorias.hooks';

const DEFAULT: CategoriaCreate = {
  empresa_id: '',
  codigo: '',
  nombre: '',
  metodo_costeo_defecto: 'promedio',
  es_activo: true,
};

export default function CategoriasPage() {
  const { can } = usePermissions();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Categoria | null>(null);
  const [form, setForm] = useState<CategoriaCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<CategoriaUpdate>({});

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

  const soloActivos = !mostrarInactivos;
  const categoriasQuery = useCategorias({
    empresa_id: empresaFilter || undefined,
    solo_activos: soloActivos,
    enabled: true,
  });
  const list = categoriasQuery.data ?? [];

  const createMutation = useCreateCategoria();
  const updateMutation = useUpdateCategoria();
  const deleteMutation = useDeleteCategoria();
  const reactivarMutation = useReactivarCategoria();

  const submitting =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || reactivarMutation.isPending;

  const categoriasById = useMemo(() => {
    const map = new Map<string, Categoria>();
    list.forEach((c) => map.set(c.categoria_id, c));
    return map;
  }, [list]);

  const openCreate = () => {
    setForm({ ...DEFAULT, empresa_id: empresaFilter || (empresas[0]?.empresa_id ?? '') });
    setCreateOpen(true);
  };
  const openEdit = (row: Categoria) => {
    setEditing(row);
    setEditForm({
      codigo: row.codigo,
      nombre: row.nombre,
      descripcion: row.descripcion ?? undefined,
      metodo_costeo_defecto: row.metodo_costeo_defecto ?? undefined,
      categoria_padre_id: row.categoria_padre_id ?? undefined,
      cuenta_contable_inventario: row.cuenta_contable_inventario ?? undefined,
      cuenta_contable_costo_venta: row.cuenta_contable_costo_venta ?? undefined,
      es_activo: row.es_activo,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id || !form.codigo.trim() || !form.nombre.trim()) {
      toast.error('Empresa, código y nombre son requeridos.');
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
      await updateMutation.mutateAsync({ categoriaId: editing.categoria_id, payload: editForm });
      setEditOpen(false);
      setEditing(null);
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  const empresaNombre = (id: string) => empresas.find((e) => e.empresa_id === id)?.razon_social ?? id;
  const canCrear = can('inv', 'crear');
  const canEditar = can('inv', 'editar');
  const canEliminar = can('inv', 'eliminar');

  const categoriaPadreNombre = (categoriaPadreId?: string | null) => {
    if (!categoriaPadreId) return '-';
    return categoriasById.get(categoriaPadreId)?.nombre ?? categoriaPadreId;
  };

  const eliminar = async (row: Categoria) => {
    if (!canEliminar) return;
    const ok = window.confirm(`¿Dar de baja la categoría "${row.nombre}"?`);
    if (!ok) return;
    try {
      await deleteMutation.mutateAsync({ categoriaId: row.categoria_id });
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  const reactivar = async (row: Categoria) => {
    if (!canEditar) return;
    const ok = window.confirm(`¿Reactivar la categoría "${row.nombre}"?`);
    if (!ok) return;
    try {
      await reactivarMutation.mutateAsync({ categoriaId: row.categoria_id });
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  return (
    <InvPageLayout
      title="Categorías"
      description="Organizar productos en categorías/subcategorías."
      action={
        <Button
          onClick={openCreate}
          className="bg-brand-primary hover:bg-brand-primary-hover text-white"
          disabled={!empresas.length || !canCrear}
        >
          <Plus className="h-4 w-4 mr-2" /> Crear categoría
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

      {categoriasQuery.isLoading && (
        <div className="flex justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      )}
      {categoriasQuery.error && !categoriasQuery.isLoading && (
        <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          {getErrorMessage(categoriasQuery.error).message}
        </p>
      )}
      {!categoriasQuery.isLoading && !categoriasQuery.error && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Padre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Método Costeo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Empresa</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    <FolderTree className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    No hay categorías.
                  </td>
                </tr>
              ) : (
                list.map((row) => (
                  <tr key={row.categoria_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.codigo}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {categoriaPadreNombre(row.categoria_padre_id)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.metodo_costeo_defecto ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{empresaNombre(row.empresa_id)}</td>
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
          <DialogHeader><DialogTitle>Crear categoría</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
            <div><Label>Código *</Label><input type="text" value={form.codigo} onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
            <div><Label>Nombre *</Label><input type="text" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
            <div>
              <Label>Categoría padre</Label>
              <select
                value={form.categoria_padre_id ?? ''}
                onChange={(e) =>
                  setForm((p) => ({ ...p, categoria_padre_id: e.target.value || undefined }))
                }
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="">Ninguna</option>
                {list.map((c) => (
                  <option key={c.categoria_id} value={c.categoria_id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div><Label>Método Costeo</Label><select value={form.metodo_costeo_defecto ?? 'promedio'} onChange={(e) => setForm((p) => ({ ...p, metodo_costeo_defecto: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"><option value="promedio">Promedio</option><option value="fifo">FIFO</option><option value="lifo">LIFO</option><option value="estandar">Estándar</option></select></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Cuenta contable inventario</Label>
                <input
                  type="text"
                  value={form.cuenta_contable_inventario ?? ''}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      cuenta_contable_inventario: e.target.value || undefined,
                    }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
              <div>
                <Label>Cuenta contable costo venta</Label>
                <input
                  type="text"
                  value={form.cuenta_contable_costo_venta ?? ''}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      cuenta_contable_costo_venta: e.target.value || undefined,
                    }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">
                Crear
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar categoría</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div><Label>Código *</Label><input type="text" value={editForm.codigo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, codigo: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
            <div><Label>Nombre *</Label><input type="text" value={editForm.nombre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
            <div>
              <Label>Categoría padre</Label>
              <select
                value={editForm.categoria_padre_id ?? ''}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, categoria_padre_id: e.target.value || undefined }))
                }
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="">Ninguna</option>
                {list.map((c) => (
                  <option key={c.categoria_id} value={c.categoria_id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div><Label>Método Costeo</Label><select value={editForm.metodo_costeo_defecto ?? 'promedio'} onChange={(e) => setEditForm((p) => ({ ...p, metodo_costeo_defecto: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"><option value="promedio">Promedio</option><option value="fifo">FIFO</option><option value="lifo">LIFO</option><option value="estandar">Estándar</option></select></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Cuenta contable inventario</Label>
                <input
                  type="text"
                  value={editForm.cuenta_contable_inventario ?? ''}
                  onChange={(e) =>
                    setEditForm((p) => ({
                      ...p,
                      cuenta_contable_inventario: e.target.value || undefined,
                    }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
              <div>
                <Label>Cuenta contable costo venta</Label>
                <input
                  type="text"
                  value={editForm.cuenta_contable_costo_venta ?? ''}
                  onChange={(e) =>
                    setEditForm((p) => ({
                      ...p,
                      cuenta_contable_costo_venta: e.target.value || undefined,
                    }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </InvPageLayout>
  );
}
