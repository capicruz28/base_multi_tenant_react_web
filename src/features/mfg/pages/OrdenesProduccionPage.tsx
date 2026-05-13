/**
 * Órdenes de Producción MFG — Listado y gestión. GET/POST/PUT /api/v1/mfg/ordenes-produccion
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, ClipboardList, Plus, Pencil, Eye, Package } from 'lucide-react';
import { empresaService, centroCostoService } from '@/features/org/services/org.service';
import { productoService, unidadMedidaService, almacenService } from '@/features/inv/services/inv.service';
import { listaMaterialesService, rutaFabricacionService } from '../services/mfg.service';
import { ordenProduccionService, ordenProduccionOperacionService, consumoMaterialesService } from '../services/mfg.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { CentroCosto } from '@/features/org/types/org.types';
import type { Producto, UnidadMedida, Almacen } from '@/features/inv/types/inv.types';
import type { ListaMateriales, RutaFabricacion } from '../types/mfg.types';
import type { OrdenProduccion, OrdenProduccionCreate, OrdenProduccionUpdate } from '../types/mfg.types';
import type { OrdenProduccionOperacion, ConsumoMateriales } from '../types/mfg.types';
import { MfgPageLayout } from '../components/MfgPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const ESTADOS_OP = ['borrador', 'liberada', 'en_proceso', 'pausada', 'completada', 'cerrada', 'anulada'] as const;
const TIPOS_ORDEN = ['normal', 'urgente', 'maquila', 'muestra'] as const;

const DEFAULT: OrdenProduccionCreate = {
  empresa_id: '',
  numero_op: '',
  fecha_inicio_programada: '',
  fecha_fin_programada: '',
  producto_id: '',
  bom_id: '',
  cantidad_planeada: 0,
  unidad_medida_id: '',
  prioridad: 3,
  tipo_orden: 'normal',
  estado: 'borrador',
  moneda: 'PEN',
};

export default function OrdenesProduccionPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedida[]>([]);
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [centrosCosto, setCentrosCosto] = useState<CentroCosto[]>([]);
  const [boms, setBoms] = useState<ListaMateriales[]>([]);
  const [rutas, setRutas] = useState<RutaFabricacion[]>([]);
  const [list, setList] = useState<OrdenProduccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<OrdenProduccion | null>(null);
  const [form, setForm] = useState<OrdenProduccionCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<OrdenProduccionUpdate>({});
  const [submitting, setSubmitting] = useState(false);
  const [operacionesOpen, setOperacionesOpen] = useState(false);
  const [consumoOpen, setConsumoOpen] = useState(false);
  const [operacionesLines, setOperacionesLines] = useState<OrdenProduccionOperacion[]>([]);
  const [consumoLines, setConsumoLines] = useState<ConsumoMateriales[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  const loadEmpresas = useCallback(async () => {
    try {
      const data = await empresaService.list({ solo_activos: true });
      setEmpresas(data);
      if (data.length === 1 && !empresaFilter) setEmpresaFilter(data[0].empresa_id);
    } catch {
      setEmpresas([]);
    }
  }, [empresaFilter]);

  const loadProductos = useCallback(async () => {
    try {
      const data = await productoService.list({ solo_activos: true });
      setProductos(Array.isArray(data) ? data : []);
    } catch {
      setProductos([]);
    }
  }, []);

  const loadUnidades = useCallback(async () => {
    try {
      const data = await unidadMedidaService.list({ solo_activos: true });
      setUnidadesMedida(Array.isArray(data) ? data : []);
    } catch {
      setUnidadesMedida([]);
    }
  }, []);

  const loadAlmacenes = useCallback(async () => {
    try {
      const data = await almacenService.list({ solo_activos: true });
      setAlmacenes(Array.isArray(data) ? data : []);
    } catch {
      setAlmacenes([]);
    }
  }, []);

  const loadCentrosCosto = useCallback(async () => {
    if (!empresaFilter) { setCentrosCosto([]); return; }
    try {
      const data = await centroCostoService.list({ empresa_id: empresaFilter, solo_activos: true });
      setCentrosCosto(data);
    } catch {
      setCentrosCosto([]);
    }
  }, [empresaFilter]);

  const loadBoms = useCallback(async () => {
    if (!empresaFilter) { setBoms([]); return; }
    try {
      const data = await listaMaterialesService.list({ empresa_id: empresaFilter, es_bom_activa: true });
      setBoms(data);
    } catch {
      setBoms([]);
    }
  }, [empresaFilter]);

  const loadRutas = useCallback(async () => {
    if (!empresaFilter) { setRutas([]); return; }
    try {
      const data = await rutaFabricacionService.list({ empresa_id: empresaFilter, es_ruta_activa: true });
      setRutas(data);
    } catch {
      setRutas([]);
    }
  }, [empresaFilter]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { empresa_id?: string; estado?: string } = {};
      if (empresaFilter) params.empresa_id = empresaFilter;
      if (estadoFilter) params.estado = estadoFilter;
      const data = await ordenProduccionService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [empresaFilter, estadoFilter]);

  const openOperaciones = useCallback(async (ordenProduccionId: string) => {
    setOperacionesOpen(true);
    setModalLoading(true);
    try {
      const data = await ordenProduccionOperacionService.list({ orden_produccion_id: ordenProduccionId });
      setOperacionesLines(data);
    } catch {
      setOperacionesLines([]);
    } finally {
      setModalLoading(false);
    }
  }, []);

  const openConsumo = useCallback(async (ordenProduccionId: string) => {
    setConsumoOpen(true);
    setModalLoading(true);
    try {
      const data = await consumoMaterialesService.list({ orden_produccion_id: ordenProduccionId });
      setConsumoLines(data);
    } catch {
      setConsumoLines([]);
    } finally {
      setModalLoading(false);
    }
  }, []);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);
  useEffect(() => { loadProductos(); }, [loadProductos]);
  useEffect(() => { loadUnidades(); }, [loadUnidades]);
  useEffect(() => { loadAlmacenes(); }, [loadAlmacenes]);
  useEffect(() => { loadCentrosCosto(); }, [loadCentrosCosto]);
  useEffect(() => { loadBoms(); }, [loadBoms]);
  useEffect(() => { loadRutas(); }, [loadRutas]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    const hoy = new Date().toISOString().slice(0, 10);
    setForm({
      ...DEFAULT,
      empresa_id: (empresaFilter || empresas[0]?.empresa_id) ?? '',
      numero_op: `OP-${Date.now().toString(36).toUpperCase()}`,
      fecha_emision: hoy,
      fecha_inicio_programada: hoy,
      fecha_fin_programada: hoy,
      producto_id: productos[0]?.producto_id ?? '',
      bom_id: boms[0]?.bom_id ?? '',
      ruta_fabricacion_id: rutas[0]?.ruta_id ?? undefined,
      unidad_medida_id: unidadesMedida[0]?.unidad_medida_id ?? '',
      almacen_destino_id: almacenes[0]?.almacen_id ?? undefined,
      centro_costo_id: centrosCosto[0]?.centro_costo_id ?? undefined,
    });
    setCreateOpen(true);
  };

  const openEdit = (row: OrdenProduccion) => {
    setEditing(row);
    setEditForm({
      numero_op: row.numero_op,
      fecha_inicio_programada: row.fecha_inicio_programada,
      fecha_fin_programada: row.fecha_fin_programada,
      cantidad_planeada: row.cantidad_planeada,
      cantidad_producida: row.cantidad_producida ?? undefined,
      cantidad_defectuosa: row.cantidad_defectuosa ?? undefined,
      almacen_destino_id: row.almacen_destino_id ?? undefined,
      prioridad: row.prioridad ?? undefined,
      tipo_orden: row.tipo_orden ?? undefined,
      estado: (row.estado as OrdenProduccionUpdate['estado']) ?? undefined,
      observaciones: row.observaciones ?? undefined,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id || !form.numero_op.trim() || !form.producto_id || !form.bom_id || !form.fecha_inicio_programada || !form.fecha_fin_programada || form.cantidad_planeada <= 0 || !form.unidad_medida_id) {
      toast.error('Completa los campos obligatorios y cantidad planeada.');
      return;
    }
    setSubmitting(true);
    try {
      await ordenProduccionService.create(form);
      toast.success('Orden de producción creada.');
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
      await ordenProduccionService.update(editing.orden_produccion_id, editForm);
      toast.success('Orden de producción actualizada.');
      setEditOpen(false);
      setEditing(null);
      fetchList();
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = 'mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm';
  const selectCls = 'mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm';

  return (
    <MfgPageLayout
      title="Órdenes de Producción"
      description="Órdenes de fabricación: borrador → liberada → en proceso → terminada."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!empresas.length || !productos.length || !boms.length || !unidadesMedida.length}>
          <Plus className="h-4 w-4 mr-2" /> Nueva orden
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
        <div>
          <Label className="mr-2">Estado</Label>
          <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
            <option value="">Todos</option>
            {ESTADOS_OP.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      {loading && <div className="flex justify-center py-12"><Loader className="h-8 w-8 animate-spin text-brand-primary" /></div>}
      {error && !loading && <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">{error}</p>}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nº OP</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Producto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cant. plan.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fechas programadas</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay órdenes de producción.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.orden_produccion_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.numero_op}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.producto_id}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.cantidad_planeada}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.fecha_inicio_programada} — {row.fecha_fin_programada}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.estado ?? '—'}</td>
                    <td className="px-4 py-3 text-center flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openOperaciones(row.orden_produccion_id)} className="text-brand-primary hover:text-brand-primary/80" title="Ver operaciones"><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => openConsumo(row.orden_produccion_id)} className="text-brand-primary hover:text-brand-primary/80" title="Ver consumo"><Package className="h-4 w-4" /></Button>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nueva orden de producción</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
              <div><Label>Nº OP *</Label><input type="text" value={form.numero_op} onChange={(e) => setForm((p) => ({ ...p, numero_op: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Producto *</Label><select value={form.producto_id} onChange={(e) => setForm((p) => ({ ...p, producto_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{productos.map((p) => <option key={p.producto_id} value={p.producto_id}>{p.codigo_sku} – {p.nombre}</option>)}</select></div>
              <div><Label>BOM *</Label><select value={form.bom_id} onChange={(e) => setForm((p) => ({ ...p, bom_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{boms.map((b) => <option key={b.bom_id} value={b.bom_id}>{b.codigo_bom}</option>)}</select></div>
              <div><Label>Ruta fabricación</Label><select value={form.ruta_fabricacion_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, ruta_fabricacion_id: e.target.value || undefined }))} className={selectCls}><option value="">—</option>{rutas.map((r) => <option key={r.ruta_id} value={r.ruta_id}>{r.codigo_ruta} – {r.nombre}</option>)}</select></div>
              <div><Label>Cantidad planeada *</Label><input type="number" step="0.0001" min="0" value={form.cantidad_planeada || ''} onChange={(e) => setForm((p) => ({ ...p, cantidad_planeada: parseFloat(e.target.value) || 0 }))} className={inputCls} required /></div>
              <div><Label>Unidad medida *</Label><select value={form.unidad_medida_id} onChange={(e) => setForm((p) => ({ ...p, unidad_medida_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{unidadesMedida.map((u) => <option key={u.unidad_medida_id} value={u.unidad_medida_id}>{u.codigo}</option>)}</select></div>
              <div><Label>Almacén destino</Label><select value={form.almacen_destino_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, almacen_destino_id: e.target.value || undefined }))} className={selectCls}><option value="">—</option>{almacenes.map((a) => <option key={a.almacen_id} value={a.almacen_id}>{a.nombre}</option>)}</select></div>
              <div><Label>Fecha inicio programada *</Label><input type="date" value={form.fecha_inicio_programada} onChange={(e) => setForm((p) => ({ ...p, fecha_inicio_programada: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Fecha fin programada *</Label><input type="date" value={form.fecha_fin_programada} onChange={(e) => setForm((p) => ({ ...p, fecha_fin_programada: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Prioridad</Label><select value={form.prioridad ?? 3} onChange={(e) => setForm((p) => ({ ...p, prioridad: parseInt(e.target.value, 10) }))} className={selectCls}>{[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
              <div><Label>Tipo orden</Label><select value={form.tipo_orden ?? 'normal'} onChange={(e) => setForm((p) => ({ ...p, tipo_orden: e.target.value }))} className={selectCls}>{TIPOS_ORDEN.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Estado</Label><select value={form.estado ?? 'borrador'} onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value }))} className={selectCls}>{ESTADOS_OP.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar orden de producción</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Nº OP *</Label><input type="text" value={editForm.numero_op ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, numero_op: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Cantidad planeada *</Label><input type="number" step="0.0001" min="0" value={editForm.cantidad_planeada ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, cantidad_planeada: parseFloat(e.target.value) || 0 }))} className={inputCls} required /></div>
              <div><Label>Fecha inicio *</Label><input type="date" value={editForm.fecha_inicio_programada ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_inicio_programada: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Fecha fin *</Label><input type="date" value={editForm.fecha_fin_programada ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_fin_programada: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Estado</Label><select value={editForm.estado ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, estado: e.target.value as OrdenProduccionUpdate['estado'] }))} className={selectCls}>{ESTADOS_OP.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={operacionesOpen} onOpenChange={setOperacionesOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Operaciones de la OP</DialogTitle></DialogHeader>
          {modalLoading && <div className="flex justify-center py-8"><Loader className="h-8 w-8 animate-spin text-brand-primary" /></div>}
          {!modalLoading && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Sec.</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Operación</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Centro</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cant. procesada</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {operacionesLines.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">Sin operaciones.</td></tr>
                  ) : (
                    operacionesLines.map((line) => (
                      <tr key={line.op_operacion_id}>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{line.secuencia}</td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{line.operacion_id}</td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{line.centro_trabajo_id}</td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{line.cantidad_procesada ?? '—'}</td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{line.estado ?? '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={consumoOpen} onOpenChange={setConsumoOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Consumo de materiales</DialogTitle></DialogHeader>
          {modalLoading && <div className="flex justify-center py-8"><Loader className="h-8 w-8 animate-spin text-brand-primary" /></div>}
          {!modalLoading && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Producto</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Planificado</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Consumido</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {consumoLines.length === 0 ? (
                    <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-500">Sin consumo registrado.</td></tr>
                  ) : (
                    consumoLines.map((line) => (
                      <tr key={line.consumo_id}>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{line.producto_id}</td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{line.cantidad_planificada}</td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{line.cantidad_consumida}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MfgPageLayout>
  );
}
