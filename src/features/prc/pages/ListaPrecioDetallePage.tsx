/**
 * Detalles de Lista de Precio — React Query + RBAC.
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Loader, ArrowLeft, Pencil, Package, Plus, AlertCircle } from 'lucide-react';
import { usePermissions } from '@/core/auth/hooks/usePermissions';
import { useListaPrecio } from '../hooks/listas-precio.hooks';
import {
  useListaPrecioDetalles,
  useCreateListaPrecioDetalle,
  useUpdateListaPrecioDetalle,
} from '../hooks/lista-precio-detalles.hooks';
import { productoService } from '@/features/inv/services/inv.service';
import { unidadMedidaService } from '@/features/inv/services/inv.service';
import type { ListaPrecioDetalle, ListaPrecioDetalleCreate, ListaPrecioDetalleUpdate } from '../types/prc.types';
import type { Producto } from '@/features/inv/types/inv.types';
import type { UnidadMedida } from '@/features/inv/types/inv.types';
import type { CatMoneda } from '@/types/catalogos.types';
import { catalogosService } from '@/core/services/catalogos.service';
import { PrcPageLayout } from '../components/PrcPageLayout';
import { prcFormatMoney, prcToNumber } from '../utils/prc-numeric';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const DEFAULT: ListaPrecioDetalleCreate = {
  lista_precio_id: '',
  empresa_id: '',
  producto_id: '',
  precio_unitario: 0,
  unidad_medida_id: '',
  cantidad_minima: 1,
  cantidad_maxima: undefined,
  descuento_maximo_porcentaje: undefined,
  fecha_vigencia_desde: undefined,
  fecha_vigencia_hasta: undefined,
  es_activo: true,
};

export default function ListaPrecioDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const canCrear = can('prc', 'crear');
  const canEditar = can('prc', 'editar');

  const [monedaSimbolo, setMonedaSimbolo] = useState<string>('');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedida[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ListaPrecioDetalle | null>(null);
  const [form, setForm] = useState<ListaPrecioDetalleCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<ListaPrecioDetalleUpdate>({});

  const {
    data: listaPrecio,
    isLoading: headerLoading,
    isError: headerIsError,
    error: headerError,
    refetch: refetchHeader,
  } = useListaPrecio(id, { enabled: !!id });

  const {
    data: list = [],
    isLoading: tableLoading,
    isError: tableIsError,
    error: tableError,
    refetch: refetchDetalles,
  } = useListaPrecioDetalles(id, { solo_activos: true, enabled: !!id });

  const createMutation = useCreateListaPrecioDetalle();
  const updateMutation = useUpdateListaPrecioDetalle();

  const headerErrorMessage =
    headerIsError && headerError instanceof Error ? headerError.message : null;
  const tableErrorMessage =
    tableIsError && tableError instanceof Error ? tableError.message : null;

  useEffect(() => {
    if (!listaPrecio?.moneda_id) {
      setMonedaSimbolo('');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const monedas: CatMoneda[] = await catalogosService.listMonedas({ solo_activos: true });
        if (cancelled) return;
        const m = monedas.find((x) => x.moneda_id === listaPrecio.moneda_id);
        setMonedaSimbolo(m?.simbolo ?? m?.codigo ?? '');
      } catch {
        if (!cancelled) setMonedaSimbolo('');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [listaPrecio?.moneda_id]);

  const loadProductos = useCallback(async () => {
    if (!listaPrecio?.empresa_id) return;
    try {
      const data = await productoService.list({ empresa_id: listaPrecio.empresa_id, solo_activos: true });
      setProductos(data);
    } catch {
      setProductos([]);
    }
  }, [listaPrecio?.empresa_id]);

  const loadUnidadesMedida = useCallback(async () => {
    if (!listaPrecio?.empresa_id) return;
    try {
      const data = await unidadMedidaService.list({ empresa_id: listaPrecio.empresa_id, solo_activos: true });
      setUnidadesMedida(data);
    } catch {
      setUnidadesMedida([]);
    }
  }, [listaPrecio?.empresa_id]);

  useEffect(() => {
    loadProductos();
  }, [loadProductos]);
  useEffect(() => {
    loadUnidadesMedida();
  }, [loadUnidadesMedida]);

  const openCreate = () => {
    if (!id || !listaPrecio) return;
    setForm({
      ...DEFAULT,
      lista_precio_id: id,
      empresa_id: listaPrecio.empresa_id,
      unidad_medida_id: unidadesMedida[0]?.unidad_medida_id ?? '',
    });
    setCreateOpen(true);
  };

  const openEdit = (row: ListaPrecioDetalle) => {
    setEditing(row);
    setEditForm({
      precio_unitario: prcToNumber(row.precio_unitario),
      unidad_medida_id: row.unidad_medida_id,
      cantidad_minima: prcToNumber(row.cantidad_minima),
      cantidad_maxima: row.cantidad_maxima === null || row.cantidad_maxima === undefined ? undefined : prcToNumber(row.cantidad_maxima),
      descuento_maximo_porcentaje:
        row.descuento_maximo_porcentaje === null || row.descuento_maximo_porcentaje === undefined
          ? undefined
          : prcToNumber(row.descuento_maximo_porcentaje),
      fecha_vigencia_desde: row.fecha_vigencia_desde ?? undefined,
      fecha_vigencia_hasta: row.fecha_vigencia_hasta ?? undefined,
      es_activo: row.es_activo,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !form.producto_id || !form.unidad_medida_id || prcToNumber(form.precio_unitario) <= 0) {
      toast.error('Completa producto, unidad de medida y precio unitario.');
      return;
    }
    try {
      await createMutation.mutateAsync({ listaPrecioId: id, payload: form });
      setCreateOpen(false);
    } catch {
      /* toast en hook */
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !id) return;
    try {
      await updateMutation.mutateAsync({
        detalleId: editing.lista_precio_detalle_id,
        listaPrecioId: id,
        payload: editForm,
      });
      setEditOpen(false);
      setEditing(null);
    } catch {
      /* toast en hook */
    }
  };

  const submitting = createMutation.isPending || updateMutation.isPending;

  if (!id) {
    return <div className="p-6">ID de lista no válido.</div>;
  }

  const titleNombre = headerLoading ? 'Cargando…' : listaPrecio?.nombre ?? (headerErrorMessage ? '—' : '—');
  const titleCodigo = headerLoading ? '' : listaPrecio?.codigo_lista ?? '';

  return (
    <PrcPageLayout
      title={`Detalles: ${titleNombre}`}
      description={
        headerErrorMessage
          ? 'No se pudo cargar la cabecera de la lista.'
          : `Gestión de precios por producto en la lista "${titleCodigo}"`
      }
      action={
        canCrear && listaPrecio && !headerLoading && !headerErrorMessage ? (
          <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white">
            <Plus className="h-4 w-4 mr-2" /> Agregar producto
          </Button>
        ) : undefined
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={() => navigate('/app/prc/listas-precio')} className="mb-0">
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver a listas
        </Button>
        {headerErrorMessage && (
          <Button type="button" variant="outline" size="sm" onClick={() => refetchHeader()}>
            Reintentar cabecera
          </Button>
        )}
        {!tableLoading && !tableIsError && (
          <Button type="button" variant="ghost" size="sm" onClick={() => refetchDetalles()}>
            Actualizar tabla
          </Button>
        )}
      </div>

      {headerLoading && (
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Loader className="h-5 w-5 animate-spin text-brand-primary" />
          Cargando datos de la lista…
        </div>
      )}

      {headerErrorMessage && (
        <div
          className="mb-6 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
          role="alert"
        >
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>{headerErrorMessage}</div>
        </div>
      )}

      {tableLoading && (
        <div className="flex justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      )}

      {!tableLoading && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Producto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Unidad
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Precio Unitario
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Cantidad Mín.
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Cantidad Máx.
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Descuento Máx.
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {tableErrorMessage ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    {tableErrorMessage}
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    No hay productos en esta lista.
                  </td>
                </tr>
              ) : (
                list.map((row) => (
                  <tr key={row.lista_precio_detalle_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {row.producto_nombre ?? row.producto_id}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {row.unidad_medida_nombre ?? row.unidad_medida_id}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {monedaSimbolo ? `${monedaSimbolo} ` : ''}
                      {prcFormatMoney(row.precio_unitario)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{prcToNumber(row.cantidad_minima)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {row.cantidad_maxima === null || row.cantidad_maxima === undefined ? '-' : prcToNumber(row.cantidad_maxima)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {row.descuento_maximo_porcentaje != null && prcToNumber(row.descuento_maximo_porcentaje) > 0
                        ? `${prcToNumber(row.descuento_maximo_porcentaje)}%`
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {canEditar && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(row)}
                          className="text-brand-primary hover:text-brand-primary/80"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agregar producto a lista</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Producto *</Label>
                <select
                  value={form.producto_id}
                  onChange={(e) => setForm((p) => ({ ...p, producto_id: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  required
                >
                  <option value="">Seleccionar</option>
                  {productos.map((p) => (
                    <option key={p.producto_id} value={p.producto_id}>
                      {p.codigo_sku} - {p.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Unidad de Medida *</Label>
                <select
                  value={form.unidad_medida_id}
                  onChange={(e) => setForm((p) => ({ ...p, unidad_medida_id: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  required
                >
                  <option value="">Seleccionar</option>
                  {unidadesMedida.map((u) => (
                    <option key={u.unidad_medida_id} value={u.unidad_medida_id}>
                      {u.codigo} - {u.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Precio Unitario *</Label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.precio_unitario}
                  onChange={(e) => setForm((p) => ({ ...p, precio_unitario: parseFloat(e.target.value) || 0 }))}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  required
                />
              </div>
              <div>
                <Label>Cantidad Mínima *</Label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.cantidad_minima}
                  onChange={(e) => setForm((p) => ({ ...p, cantidad_minima: parseFloat(e.target.value) || 1 }))}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  required
                />
              </div>
              <div>
                <Label>Cantidad Máxima</Label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.cantidad_maxima ?? ''}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, cantidad_maxima: e.target.value ? parseFloat(e.target.value) : undefined }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
              <div>
                <Label>Descuento Máximo (%)</Label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={form.descuento_maximo_porcentaje ?? ''}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      descuento_maximo_porcentaje: e.target.value ? parseFloat(e.target.value) : undefined,
                    }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
              <div>
                <Label>Vigencia Desde</Label>
                <input
                  type="date"
                  value={form.fecha_vigencia_desde ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, fecha_vigencia_desde: e.target.value || undefined }))}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
              <div>
                <Label>Vigencia Hasta</Label>
                <input
                  type="date"
                  value={form.fecha_vigencia_hasta ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, fecha_vigencia_hasta: e.target.value || undefined }))}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting || !canCrear} className="bg-brand-primary hover:bg-brand-primary-hover text-white">
                Agregar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar detalle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Unidad de Medida</Label>
                <select
                  value={editForm.unidad_medida_id ?? ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, unidad_medida_id: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                >
                  <option value="">Seleccionar</option>
                  {unidadesMedida.map((u) => (
                    <option key={u.unidad_medida_id} value={u.unidad_medida_id}>
                      {u.codigo} - {u.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Precio Unitario</Label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.precio_unitario ?? 0}
                  onChange={(e) => setEditForm((p) => ({ ...p, precio_unitario: parseFloat(e.target.value) || 0 }))}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
              <div>
                <Label>Cantidad Mínima</Label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.cantidad_minima ?? 1}
                  onChange={(e) => setEditForm((p) => ({ ...p, cantidad_minima: parseFloat(e.target.value) || 1 }))}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
              <div>
                <Label>Cantidad Máxima</Label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.cantidad_maxima ?? ''}
                  onChange={(e) =>
                    setEditForm((p) => ({
                      ...p,
                      cantidad_maxima: e.target.value ? parseFloat(e.target.value) : undefined,
                    }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
              <div>
                <Label>Descuento Máximo (%)</Label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={editForm.descuento_maximo_porcentaje ?? ''}
                  onChange={(e) =>
                    setEditForm((p) => ({
                      ...p,
                      descuento_maximo_porcentaje: e.target.value ? parseFloat(e.target.value) : undefined,
                    }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editForm.es_activo ?? false}
                  onChange={(e) => setEditForm((p) => ({ ...p, es_activo: e.target.checked }))}
                  className="rounded"
                />
                <Label>Activo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting || !canEditar} className="bg-brand-primary hover:bg-brand-primary-hover text-white">
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PrcPageLayout>
  );
}
