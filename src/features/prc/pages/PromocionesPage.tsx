/**
 * Promociones — React Query + RBAC.
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, Gift, Pencil, Search, Plus, Trash2, RotateCcw } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import { categoriaService } from '@/features/inv/services/inv.service';
import { productoService } from '@/features/inv/services/inv.service';
import { usePermissions } from '@/core/auth/hooks/usePermissions';
import {
  usePromociones,
  useCreatePromocion,
  useUpdatePromocion,
  useDeletePromocion,
  useReactivarPromocion,
} from '../hooks/promociones.hooks';
import type { Empresa } from '@/features/org/types/org.types';
import type { Categoria } from '@/features/inv/types/inv.types';
import type { Producto } from '@/features/inv/types/inv.types';
import type { Promocion, PromocionCreate, PromocionUpdate } from '../types/prc.types';
import { prcFormatMoney, prcToNumber } from '../utils/prc-numeric';
import { PrcPageLayout } from '../components/PrcPageLayout';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const TIPOS_PROMOCION = ['descuento_porcentaje', 'descuento_monto', '2x1', '3x2', 'producto_gratis'] as const;
const APLICA_A = ['producto', 'categoria', 'marca', 'toda_venta'] as const;

const DEFAULT: PromocionCreate = {
  empresa_id: '',
  codigo_promocion: '',
  nombre: '',
  tipo_promocion: 'descuento_porcentaje',
  aplica_a: 'producto',
  fecha_inicio: new Date().toISOString().split('T')[0],
  fecha_fin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  es_combinable: false,
  requiere_codigo_cupon: false,
  es_activo: true,
};

export default function PromocionesPage() {
  const { can } = usePermissions();
  const canCrear = can('prc', 'crear');
  const canEditar = can('prc', 'editar');
  const canEliminar = can('prc', 'eliminar');

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [tipoFilter, setTipoFilter] = useState<string>('');
  const [aplicaAFilter, setAplicaAFilter] = useState<string>('');
  const [productoFilter, setProductoFilter] = useState<string>('');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [soloVigentes, setSoloVigentes] = useState(false);
  const [soloActivas, setSoloActivas] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Promocion | null>(null);
  const [form, setForm] = useState<PromocionCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<PromocionUpdate>({});

  const {
    data: list = [],
    isLoading: loading,
    isError,
    error: queryError,
    refetch,
  } = usePromociones({
    empresa_id: empresaFilter || undefined,
    tipo_promocion: tipoFilter || undefined,
    aplica_a: aplicaAFilter || undefined,
    producto_id: productoFilter || undefined,
    categoria_id: categoriaFilter || undefined,
    buscar: searchTerm.trim() || undefined,
    solo_activos: soloActivas,
    solo_vigentes: soloVigentes,
  });

  const createMutation = useCreatePromocion();
  const updateMutation = useUpdatePromocion();
  const deleteMutation = useDeletePromocion();
  const reactivarMutation = useReactivarPromocion();

  const errorMessage = isError && queryError instanceof Error ? queryError.message : null;

  const loadEmpresas = useCallback(async () => {
    try {
      const data = await empresaService.list({ solo_activos: true });
      setEmpresas(data);
      if (data.length === 1 && !empresaFilter) setEmpresaFilter(data[0].empresa_id);
    } catch {
      setEmpresas([]);
    }
  }, [empresaFilter]);

  const loadCategorias = useCallback(async () => {
    if (!empresaFilter) {
      setCategorias([]);
      return;
    }
    try {
      const data = await categoriaService.list({ empresa_id: empresaFilter, solo_activos: true });
      setCategorias(data);
    } catch {
      setCategorias([]);
    }
  }, [empresaFilter]);

  const loadProductos = useCallback(async () => {
    if (!empresaFilter) {
      setProductos([]);
      return;
    }
    try {
      const data = await productoService.list({ empresa_id: empresaFilter, solo_activos: true });
      setProductos(data);
    } catch {
      setProductos([]);
    }
  }, [empresaFilter]);

  useEffect(() => {
    loadEmpresas();
  }, [loadEmpresas]);
  useEffect(() => {
    loadCategorias();
  }, [loadCategorias]);
  useEffect(() => {
    loadProductos();
  }, [loadProductos]);

  const openCreate = () => {
    setForm({ ...DEFAULT, empresa_id: empresaFilter || (empresas[0]?.empresa_id ?? '') });
    setCreateOpen(true);
  };

  const openEdit = (row: Promocion) => {
    setEditing(row);
    setEditForm({
      codigo_promocion: row.codigo_promocion,
      nombre: row.nombre,
      descripcion: row.descripcion ?? undefined,
      tipo_promocion: row.tipo_promocion,
      aplica_a: row.aplica_a,
      producto_id: row.producto_id ?? undefined,
      categoria_id: row.categoria_id ?? undefined,
      marca: row.marca ?? undefined,
      descuento_porcentaje:
        row.descuento_porcentaje === null || row.descuento_porcentaje === undefined
          ? undefined
          : prcToNumber(row.descuento_porcentaje),
      descuento_monto:
        row.descuento_monto === null || row.descuento_monto === undefined
          ? undefined
          : prcToNumber(row.descuento_monto),
      fecha_inicio: row.fecha_inicio,
      fecha_fin: row.fecha_fin,
      cantidad_maxima_usos: row.cantidad_maxima_usos ?? undefined,
      monto_maximo_descuento:
        row.monto_maximo_descuento === null || row.monto_maximo_descuento === undefined
          ? undefined
          : prcToNumber(row.monto_maximo_descuento),
      es_combinable: row.es_combinable,
      requiere_codigo_cupon: row.requiere_codigo_cupon,
      codigo_cupon: row.codigo_cupon ?? undefined,
      es_activo: row.es_activo,
      observaciones: row.observaciones ?? undefined,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id || !form.codigo_promocion.trim() || !form.nombre.trim()) {
      toast.error('Completa empresa, código y nombre.');
      return;
    }
    if (form.aplica_a === 'producto' && !form.producto_id) {
      toast.error('Selecciona un producto.');
      return;
    }
    if (form.aplica_a === 'categoria' && !form.categoria_id) {
      toast.error('Selecciona una categoría.');
      return;
    }
    if (form.tipo_promocion === 'descuento_porcentaje' && (form.descuento_porcentaje === undefined || form.descuento_porcentaje === null)) {
      toast.error('Ingresa el porcentaje de descuento.');
      return;
    }
    if (form.tipo_promocion === 'descuento_monto' && (form.descuento_monto === undefined || form.descuento_monto === null)) {
      toast.error('Ingresa el monto de descuento.');
      return;
    }
    try {
      await createMutation.mutateAsync(form);
      setCreateOpen(false);
    } catch {
      /* toast en hook */
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await updateMutation.mutateAsync({
        promocionId: editing.promocion_id,
        payload: editForm,
        empresa_id: editing.empresa_id,
      });
      setEditOpen(false);
      setEditing(null);
    } catch {
      /* toast en hook */
    }
  };

  const handleDesactivar = async (row: Promocion) => {
    if (!window.confirm(`¿Desactivar la promoción "${row.nombre}"?`)) return;
    try {
      await deleteMutation.mutateAsync({ promocionId: row.promocion_id, empresa_id: row.empresa_id });
    } catch {
      /* toast en hook */
    }
  };

  const handleReactivar = async (row: Promocion) => {
    if (!window.confirm(`¿Reactivar la promoción "${row.nombre}"?`)) return;
    try {
      await reactivarMutation.mutateAsync({ promocionId: row.promocion_id, empresa_id: row.empresa_id });
    } catch {
      /* toast en hook */
    }
  };

  const submitting =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    reactivarMutation.isPending;

  return (
    <PrcPageLayout
      title="Promociones"
      description="Gestión de promociones: descuentos, 2x1, 3x2, productos gratis, etc."
      action={
        canCrear ? (
          <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white">
            <Plus className="h-4 w-4 mr-2" /> Crear promoción
          </Button>
        ) : undefined
      }
    >
      <div className="mb-4 flex flex-col gap-4">
        <div className="flex flex-col flex-wrap gap-4 lg:flex-row lg:items-end">
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
          <div>
            <Label className="mr-2">Tipo</Label>
            <select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="">Todos</option>
              {TIPOS_PROMOCION.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="mr-2">Aplica a</Label>
            <select
              value={aplicaAFilter}
              onChange={(e) => setAplicaAFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="">Todos</option>
              {APLICA_A.map((a) => (
                <option key={a} value={a}>
                  {a.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[180px]">
            <Label className="mr-2">Producto</Label>
            <select
              value={productoFilter}
              onChange={(e) => setProductoFilter(e.target.value)}
              disabled={!empresaFilter}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm disabled:opacity-50"
            >
              <option value="">Todos</option>
              {productos.map((p) => (
                <option key={p.producto_id} value={p.producto_id}>
                  {p.codigo_sku} — {p.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[180px]">
            <Label className="mr-2">Categoría</Label>
            <select
              value={categoriaFilter}
              onChange={(e) => setCategoriaFilter(e.target.value)}
              disabled={!empresaFilter}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm disabled:opacity-50"
            >
              <option value="">Todas</option>
              {categorias.map((c) => (
                <option key={c.categoria_id} value={c.categoria_id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="solo-vigentes-pr"
              type="checkbox"
              checked={soloVigentes}
              onChange={(e) => setSoloVigentes(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="solo-vigentes-pr">Solo vigentes</Label>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="solo-activas-pr"
              type="checkbox"
              checked={soloActivas}
              onChange={(e) => setSoloActivas(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="solo-activas-pr">Solo activas</Label>
          </div>
          <div className="flex-1 relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por código o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-3 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
            Actualizar
          </Button>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      )}

      {!loading && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Código
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Nombre
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Aplica a
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Descuento
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Vigencia
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Usos
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {errorMessage ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    <Gift className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    {errorMessage}
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    <Gift className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    No hay promociones.
                  </td>
                </tr>
              ) : (
                list.map((row) => (
                  <tr key={row.promocion_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.codigo_promocion}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.nombre}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          row.es_activo
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {row.es_activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      <span className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        {row.tipo_promocion.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.aplica_a}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {prcToNumber(row.descuento_porcentaje) > 0
                        ? `${prcToNumber(row.descuento_porcentaje)}%`
                        : prcToNumber(row.descuento_monto) > 0
                          ? `S/ ${prcFormatMoney(row.descuento_monto)}`
                          : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {row.fecha_inicio} - {row.fecha_fin}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {row.cantidad_usos_actuales} / {row.cantidad_maxima_usos ?? '∞'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1 flex-wrap">
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
                        {canEliminar && row.es_activo && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDesactivar(row)}
                            className="text-red-600 hover:text-red-700"
                            title="Desactivar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        {canEditar && !row.es_activo && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleReactivar(row)}
                            className="text-emerald-600 hover:text-emerald-700"
                            title="Reactivar"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
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
          <DialogHeader>
            <DialogTitle>Crear promoción</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-6">
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
                <Label>Código *</Label>
                <input
                  type="text"
                  value={form.codigo_promocion}
                  onChange={(e) => setForm((p) => ({ ...p, codigo_promocion: e.target.value }))}
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
                <Label>Descripción</Label>
                <textarea
                  value={form.descripcion ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value || undefined }))}
                  rows={3}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
              <div>
                <Label>Tipo Promoción *</Label>
                <select
                  value={form.tipo_promocion}
                  onChange={(e) => setForm((p) => ({ ...p, tipo_promocion: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  required
                >
                  {TIPOS_PROMOCION.map((t) => (
                    <option key={t} value={t}>
                      {t.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Aplica a *</Label>
                <select
                  value={form.aplica_a}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      aplica_a: e.target.value,
                      producto_id: undefined,
                      categoria_id: undefined,
                      marca: undefined,
                    }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  required
                >
                  {APLICA_A.map((a) => (
                    <option key={a} value={a}>
                      {a.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
              {form.aplica_a === 'producto' && (
                <div className="md:col-span-2">
                  <Label>Producto *</Label>
                  <select
                    value={form.producto_id ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, producto_id: e.target.value || undefined }))}
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
              )}
              {form.aplica_a === 'categoria' && (
                <div className="md:col-span-2">
                  <Label>Categoría *</Label>
                  <select
                    value={form.categoria_id ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, categoria_id: e.target.value || undefined }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                    required
                  >
                    <option value="">Seleccionar</option>
                    {categorias.map((c) => (
                      <option key={c.categoria_id} value={c.categoria_id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {form.aplica_a === 'marca' && (
                <div className="md:col-span-2">
                  <Label>Marca *</Label>
                  <input
                    type="text"
                    value={form.marca ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, marca: e.target.value || undefined }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                    required
                  />
                </div>
              )}
              {(form.tipo_promocion === 'descuento_porcentaje' || form.tipo_promocion === 'descuento_monto') && (
                <>
                  {form.tipo_promocion === 'descuento_porcentaje' && (
                    <div>
                      <Label>Descuento (%) *</Label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={form.descuento_porcentaje ?? ''}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            descuento_porcentaje: e.target.value ? parseFloat(e.target.value) : undefined,
                          }))
                        }
                        className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                        required
                      />
                    </div>
                  )}
                  {form.tipo_promocion === 'descuento_monto' && (
                    <div>
                      <Label>Descuento (Monto) *</Label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.descuento_monto ?? ''}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, descuento_monto: e.target.value ? parseFloat(e.target.value) : undefined }))
                        }
                        className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                        required
                      />
                    </div>
                  )}
                  <div>
                    <Label>Monto Máximo Descuento</Label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.monto_maximo_descuento ?? ''}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          monto_maximo_descuento: e.target.value ? parseFloat(e.target.value) : undefined,
                        }))
                      }
                      className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>
                </>
              )}
              <div>
                <Label>Fecha Inicio *</Label>
                <input
                  type="date"
                  value={form.fecha_inicio}
                  onChange={(e) => setForm((p) => ({ ...p, fecha_inicio: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  required
                />
              </div>
              <div>
                <Label>Fecha Fin *</Label>
                <input
                  type="date"
                  value={form.fecha_fin}
                  onChange={(e) => setForm((p) => ({ ...p, fecha_fin: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  required
                />
              </div>
              <div>
                <Label>Cantidad Máxima Usos</Label>
                <input
                  type="number"
                  min="0"
                  value={form.cantidad_maxima_usos ?? ''}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      cantidad_maxima_usos: e.target.value ? parseInt(e.target.value, 10) : undefined,
                    }))
                  }
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.es_combinable}
                  onChange={(e) => setForm((p) => ({ ...p, es_combinable: e.target.checked }))}
                  className="rounded"
                />
                <Label>Es Combinable</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.requiere_codigo_cupon}
                  onChange={(e) => setForm((p) => ({ ...p, requiere_codigo_cupon: e.target.checked }))}
                  className="rounded"
                />
                <Label>Requiere Código Cupón</Label>
              </div>
              {form.requiere_codigo_cupon && (
                <div>
                  <Label>Código Cupón</Label>
                  <input
                    type="text"
                    value={form.codigo_cupon ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, codigo_cupon: e.target.value || undefined }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
              )}
            </div>
            <div>
              <Label>Observaciones</Label>
              <textarea
                value={form.observaciones ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, observaciones: e.target.value || undefined }))}
                rows={2}
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting || !canCrear} className="bg-brand-primary hover:bg-brand-primary-hover text-white">
                Crear
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar promoción</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Código *</Label>
                <input
                  type="text"
                  value={editForm.codigo_promocion ?? ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, codigo_promocion: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  required
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
                <Label>Fecha Inicio</Label>
                <input
                  type="date"
                  value={editForm.fecha_inicio ?? ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, fecha_inicio: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
              <div>
                <Label>Fecha Fin</Label>
                <input
                  type="date"
                  value={editForm.fecha_fin ?? ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, fecha_fin: e.target.value }))}
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
