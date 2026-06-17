/**
 * Productos — Listado y gestión completa. GET/POST /api/v1/inv/productos
 * Implementación centrada en los campos más importantes del catálogo.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Package, Plus, Pencil, Trash2, RotateCcw, Ruler } from 'lucide-react';
import { IamTableEmptyState } from '@/features/admin/components/iam';
import { useDebouncedSearch } from '@/core/list';
import { ErpPagination, ErpSortableHeader } from '@/shared/components/erp-list';
import { OrgCompanyToolbar } from '@/features/org/components/OrgCompanyToolbar';
import { OrgToolbarSearch } from '@/features/org/components/OrgToolbarSearch';
import { toAppPath } from '@/core/routing/post-login-path';
import { catalogosService } from '@/core/services/catalogos.service';
import type { Categoria, UnidadMedida, Producto, ProductoCreate, ProductoUpdate } from '../types/inv.types';
import type { CatMoneda } from '@/types/catalogos.types';
import { InvPageLayout } from '../components/InvPageLayout';
import { InvTableSkeleton } from '../components/InvTableSkeleton';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import {
  Dialog,
  DialogContent,
  DialogBody,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';
import { usePermissions } from '@/core/auth/hooks/usePermissions';
import { useCategorias } from '../hooks/categorias.hooks';
import { useUnidadesMedida } from '../hooks/unidades-medida.hooks';
import { useCreateProducto, useDeleteProducto, useProductosErpList, useReactivarProducto, useUpdateProducto, PRODUCTOS_LIST_CONFIG } from '../hooks/productos.hooks';
import { useInvSessionScope, useInvScopeEmpresaReset } from '../hooks/useInvSessionScope';
import { OrgSessionEmpresaField } from '@/features/org/components/OrgSessionEmpresaField';
import { assertBodyEmpresaMatchesSession } from '@/features/org/utils/org-body-scope';
import { OrgDiscardConfirmDialog } from '@/features/org/components/OrgDiscardConfirmDialog';
import type { OrgDiscardPending } from '@/features/org/types/org-discard.types';
import { createOrgDiscardHandlers } from '@/features/org/utils/org-discard-handlers';
import { useOrgModalCreateDirty } from '@/features/org/hooks/useOrgModalCreateDirty';
import { orgDialogGuardProps } from '@/features/org/utils/org-dialog-guard-props';
import {
  buildCreateProductoFormSnapshot,
  buildEditProductoFormSnapshot,
  isEditProductoDirty,
  type EditProductoFormSnapshot,
  type ProductoCreateFormSnapshot,
} from '../utils/form-dirty/producto-form-dirty';

const TIPOS_PRODUCTO = ['bien', 'servicio', 'materia_prima', 'producto_terminado', 'semi_elaborado', 'insumo'] as const;
const METODOS_COSTEO = ['promedio', 'fifo', 'lifo', 'estandar'] as const;

const MSG_SIN_UM_ACTIVAS =
  'Debe registrar al menos una Unidad de Medida activa antes de crear productos.';
const TOOLTIP_CREAR_SIN_UM =
  'Debe crear al menos una Unidad de Medida activa para registrar productos.';
const RUTA_UNIDADES_MEDIDA = '/inv/unidades-medida';

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
  const { scopeEmpresaId, canQueryCompanyScoped } = useInvSessionScope();
  const search = useDebouncedSearch();
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Producto | null>(null);
  const [form, setForm] = useState<ProductoCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<ProductoUpdate>({});
  const [editFormSnapshot, setEditFormSnapshot] = useState<EditProductoFormSnapshot | null>(null);
  const [discardPending, setDiscardPending] = useState<OrgDiscardPending>(null);
  const [monedas, setMonedas] = useState<CatMoneda[]>([]);
  const [bajaTarget, setBajaTarget] = useState<Producto | null>(null);
  const [reactivarTarget, setReactivarTarget] = useState<Producto | null>(null);

  const productosList = useProductosErpList({
    solo_activos: !mostrarInactivos,
    debouncedBuscar: search.debouncedValue || undefined,
  });

  const resetPageFilters = useCallback(() => {
    search.clear();
    productosList.setPage(1);
    productosList.clearSort();
    setMostrarInactivos(false);
    setCreateOpen(false);
    setEditOpen(false);
    setEditing(null);
    setEditFormSnapshot(null);
    setDiscardPending(null);
  }, [search.clear, productosList.setPage, productosList.clearSort]);

  useInvScopeEmpresaReset(resetPageFilters);

  const categoriasQuery = useCategorias({
    solo_activos: true,
  });
  const unidadesQuery = useUnidadesMedida({
    solo_activos: true,
  });

  const list = productosList.items;
  const categorias = (categoriasQuery.data ?? []) as Categoria[];
  const unidadesMedida = (unidadesQuery.data ?? []) as UnidadMedida[];
  /** REG-005: no deshabilitar Crear mientras la query de UM está cargando (data undefined → length 0). */
  const sinUnidadesMedidaEnSesion =
    unidadesQuery.isSuccess && unidadesMedida.length === 0;

  const createMutation = useCreateProducto();
  const updateMutation = useUpdateProducto();
  const deleteMutation = useDeleteProducto();
  const reactivarMutation = useReactivarProducto();
  const submitting =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || reactivarMutation.isPending;
  const formSubmitting = createMutation.isPending || updateMutation.isPending;

  const buildDefaultCreateForm = useCallback((): ProductoCreate => {
    const defaultMonedaId = monedas[0]?.moneda_id ?? '';
    return {
      ...DEFAULT,
      empresa_id: scopeEmpresaId ?? '',
      moneda_costo: defaultMonedaId,
      moneda_venta: defaultMonedaId,
    };
  }, [monedas, scopeEmpresaId]);

  const { syncCreateBaseline, isCreateDirty } = useOrgModalCreateDirty<
    ProductoCreate,
    ProductoCreateFormSnapshot
  >({
    normalize: buildCreateProductoFormSnapshot,
    getInitialForm: () => DEFAULT,
  });

  const isCreateDialogDirty = useMemo(() => isCreateDirty(form), [form, isCreateDirty]);
  const isEditDialogDirty = useMemo(
    () => isEditProductoDirty(editForm, editFormSnapshot),
    [editForm, editFormSnapshot],
  );

  const closeCreate = useCallback(() => {
    if (!formSubmitting) {
      setCreateOpen(false);
      const nextForm = buildDefaultCreateForm();
      setForm(nextForm);
      syncCreateBaseline(nextForm);
      setDiscardPending((pending) => (pending === 'create' ? null : pending));
    }
  }, [formSubmitting, buildDefaultCreateForm, syncCreateBaseline]);

  const closeEdit = useCallback(() => {
    if (!formSubmitting) {
      setEditOpen(false);
      setEditing(null);
      setEditForm({});
      setEditFormSnapshot(null);
      setDiscardPending((pending) => (pending === 'edit' ? null : pending));
    }
  }, [formSubmitting]);

  const {
    handleRequestCloseCreate,
    handleRequestCloseEdit,
    handleDiscardCancel,
    handleDiscardConfirm,
    handleCreateDialogOpenChange,
    handleEditDialogOpenChange,
  } = useMemo(
    () =>
      createOrgDiscardHandlers({
        discardPending,
        setDiscardPending,
        isSubmitting: formSubmitting,
        isCreateDirty: isCreateDialogDirty,
        isEditDirty: isEditDialogDirty,
        setCreateOpen,
        setEditOpen,
        closeCreate,
        closeEdit,
        contextPrefix: 'inv-producto',
      }),
    [
      discardPending,
      formSubmitting,
      isCreateDialogDirty,
      isEditDialogDirty,
      closeCreate,
      closeEdit,
    ],
  );

  useEffect(() => {
    catalogosService
      .listMonedas({ solo_activos: true })
      .then(setMonedas)
      .catch(() => setMonedas([]));
  }, []);

  const openCreate = () => {
    setDiscardPending(null);
    const nextForm = buildDefaultCreateForm();
    setForm(nextForm);
    syncCreateBaseline(nextForm);
    setCreateOpen(true);
  };
  const openEdit = (row: Producto) => {
    setDiscardPending(null);
    setEditing(row);
    const nextEditForm: ProductoUpdate = {
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
    };
    setEditForm(nextEditForm);
    setEditFormSnapshot(buildEditProductoFormSnapshot(nextEditForm));
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scopeEmpresaId || !form.codigo_sku.trim() || !form.nombre.trim() || !form.tipo_producto || !form.unidad_medida_base_id) {
      toast.error('Empresa activa, SKU, nombre, tipo y unidad de medida son requeridos.');
      return;
    }
    try {
      await createMutation.mutateAsync(
        assertBodyEmpresaMatchesSession({ ...form }, scopeEmpresaId),
      );
      closeCreate();
    } catch {
      /* error vía useCreateProducto.onError */
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await updateMutation.mutateAsync({ productoId: editing.producto_id, payload: editForm });
      closeEdit();
    } catch {
      /* error vía useUpdateProducto.onError */
    }
  };

  const categoriaNombre = (id: string | null | undefined) =>
    id ? categorias.find((c) => c.categoria_id === id)?.nombre ?? '—' : '—';
  const canCrear = can('inv', 'crear');
  const canEditar = can('inv', 'editar');
  const canEliminar = can('inv', 'eliminar');

  const eliminar = (row: Producto) => {
    if (!canEliminar) return;
    setBajaTarget(row);
  };

  const reactivar = (row: Producto) => {
    if (!canEditar) return;
    setReactivarTarget(row);
  };

  const confirmarBaja = async () => {
    if (!bajaTarget) return;
    try {
      await deleteMutation.mutateAsync({ productoId: bajaTarget.producto_id });
      setBajaTarget(null);
    } catch {
      /* error vía useDeleteProducto.onError */
    }
  };

  const confirmarReactivar = async () => {
    if (!reactivarTarget) return;
    try {
      await reactivarMutation.mutateAsync({ productoId: reactivarTarget.producto_id });
      setReactivarTarget(null);
    } catch {
      /* error vía useReactivarProducto.onError */
    }
  };

  const mostrarAvisoSinUm =
    Boolean(scopeEmpresaId) && canQueryCompanyScoped && sinUnidadesMedidaEnSesion;
  const crearProductoDeshabilitado =
    !scopeEmpresaId || !canQueryCompanyScoped || sinUnidadesMedidaEnSesion || discardPending !== null;
  const hasSearch = search.hasSearch;
  const TABLE_COLSPAN = 7;

  return (
    <InvPageLayout>
      {mostrarAvisoSinUm && (
        <div
          className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border border-brand-primary/30 bg-brand-primary/10"
          role="status"
        >
          <div className="flex items-start gap-2 min-w-0 flex-1">
            <Ruler className="h-5 w-5 shrink-0 text-brand-primary mt-0.5" aria-hidden />
            <p className="text-sm text-text-base">{MSG_SIN_UM_ACTIVAS}</p>
          </div>
          <Button variant="outline" size="sm" asChild className="shrink-0 border-border-base">
            <Link to={toAppPath(RUTA_UNIDADES_MEDIDA)}>Ir a Unidades de Medida</Link>
          </Button>
        </div>
      )}
      <OrgCompanyToolbar
        actions={
          canCrear ? (
            <span
              className="inline-flex"
              title={sinUnidadesMedidaEnSesion ? TOOLTIP_CREAR_SIN_UM : undefined}
            >
              <Button
                onClick={openCreate}
                disabled={crearProductoDeshabilitado}
                className="bg-brand-primary hover:bg-brand-primary-hover text-white disabled:opacity-50"
              >
                <Plus className="h-4 w-4 mr-2" /> Crear producto
              </Button>
            </span>
          ) : null
        }
      >
        <OrgToolbarSearch
          value={search.inputValue}
          onChange={search.setInputValue}
          placeholder="SKU, nombre, código de barras…"
          aria-label="Buscar productos"
          disabled={discardPending !== null}
        />
        <label className="flex shrink-0 items-center gap-1.5 text-sm text-text-soft cursor-pointer select-none">
          <input
            type="checkbox"
            checked={mostrarInactivos}
            onChange={(e) => setMostrarInactivos(e.target.checked)}
            className="rounded border border-border-base"
          />
          Ver inactivos
        </label>
      </OrgCompanyToolbar>
      {productosList.isLoading && <InvTableSkeleton columns={TABLE_COLSPAN} />}
      {productosList.isError && !productosList.isLoading && (
        <p className="text-error bg-error/10 p-4 rounded-lg">
          {getErrorMessage(productosList.error).message}
        </p>
      )}
      {!productosList.isLoading && !productosList.isError && (
        <div className="overflow-x-auto rounded-lg border border-border-base shadow">
          <table className="min-w-full divide-y divide-border-base">
            <thead className="bg-subtle">
              <tr>
                <ErpSortableHeader
                  column="codigo_sku"
                  label="SKU"
                  sortableColumns={PRODUCTOS_LIST_CONFIG.sortableColumns}
                  sort={productosList.sort}
                  onSort={productosList.toggleSort}
                />
                <ErpSortableHeader
                  column="nombre"
                  label="Nombre"
                  sortableColumns={PRODUCTOS_LIST_CONFIG.sortableColumns}
                  sort={productosList.sort}
                  onSort={productosList.toggleSort}
                />
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Categoría</th>
                <ErpSortableHeader
                  column="tipo_producto"
                  label="Tipo"
                  sortableColumns={PRODUCTOS_LIST_CONFIG.sortableColumns}
                  sort={productosList.sort}
                  onSort={productosList.toggleSort}
                />
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Precio</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-text-soft uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border-base">
              {list.length === 0 ? (
                <IamTableEmptyState
                  colSpan={TABLE_COLSPAN}
                  icon={Package}
                  title={
                    hasSearch
                      ? 'No se encontraron productos que coincidan con la búsqueda.'
                      : mostrarInactivos
                        ? 'No hay productos registrados.'
                        : 'No hay productos activos.'
                  }
                  description={
                    hasSearch ? 'Pruebe con otro término o limpie el filtro de búsqueda.' : undefined
                  }
                  actionLabel={
                    !hasSearch && !mostrarInactivos && canCrear && scopeEmpresaId && !sinUnidadesMedidaEnSesion
                      ? 'Crear producto'
                      : undefined
                  }
                  onAction={
                    !hasSearch && !mostrarInactivos && canCrear && scopeEmpresaId && !sinUnidadesMedidaEnSesion
                      ? openCreate
                      : undefined
                  }
                  actionDisabled={discardPending !== null}
                />
              ) : (
                list.map((row) => (
                  <tr key={row.producto_id} className="hover:bg-overlay dark:hover:bg-overlay">
                    <td className="px-4 py-3 text-sm font-medium text-text-base">{row.codigo_sku}</td>
                    <td className="px-4 py-3 text-sm text-text-base">{row.nombre}</td>
                    <td className="px-4 py-3 text-sm text-text-base">{categoriaNombre(row.categoria_id)}</td>
                    <td className="px-4 py-3 text-sm text-text-base">{row.tipo_producto}</td>
                    <td className="px-4 py-3 text-sm text-text-base">{row.precio_base_venta ? `S/ ${row.precio_base_venta.toFixed(2)}` : '-'}</td>
                    <td className="px-4 py-3 text-center">
                      {row.es_activo ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-error/10 text-error">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 flex items-center justify-center gap-1">
                      {row.es_activo ? (
                        <>
                          {canEditar && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(row)}
                              disabled={discardPending !== null}
                              className="text-brand-primary hover:text-brand-primary/80"
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canEliminar && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => eliminar(row)}
                              disabled={submitting || discardPending !== null}
                              className="text-error hover:text-error hover:bg-error/10"
                              title="Desactivar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      ) : (
                        canEditar && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => reactivar(row)}
                            disabled={submitting || discardPending !== null}
                            className="text-success hover:text-success/80"
                            title="Reactivar"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {productosList.pagination ? (
            <ErpPagination
              pagination={productosList.pagination}
              onPageChange={productosList.setPage}
              onLimitChange={productosList.setLimit}
              disabled={discardPending !== null || productosList.isFetching}
            />
          ) : null}
        </div>
      )}
      <OrgDiscardConfirmDialog
        discardPending={discardPending}
        entityLabel="el producto"
        onClose={handleDiscardCancel}
        onConfirm={handleDiscardConfirm}
      />
      <Dialog open={createOpen} onOpenChange={handleCreateDialogOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col gap-0 p-0" {...orgDialogGuardProps}>
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0"><DialogTitle>Crear producto</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col min-h-0 flex-1">
            <DialogBody className="px-6 pb-2 space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Información General</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <OrgSessionEmpresaField />
                <div>
                  <Label>SKU *</Label>
                  <input
                    type="text"
                    value={form.codigo_sku}
                    onChange={(e) => setForm((p) => ({ ...p, codigo_sku: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm uppercase"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Nombre *</Label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
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
                    className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm uppercase"
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
                    className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm uppercase"
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
                    className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm uppercase"
                  />
                </div>
                <div>
                  <Label>Categoría</Label>
                  <select
                    value={form.categoria_id ?? ''}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, categoria_id: e.target.value || undefined }))
                    }
                    className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
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
                    className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
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
                    className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
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
                    className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
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
                    className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
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
                    className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
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
                    className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
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
                    className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
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
                    className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
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
                    className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
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
                    className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
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
                    className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
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
                    className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
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
                    className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
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
                    className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
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
                    className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
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
                    className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
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
                    className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm uppercase"
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
                    className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
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
                    className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
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
                    className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
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
                    className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
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
                    className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
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
                    className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
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
                    className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
                  />
                </div>
              </div>
            </div>
            </DialogBody>
            <DialogFooter className="px-6 py-4 flex-shrink-0 border-t border-border-base">
              <Button type="button" variant="outline" onClick={handleRequestCloseCreate}>Cancelar</Button>
              <Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={handleEditDialogOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col gap-0 p-0" {...orgDialogGuardProps}>
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0"><DialogTitle>Editar producto</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="flex flex-col min-h-0 flex-1">
            <DialogBody className="px-6 pb-2 space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Información General</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>SKU *</Label>
                  <input
                    type="text"
                    value={editForm.codigo_sku ?? ''}
                    onChange={(e) => setEditForm((p) => ({ ...p, codigo_sku: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm uppercase"
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
                    className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm uppercase"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Nombre *</Label>
                  <input
                    type="text"
                    value={editForm.nombre ?? ''}
                    onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
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
                    className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
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
                    className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
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
                    className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
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
                    className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
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
                    className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
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
                    className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
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
                    className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
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
                    className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
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
                    className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
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
                    className="mt-1 w-full px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
                  />
                </div>
              </div>
            </div>
            </DialogBody>
            <DialogFooter className="px-6 py-4 flex-shrink-0 border-t border-border-base">
              <Button type="button" variant="outline" onClick={handleRequestCloseEdit}>Cancelar</Button>
              <Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={!!bajaTarget && discardPending === null}
        onClose={() => setBajaTarget(null)}
        onConfirm={() => void confirmarBaja()}
        title="Desactivar producto"
        message={bajaTarget ? `¿Desactivar producto '${bajaTarget.nombre}'? Podrá reactivarlo después.` : ''}
        confirmText="Desactivar"
        cancelText="Cancelar"
        variant="danger"
        loading={deleteMutation.isPending}
      />

      <ConfirmDialog
        isOpen={!!reactivarTarget && discardPending === null}
        onClose={() => setReactivarTarget(null)}
        onConfirm={() => void confirmarReactivar()}
        title="Reactivar producto"
        message={reactivarTarget ? `¿Reactivar producto '${reactivarTarget.nombre}'? Volverá a estar disponible.` : ''}
        confirmText="Reactivar"
        cancelText="Cancelar"
        variant="info"
        loading={reactivarMutation.isPending}
      />
    </InvPageLayout>
  );
}
