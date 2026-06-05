/**
 * Listas de Precio — Listado y gestión. React Query + RBAC.
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, Tag, Pencil, Search, Eye, Plus, Trash2, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toAppPath } from '@/core/routing/post-login-path';
import { empresaService } from '@/features/org/services/org.service';
import { usePermissions } from '@/core/auth/hooks/usePermissions';
import {
  useListasPrecio,
  useCreateListaPrecio,
  useUpdateListaPrecio,
  useDeleteListaPrecio,
  useReactivarListaPrecio,
} from '../hooks/listas-precio.hooks';
import type { Empresa } from '@/features/org/types/org.types';
import type { ListaPrecio, ListaPrecioCreate, ListaPrecioUpdate } from '../types/prc.types';
import type { CatMoneda } from '@/types/catalogos.types';
import { catalogosService } from '@/core/services/catalogos.service';
import { prcToNumber } from '../utils/prc-numeric';
import { PrcPageLayout } from '../components/PrcPageLayout';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const TIPOS_LISTA = ['general', 'mayorista', 'minorista', 'distribuidor', 'corporativo'] as const;

const DEFAULT: ListaPrecioCreate = {
  empresa_id: '',
  codigo_lista: '',
  nombre: '',
  tipo_lista: 'general',
  moneda_id: '',
  fecha_vigencia_desde: new Date().toISOString().split('T')[0],
  incluye_igv: true,
  permite_descuentos: true,
  descuento_maximo_porcentaje: 0,
  es_lista_defecto: false,
  es_activo: true,
};

export default function ListasPrecioPage() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const canCrear = can('prc', 'crear');
  const canEditar = can('prc', 'editar');
  const canEliminar = can('prc', 'eliminar');

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [monedas, setMonedas] = useState<CatMoneda[]>([]);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [tipoFilter, setTipoFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [soloVigentes, setSoloVigentes] = useState(false);
  const [soloActivas, setSoloActivas] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ListaPrecio | null>(null);
  const [form, setForm] = useState<ListaPrecioCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<ListaPrecioUpdate>({});

  const {
    data: list = [],
    isLoading: loading,
    isError,
    error: queryError,
    refetch,
  } = useListasPrecio({
    empresa_id: empresaFilter || undefined,
    tipo_lista: tipoFilter || undefined,
    buscar: searchTerm.trim() || undefined,
    solo_activos: soloActivas,
    solo_vigentes: soloVigentes,
  });

  const createMutation = useCreateListaPrecio();
  const updateMutation = useUpdateListaPrecio();
  const deleteMutation = useDeleteListaPrecio();
  const reactivarMutation = useReactivarListaPrecio();

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

  const loadMonedas = useCallback(async () => {
    try {
      const data = await catalogosService.listMonedas({ solo_activos: true });
      setMonedas(Array.isArray(data) ? data : []);
    } catch {
      setMonedas([]);
    }
  }, []);

  useEffect(() => {
    loadEmpresas();
  }, [loadEmpresas]);
  useEffect(() => {
    loadMonedas();
  }, [loadMonedas]);

  const monedaLabel = (monedaId: string) =>
    monedas.find((m) => m.moneda_id === monedaId)?.codigo ?? monedaId.slice(0, 8);

  const openCreate = () => {
    const firstMoneda = monedas[0]?.moneda_id ?? '';
    setForm({
      ...DEFAULT,
      empresa_id: empresaFilter || (empresas[0]?.empresa_id ?? ''),
      moneda_id: firstMoneda,
    });
    setCreateOpen(true);
  };

  const openEdit = (row: ListaPrecio) => {
    setEditing(row);
    setEditForm({
      codigo_lista: row.codigo_lista,
      nombre: row.nombre,
      descripcion: row.descripcion ?? undefined,
      tipo_lista: row.tipo_lista ?? 'general',
      moneda_id: row.moneda_id,
      fecha_vigencia_desde: row.fecha_vigencia_desde,
      fecha_vigencia_hasta: row.fecha_vigencia_hasta ?? undefined,
      incluye_igv: row.incluye_igv,
      permite_descuentos: row.permite_descuentos,
      descuento_maximo_porcentaje: prcToNumber(row.descuento_maximo_porcentaje),
      es_lista_defecto: row.es_lista_defecto,
      es_activo: row.es_activo,
      observaciones: row.observaciones ?? undefined,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id || !form.codigo_lista.trim() || !form.nombre.trim() || !form.moneda_id) {
      toast.error('Completa empresa, código, nombre y moneda.');
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
        listaPrecioId: editing.lista_precio_id,
        payload: editForm,
        empresa_id: editing.empresa_id,
      });
      setEditOpen(false);
      setEditing(null);
    } catch {
      /* toast en hook */
    }
  };

  const handleDesactivar = async (row: ListaPrecio) => {
    if (!window.confirm(`¿Desactivar la lista "${row.nombre}"?`)) return;
    try {
      await deleteMutation.mutateAsync({
        listaPrecioId: row.lista_precio_id,
        empresa_id: row.empresa_id,
      });
    } catch {
      /* toast en hook */
    }
  };

  const handleReactivar = async (row: ListaPrecio) => {
    if (!window.confirm(`¿Reactivar la lista "${row.nombre}"?`)) return;
    try {
      await reactivarMutation.mutateAsync({
        listaPrecioId: row.lista_precio_id,
        empresa_id: row.empresa_id,
      });
    } catch {
      /* toast en hook */
    }
  };

  const submitting =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || reactivarMutation.isPending;

  return (
    <PrcPageLayout
      title="Listas de Precio"
      description="Gestión de listas de precios por tipo de cliente (mayorista, minorista, distribuidor, etc.)."
      action={
        canCrear ? (
          <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white">
            <Plus className="h-4 w-4 mr-2" /> Crear lista
          </Button>
        ) : undefined
      }
    >
      <div className="mb-4 flex flex-col flex-wrap gap-4 lg:flex-row lg:items-end">
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
            {TIPOS_LISTA.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="solo-vigentes-lp"
            type="checkbox"
            checked={soloVigentes}
            onChange={(e) => setSoloVigentes(e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="solo-vigentes-lp">Solo vigentes</Label>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="solo-activas-lp"
            type="checkbox"
            checked={soloActivas}
            onChange={(e) => setSoloActivas(e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="solo-activas-lp">Solo activas</Label>
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
                  Moneda
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Vigencia
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Desc. Máx.
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {errorMessage ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    <Tag className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    {errorMessage}
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    <Tag className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    No hay listas de precio.
                  </td>
                </tr>
              ) : (
                list.map((row) => (
                  <tr key={row.lista_precio_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.codigo_lista}</td>
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
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          row.tipo_lista === 'mayorista'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : row.tipo_lista === 'minorista'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}
                      >
                        {row.tipo_lista ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{monedaLabel(row.moneda_id)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {row.fecha_vigencia_desde} {row.fecha_vigencia_hasta ? `- ${row.fecha_vigencia_hasta}` : ''}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {row.permite_descuentos ? `${prcToNumber(row.descuento_maximo_porcentaje)}%` : 'No'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(toAppPath(`/prc/listas-precio/${row.lista_precio_id}/detalles`))}
                          className="text-brand-primary hover:text-brand-primary/80"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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
            <DialogTitle>Crear lista de precio</DialogTitle>
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
                  value={form.codigo_lista}
                  onChange={(e) => setForm((p) => ({ ...p, codigo_lista: e.target.value }))}
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
                <Label>Tipo Lista *</Label>
                <select
                  value={form.tipo_lista ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, tipo_lista: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  required
                >
                  {TIPOS_LISTA.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Moneda *</Label>
                <select
                  value={form.moneda_id}
                  onChange={(e) => setForm((p) => ({ ...p, moneda_id: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  required
                >
                  <option value="">Seleccionar</option>
                  {monedas.map((m) => (
                    <option key={m.moneda_id} value={m.moneda_id}>
                      {m.codigo} — {m.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Fecha Vigencia Desde *</Label>
                <input
                  type="date"
                  value={form.fecha_vigencia_desde}
                  onChange={(e) => setForm((p) => ({ ...p, fecha_vigencia_desde: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  required
                />
              </div>
              <div>
                <Label>Fecha Vigencia Hasta</Label>
                <input
                  type="date"
                  value={form.fecha_vigencia_hasta ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, fecha_vigencia_hasta: e.target.value || undefined }))}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
            </div>
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Configuración de Precios</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.incluye_igv}
                    onChange={(e) => setForm((p) => ({ ...p, incluye_igv: e.target.checked }))}
                    className="rounded"
                  />
                  <Label>Incluye IGV</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.permite_descuentos}
                    onChange={(e) => setForm((p) => ({ ...p, permite_descuentos: e.target.checked }))}
                    className="rounded"
                  />
                  <Label>Permite Descuentos</Label>
                </div>
                <div>
                  <Label>Descuento Máximo (%)</Label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={form.descuento_maximo_porcentaje}
                    onChange={(e) => setForm((p) => ({ ...p, descuento_maximo_porcentaje: parseFloat(e.target.value) || 0 }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.es_lista_defecto}
                    onChange={(e) => setForm((p) => ({ ...p, es_lista_defecto: e.target.checked }))}
                    className="rounded"
                  />
                  <Label>Lista por Defecto</Label>
                </div>
              </div>
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
            <DialogTitle>Editar lista de precio</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Código *</Label>
                <input
                  type="text"
                  value={editForm.codigo_lista ?? ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, codigo_lista: e.target.value }))}
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
                <Label>Descripción</Label>
                <textarea
                  value={editForm.descripcion ?? ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, descripcion: e.target.value || undefined }))}
                  rows={3}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
              <div>
                <Label>Tipo Lista</Label>
                <select
                  value={editForm.tipo_lista ?? 'general'}
                  onChange={(e) => setEditForm((p) => ({ ...p, tipo_lista: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                >
                  {TIPOS_LISTA.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Moneda</Label>
                <select
                  value={editForm.moneda_id ?? ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, moneda_id: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                >
                  <option value="">—</option>
                  {monedas.map((m) => (
                    <option key={m.moneda_id} value={m.moneda_id}>
                      {m.codigo} — {m.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Fecha Vigencia Desde</Label>
                <input
                  type="date"
                  value={editForm.fecha_vigencia_desde ?? ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, fecha_vigencia_desde: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
              <div>
                <Label>Fecha Vigencia Hasta</Label>
                <input
                  type="date"
                  value={editForm.fecha_vigencia_hasta ?? ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, fecha_vigencia_hasta: e.target.value || undefined }))}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
            </div>
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Configuración de Precios</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editForm.incluye_igv ?? false}
                    onChange={(e) => setEditForm((p) => ({ ...p, incluye_igv: e.target.checked }))}
                    className="rounded"
                  />
                  <Label>Incluye IGV</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editForm.permite_descuentos ?? false}
                    onChange={(e) => setEditForm((p) => ({ ...p, permite_descuentos: e.target.checked }))}
                    className="rounded"
                  />
                  <Label>Permite Descuentos</Label>
                </div>
                <div>
                  <Label>Descuento Máximo (%)</Label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={editForm.descuento_maximo_porcentaje ?? 0}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, descuento_maximo_porcentaje: parseFloat(e.target.value) || 0 }))
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editForm.es_lista_defecto ?? false}
                    onChange={(e) => setEditForm((p) => ({ ...p, es_lista_defecto: e.target.checked }))}
                    className="rounded"
                  />
                  <Label>Lista por Defecto</Label>
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
            </div>
            <div>
              <Label>Observaciones</Label>
              <textarea
                value={editForm.observaciones ?? ''}
                onChange={(e) => setEditForm((p) => ({ ...p, observaciones: e.target.value || undefined }))}
                rows={2}
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
              />
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
