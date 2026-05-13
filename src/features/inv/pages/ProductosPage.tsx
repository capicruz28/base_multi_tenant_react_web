/**
 * Productos — Listado y gestión completa. GET/POST /api/v1/inv/productos
 * Implementación centrada en los campos más importantes del catálogo.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, Package, Plus, Pencil, Search, Trash2, RotateCcw } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import { catalogosService } from '@/core/services/catalogos.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { Categoria, UnidadMedida, Producto, ProductoCreate, ProductoUpdate } from '../types/inv.types';
import type { CatMoneda } from '@/types/catalogos.types';
import { InvPageLayout } from '../components/InvPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { usePermissions } from '@/core/auth/hooks/usePermissions';
import { useCategorias } from '../hooks/categorias.hooks';
import { useUnidadesMedida } from '../hooks/unidades-medida.hooks';
import { useCreateProducto, useDeleteProducto, useProductos, useReactivarProducto, useUpdateProducto } from '../hooks/productos.hooks';

const TIPOS_PRODUCTO = ['bien', 'servicio', 'materia_prima', 'producto_terminado', 'semi_elaborado', 'insumo'] as const;
const METODOS_COSTEO = ['promedio', 'fifo', 'lifo', 'estandar'] as const;

const DEFAULT: ProductoCreate = {
  empresa_id: '',
  codigo_sku: '',
  nombre: '',
  tipo_producto: 'bien',
  unidad_medida_base_id: '',
  maneja_inventario: true,
  es_comprable: true,
  es_vendible: true,
  metodo_costeo: 'promedio',
  afecto_igv: true,
  porcentaje_igv: 18.0,
  moneda_costo: '',
  moneda_venta: '',
  es_activo: true,
};

export default function ProductosPage() {
  const { can } = usePermissions();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Producto | null>(null);
  const [form, setForm] = useState<ProductoCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<ProductoUpdate>({});
  const [monedas, setMonedas] = useState<CatMoneda[]>([]);

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

  const categoriasQuery = useCategorias({
    empresa_id: empresaFilter || undefined,
    solo_activos: true,
    enabled: !!empresaFilter,
  });
  const unidadesQuery = useUnidadesMedida({
    empresa_id: empresaFilter || undefined,
    solo_activos: true,
    enabled: !!empresaFilter,
  });

  const productosQuery = useProductos({
    empresa_id: empresaFilter || undefined,
    solo_activos: !mostrarInactivos,
    buscar: searchTerm.trim() || undefined,
    enabled: true,
  });

  const list = productosQuery.data ?? [];
  const categorias = (categoriasQuery.data ?? []) as Categoria[];
  const unidadesMedida = (unidadesQuery.data ?? []) as UnidadMedida[];

  const createMutation = useCreateProducto();
  const updateMutation = useUpdateProducto();
  const deleteMutation = useDeleteProducto();
  const reactivarMutation = useReactivarProducto();
  const submitting =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || reactivarMutation.isPending;

  useEffect(() => {
    catalogosService
      .listMonedas({ solo_activos: true })
      .then(setMonedas)
      .catch(() => setMonedas([]));
  }, []);

  const openCreate = () => {
    const defaultEmpresa = empresaFilter || (empresas[0]?.empresa_id ?? '');
    const defaultMonedaId = monedas[0]?.moneda_id ?? '';
    setForm({
      ...DEFAULT,
      empresa_id: defaultEmpresa,
      moneda_costo: defaultMonedaId,
      moneda_venta: defaultMonedaId,
    });
    setCreateOpen(true);
  };
  const openEdit = (row: Producto) => {
    setEditing(row);
    setEditForm({
      codigo_sku: row.codigo_sku,
      nombre: row.nombre,
      codigo_barra: row.codigo_barra ?? undefined,
      codigo_interno: row.codigo_interno ?? undefined,
      codigo_fabricante: row.codigo_fabricante ?? undefined,
      categoria_id: row.categoria_id ?? undefined,
      subcategoria_id: row.subcategoria_id ?? undefined,
      marca: row.marca ?? undefined,
      modelo: row.modelo ?? undefined,
      linea_producto: row.linea_producto ?? undefined,
      tipo_producto: row.tipo_producto,
      unidad_medida_base_id: row.unidad_medida_base_id,
      unidad_medida_compra_id: row.unidad_medida_compra_id ?? undefined,
      unidad_medida_venta_id: row.unidad_medida_venta_id ?? undefined,
      factor_conversion_compra: row.factor_conversion_compra ?? undefined,
      factor_conversion_venta: row.factor_conversion_venta ?? undefined,
      peso_kg: row.peso_kg ?? undefined,
      volumen_m3: row.volumen_m3 ?? undefined,
      largo_cm: row.largo_cm ?? undefined,
      ancho_cm: row.ancho_cm ?? undefined,
      alto_cm: row.alto_cm ?? undefined,
      color: row.color ?? undefined,
      talla: row.talla ?? undefined,
      atributos_personalizados: row.atributos_personalizados ?? undefined,
      especificaciones_tecnicas: row.especificaciones_tecnicas ?? undefined,
      maneja_inventario: row.maneja_inventario ?? true,
      stock_minimo: row.stock_minimo ?? undefined,
      stock_maximo: row.stock_maximo ?? undefined,
      punto_reorden: row.punto_reorden ?? undefined,
      maneja_lotes: row.maneja_lotes ?? undefined,
      maneja_series: row.maneja_series ?? undefined,
      maneja_vencimiento: row.maneja_vencimiento ?? undefined,
      dias_vida_util: row.dias_vida_util ?? undefined,
      es_comprable: row.es_comprable ?? true,
      tiempo_entrega_dias: row.tiempo_entrega_dias ?? undefined,
      cantidad_minima_compra: row.cantidad_minima_compra ?? undefined,
      multiplo_compra: row.multiplo_compra ?? undefined,
      es_vendible: row.es_vendible ?? true,
      requiere_autorizacion_venta: row.requiere_autorizacion_venta ?? undefined,
      es_fabricable: row.es_fabricable ?? undefined,
      tiene_lista_materiales: row.tiene_lista_materiales ?? undefined,
      metodo_costeo: row.metodo_costeo ?? 'promedio',
      moneda_costo: row.moneda_costo,
      precio_base_venta: row.precio_base_venta ?? undefined,
      moneda_venta: row.moneda_venta,
      afecto_igv: row.afecto_igv ?? true,
      porcentaje_igv: row.porcentaje_igv ?? 18.0,
      codigo_sunat: row.codigo_sunat ?? undefined,
      tipo_afectacion_igv: row.tipo_afectacion_igv ?? undefined,
      proveedor_habitual_id: row.proveedor_habitual_id ?? undefined,
      es_activo: row.es_activo,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id || !form.codigo_sku.trim() || !form.nombre.trim() || !form.tipo_producto || !form.unidad_medida_base_id) {
      toast.error('Completa empresa, SKU, nombre, tipo y unidad de medida.');
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
      await updateMutation.mutateAsync({ productoId: editing.producto_id, payload: editForm });
      setEditOpen(false);
      setEditing(null);
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  const categoriaNombre = (id: string | null | undefined) => id ? categorias.find((c) => c.categoria_id === id)?.nombre ?? id : '-';
  const canCrear = can('inv', 'crear');
  const canEditar = can('inv', 'editar');
  const canEliminar = can('inv', 'eliminar');

  const eliminar = async (row: Producto) => {
    if (!canEliminar) return;
    const ok = window.confirm(`¿Dar de baja el producto "${row.nombre}"?`);
    if (!ok) return;
    try {
      await deleteMutation.mutateAsync({ productoId: row.producto_id });
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  const reactivar = async (row: Producto) => {
    if (!canEditar) return;
    const ok = window.confirm(`¿Reactivar el producto "${row.nombre}"?`);
    if (!ok) return;
    try {
      await reactivarMutation.mutateAsync({ productoId: row.producto_id });
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    }
  };

  return (
    <InvPageLayout
      title="Productos"
      description="Catálogo completo con SKU, código de barras, categoría, precio."
      action={
        <Button
          onClick={openCreate}
          className="bg-brand-primary hover:bg-brand-primary-hover text-white"
          disabled={!empresas.length || !unidadesMedida.length || !canCrear}
        >
          <Plus className="h-4 w-4 mr-2" /> Crear producto
        </Button>
      }
    >
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        {empresas.length > 0 && (
          <div>
            <Label className="mr-2">Empresa</Label>
            <select value={empresaFilter} onChange={(e) => setEmpresaFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
              <option value="">Todas</option>
              {empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}
            </select>
          </div>
        )}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, SKU o código de barras..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-3 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
          />
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={mostrarInactivos}
            onChange={(e) => setMostrarInactivos(e.target.checked)}
          />
          Mostrar inactivos
        </label>
      </div>
      {productosQuery.isLoading && (
        <div className="flex justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      )}
      {productosQuery.error && !productosQuery.isLoading && (
        <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          {getErrorMessage(productosQuery.error).message}
        </p>
      )}
      {!productosQuery.isLoading && !productosQuery.error && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Categoría</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Precio</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    No hay productos.
                  </td>
                </tr>
              ) : (
                list.map((row) => (
                  <tr key={row.producto_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.codigo_sku}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{categoriaNombre(row.categoria_id)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.tipo_producto}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.precio_base_venta ? `S/ ${row.precio_base_venta.toFixed(2)}` : '-'}</td>
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Crear producto</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Información General</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Empresa *</Label>
                  <select
                    value={form.empresa_id}
                    onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                    required
                  >
                    <option value="">Seleccionar</option>
                    {empresas.map((e) => (
                      <option key={e.empresa_id} value={e.empresa_id}>
                        {e.razon_social}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>SKU *</Label>
                  <input
                    type="text"
                    value={form.codigo_sku}
                    onChange={(e) => setForm((p) => ({ ...p, codigo_sku: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Nombre *</Label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                    required
                  />
                </div>
                <div>
                  <Label>Código de barras</Label>
                  <input
                    type="text"
                    value={form.codigo_barra ?? ''}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, codigo_barra: e.target.value || undefined }))
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <Label>Código interno</Label>
                  <input
                    type="text"
                    value={form.codigo_interno ?? ''}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, codigo_interno: e.target.value || undefined }))
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <Label>Código fabricante</Label>
                  <input
                    type="text"
                    value={form.codigo_fabricante ?? ''}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, codigo_fabricante: e.target.value || undefined }))
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <Label>Categoría</Label>
                  <select
                    value={form.categoria_id ?? ''}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, categoria_id: e.target.value || undefined }))
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  >
                    <option value="">Ninguna</option>
                    {categorias.map((c) => (
                      <option key={c.categoria_id} value={c.categoria_id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Tipo *</Label>
                  <select
                    value={form.tipo_producto}
                    onChange={(e) => setForm((p) => ({ ...p, tipo_producto: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  >
                    {TIPOS_PRODUCTO.map((t) => (
                      <option key={t} value={t}>
                        {t.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Unidad de medida base *</Label>
                  <select
                    value={form.unidad_medida_base_id}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, unidad_medida_base_id: e.target.value }))
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                    required
                  >
                    <option value="">Seleccionar</option>
                    {unidadesMedida.map((u) => (
                      <option key={u.unidad_medida_id} value={u.unidad_medida_id}>
                        {u.nombre} ({u.codigo})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="border-t pt-4 space-y-4">
              <h3 className="text-sm font-semibold">Inventario</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.maneja_inventario ?? true}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, maneja_inventario: e.target.checked }))
                    }
                  />
                  <Label>Maneja inventario</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.maneja_lotes ?? false}
                    onChange={(e) => setForm((p) => ({ ...p, maneja_lotes: e.target.checked }))}
                  />
                  <Label>Maneja lotes</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.maneja_series ?? false}
                    onChange={(e) => setForm((p) => ({ ...p, maneja_series: e.target.checked }))}
                  />
                  <Label>Maneja series</Label>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Stock mínimo</Label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.stock_minimo ?? ''}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        stock_minimo: e.target.value ? parseFloat(e.target.value) : undefined,
                      }))
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <Label>Stock máximo</Label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.stock_maximo ?? ''}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        stock_maximo: e.target.value ? parseFloat(e.target.value) : undefined,
                      }))
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <Label>Punto de reorden</Label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.punto_reorden ?? ''}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        punto_reorden: e.target.value ? parseFloat(e.target.value) : undefined,
                      }))
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.maneja_vencimiento ?? false}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, maneja_vencimiento: e.target.checked }))
                    }
                  />
                  <Label>Maneja vencimiento</Label>
                </div>
                <div>
                  <Label>Días de vida útil</Label>
                  <input
                    type="number"
                    step="1"
                    value={form.dias_vida_util ?? ''}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        dias_vida_util: e.target.value ? parseInt(e.target.value, 10) : undefined,
                      }))
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="border-t pt-4 space-y-4">
              <h3 className="text-sm font-semibold">Compras y Ventas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.es_comprable ?? true}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, es_comprable: e.target.checked }))
                    }
                  />
                  <Label>Es comprable</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.es_vendible ?? true}
                    onChange={(e) => setForm((p) => ({ ...p, es_vendible: e.target.checked }))}
                  />
                  <Label>Es vendible</Label>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Unidad de compra</Label>
                  <select
                    value={form.unidad_medida_compra_id ?? ''}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        unidad_medida_compra_id: e.target.value || undefined,
                      }))
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  >
                    <option value="">Misma que base</option>
                    {unidadesMedida.map((u) => (
                      <option key={u.unidad_medida_id} value={u.unidad_medida_id}>
                        {u.nombre} ({u.codigo})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Unidad de venta</Label>
                  <select
                    value={form.unidad_medida_venta_id ?? ''}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        unidad_medida_venta_id: e.target.value || undefined,
                      }))
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  >
                    <option value="">Misma que base</option>
                    {unidadesMedida.map((u) => (
                      <option key={u.unidad_medida_id} value={u.unidad_medida_id}>
                        {u.nombre} ({u.codigo})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Tiempo entrega (días)</Label>
                  <input
                    type="number"
                    step="1"
                    value={form.tiempo_entrega_dias ?? ''}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        tiempo_entrega_dias: e.target.value
                          ? parseInt(e.target.value, 10)
                          : undefined,
                      }))
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <Label>Cantidad mínima compra</Label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.cantidad_minima_compra ?? ''}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        cantidad_minima_compra: e.target.value
                          ? parseFloat(e.target.value)
                          : undefined,
                      }))
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <Label>Múltiplo compra</Label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.multiplo_compra ?? ''}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        multiplo_compra: e.target.value ? parseFloat(e.target.value) : undefined,
                      }))
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="border-t pt-4 space-y-4">
              <h3 className="text-sm font-semibold">Costos, Precios e Impuestos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Método de costeo</Label>
                  <select
                    value={form.metodo_costeo ?? 'promedio'}
                    onChange={(e) => setForm((p) => ({ ...p, metodo_costeo: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  >
                    {METODOS_COSTEO.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Moneda de costo *</Label>
                  <select
                    value={form.moneda_costo}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        moneda_costo: e.target.value,
                      }))
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                    required
                  >
                    <option value="">Seleccionar</option>
                    {monedas.map((m) => (
                      <option key={m.moneda_id} value={m.moneda_id}>
                        {m.codigo} — {m.nombre} ({m.simbolo})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Moneda de venta *</Label>
                  <select
                    value={form.moneda_venta}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        moneda_venta: e.target.value,
                      }))
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                    required
                  >
                    <option value="">Seleccionar</option>
                    {monedas.map((m) => (
                      <option key={m.moneda_id} value={m.moneda_id}>
                        {m.codigo} — {m.nombre} ({m.simbolo})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Precio base de venta</Label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.precio_base_venta ?? ''}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        precio_base_venta: e.target.value ? parseFloat(e.target.value) : undefined,
                      }))
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.afecto_igv ?? true}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, afecto_igv: e.target.checked }))
                    }
                  />
                  <Label>Afecto IGV</Label>
                </div>
                <div>
                  <Label>% IGV</Label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.porcentaje_igv ?? 18.0}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        porcentaje_igv: parseFloat(e.target.value) || 18.0,
                      }))
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <Label>Código SUNAT</Label>
                  <input
                    type="text"
                    value={form.codigo_sunat ?? ''}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, codigo_sunat: e.target.value || undefined }))
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <Label>Tipo afectación IGV</Label>
                  <input
                    type="text"
                    value={form.tipo_afectacion_igv ?? ''}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        tipo_afectacion_igv: e.target.value || undefined,
                      }))
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="border-t pt-4 space-y-4">
              <h3 className="text-sm font-semibold">Atributos y Producción</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Marca</Label>
                  <input
                    type="text"
                    value={form.marca ?? ''}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, marca: e.target.value || undefined }))
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <Label>Modelo</Label>
                  <input
                    type="text"
                    value={form.modelo ?? ''}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, modelo: e.target.value || undefined }))
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <Label>Color</Label>
                  <input
                    type="text"
                    value={form.color ?? ''}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, color: e.target.value || undefined }))
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <Label>Talla</Label>
                  <input
                    type="text"
                    value={form.talla ?? ''}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, talla: e.target.value || undefined }))
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.es_fabricable ?? false}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, es_fabricable: e.target.checked }))
                    }
                  />
                  <Label>Es fabricable</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.tiene_lista_materiales ?? false}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, tiene_lista_materiales: e.target.checked }))
                    }
                  />
                  <Label>Tiene lista de materiales</Label>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Atributos personalizados</Label>
                  <textarea
                    value={form.atributos_personalizados ?? ''}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        atributos_personalizados: e.target.value || undefined,
                      }))
                    }
                    rows={2}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <Label>Especificaciones técnicas</Label>
                  <textarea
                    value={form.especificaciones_tecnicas ?? ''}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        especificaciones_tecnicas: e.target.value || undefined,
                      }))
                    }
                    rows={2}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
              </div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar producto</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Información General</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>SKU *</Label>
                  <input
                    type="text"
                    value={editForm.codigo_sku ?? ''}
                    onChange={(e) => setEditForm((p) => ({ ...p, codigo_sku: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                    required
                  />
                </div>
                <div>
                  <Label>Código de barras</Label>
                  <input
                    type="text"
                    value={editForm.codigo_barra ?? ''}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, codigo_barra: e.target.value || undefined }))
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Nombre *</Label>
                  <input
                    type="text"
                    value={editForm.nombre ?? ''}
                    onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                    required
                  />
                </div>
                <div>
                  <Label>Categoría</Label>
                  <select
                    value={editForm.categoria_id ?? ''}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, categoria_id: e.target.value || undefined }))
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  >
                    <option value="">Ninguna</option>
                    {categorias.map((c) => (
                      <option key={c.categoria_id} value={c.categoria_id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Tipo *</Label>
                  <select
                    value={editForm.tipo_producto ?? ''}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, tipo_producto: e.target.value }))
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  >
                    {TIPOS_PRODUCTO.map((t) => (
                      <option key={t} value={t}>
                        {t.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="border-t pt-4 space-y-4">
              <h3 className="text-sm font-semibold">Inventario</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editForm.maneja_inventario ?? true}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, maneja_inventario: e.target.checked }))
                    }
                  />
                  <Label>Maneja inventario</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editForm.maneja_lotes ?? false}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, maneja_lotes: e.target.checked }))
                    }
                  />
                  <Label>Maneja lotes</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editForm.maneja_series ?? false}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, maneja_series: e.target.checked }))
                    }
                  />
                  <Label>Maneja series</Label>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Stock mínimo</Label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.stock_minimo ?? ''}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        stock_minimo: e.target.value
                          ? parseFloat(e.target.value)
                          : undefined,
                      }))
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <Label>Stock máximo</Label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.stock_maximo ?? ''}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        stock_maximo: e.target.value
                          ? parseFloat(e.target.value)
                          : undefined,
                      }))
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <Label>Punto de reorden</Label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.punto_reorden ?? ''}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        punto_reorden: e.target.value
                          ? parseFloat(e.target.value)
                          : undefined,
                      }))
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="border-t pt-4 space-y-4">
              <h3 className="text-sm font-semibold">Costos y Precios</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Método de costeo</Label>
                  <select
                    value={editForm.metodo_costeo ?? 'promedio'}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, metodo_costeo: e.target.value }))
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  >
                    {METODOS_COSTEO.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Moneda de costo *</Label>
                  <select
                    value={editForm.moneda_costo ?? ''}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        moneda_costo: e.target.value || undefined,
                      }))
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                    required
                  >
                    <option value="">Seleccionar</option>
                    {monedas.map((m) => (
                      <option key={m.moneda_id} value={m.moneda_id}>
                        {m.codigo} — {m.nombre} ({m.simbolo})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Moneda de venta *</Label>
                  <select
                    value={editForm.moneda_venta ?? ''}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        moneda_venta: e.target.value || undefined,
                      }))
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                    required
                  >
                    <option value="">Seleccionar</option>
                    {monedas.map((m) => (
                      <option key={m.moneda_id} value={m.moneda_id}>
                        {m.codigo} — {m.nombre} ({m.simbolo})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Precio base de venta</Label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.precio_base_venta ?? ''}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        precio_base_venta: e.target.value
                          ? parseFloat(e.target.value)
                          : undefined,
                      }))
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editForm.afecto_igv ?? true}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, afecto_igv: e.target.checked }))
                    }
                  />
                  <Label>Afecto IGV</Label>
                </div>
                <div>
                  <Label>% IGV</Label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.porcentaje_igv ?? 18.0}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        porcentaje_igv: parseFloat(e.target.value) || 18.0,
                      }))
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
              </div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </InvPageLayout>
  );
}
