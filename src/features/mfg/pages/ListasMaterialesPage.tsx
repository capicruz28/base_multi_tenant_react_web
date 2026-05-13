/**
 * Listas de Materiales (BOM) MFG — Listado y gestión. GET/POST/PUT /api/v1/mfg/listas-materiales
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, List, Plus, Pencil, Search, Eye } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import { productoService, unidadMedidaService } from '@/features/inv/services/inv.service';
import { listaMaterialesService, listaMaterialesDetalleService } from '../services/mfg.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { Producto, UnidadMedida } from '@/features/inv/types/inv.types';
import type { ListaMateriales, ListaMaterialesCreate, ListaMaterialesUpdate } from '../types/mfg.types';
import type { ListaMaterialesDetalle } from '../types/mfg.types';
import { MfgPageLayout } from '../components/MfgPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const TIPOS_BOM = ['produccion', 'ingenieria', 'costeo'] as const;
const ESTADOS_BOM = ['borrador', 'aprobada', 'obsoleta'] as const;

const DEFAULT: ListaMaterialesCreate = {
  empresa_id: '',
  codigo_bom: '',
  producto_id: '',
  fecha_vigencia_desde: '',
  cantidad_base: 1,
  unidad_medida_id: '',
  tipo_bom: 'produccion',
  es_bom_activa: true,
  estado: 'borrador',
};

export default function ListasMaterialesPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedida[]>([]);
  const [list, setList] = useState<ListaMateriales[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ListaMateriales | null>(null);
  const [form, setForm] = useState<ListaMaterialesCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<ListaMaterialesUpdate>({});
  const [submitting, setSubmitting] = useState(false);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [detalleLines, setDetalleLines] = useState<ListaMaterialesDetalle[]>([]);
  const [detalleLoading, setDetalleLoading] = useState(false);

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

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { empresa_id?: string; estado?: string; buscar?: string } = {};
      if (empresaFilter) params.empresa_id = empresaFilter;
      if (estadoFilter) params.estado = estadoFilter;
      if (searchTerm.trim()) params.buscar = searchTerm.trim();
      const data = await listaMaterialesService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [empresaFilter, estadoFilter, searchTerm]);

  const loadDetalle = useCallback(async (bomId: string) => {
    setDetalleOpen(true);
    setDetalleLoading(true);
    try {
      const data = await listaMaterialesDetalleService.list({ bom_id: bomId });
      setDetalleLines(data);
    } catch {
      setDetalleLines([]);
    } finally {
      setDetalleLoading(false);
    }
  }, []);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);
  useEffect(() => { loadProductos(); }, [loadProductos]);
  useEffect(() => { loadUnidades(); }, [loadUnidades]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    setForm({
      ...DEFAULT,
      empresa_id: (empresaFilter || empresas[0]?.empresa_id) ?? '',
      unidad_medida_id: unidadesMedida[0]?.unidad_medida_id ?? '',
      fecha_vigencia_desde: new Date().toISOString().slice(0, 10),
    });
    setCreateOpen(true);
  };

  const openEdit = (row: ListaMateriales) => {
    setEditing(row);
    setEditForm({
      codigo_bom: row.codigo_bom,
      version: row.version ?? undefined,
      fecha_vigencia_desde: row.fecha_vigencia_desde,
      fecha_vigencia_hasta: row.fecha_vigencia_hasta ?? undefined,
      cantidad_base: row.cantidad_base ?? undefined,
      unidad_medida_id: row.unidad_medida_id,
      tipo_bom: row.tipo_bom ?? undefined,
      porcentaje_desperdicio: row.porcentaje_desperdicio ?? undefined,
      es_bom_activa: row.es_bom_activa,
      estado: (row.estado as ListaMaterialesUpdate['estado']) ?? undefined,
      observaciones: row.observaciones ?? undefined,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id || !form.codigo_bom.trim() || !form.producto_id || !form.fecha_vigencia_desde || !form.unidad_medida_id) {
      toast.error('Completa empresa, código, producto, fecha vigencia y unidad de medida.');
      return;
    }
    setSubmitting(true);
    try {
      await listaMaterialesService.create(form);
      toast.success('Lista de materiales creada.');
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
      await listaMaterialesService.update(editing.bom_id, editForm);
      toast.success('Lista de materiales actualizada.');
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
      title="Listas de Materiales (BOM)"
      description="Fórmulas o recetas: componentes necesarios para fabricar un producto."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!empresas.length || !productos.length || !unidadesMedida.length}>
          <Plus className="h-4 w-4 mr-2" /> Nueva BOM
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
            {ESTADOS_BOM.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-3 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" />
        </div>
      </div>
      {loading && <div className="flex justify-center py-12"><Loader className="h-8 w-8 animate-spin text-brand-primary" /></div>}
      {error && !loading && <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">{error}</p>}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Código BOM</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Producto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Versión</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Vigencia</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><List className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay listas de materiales.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.bom_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.codigo_bom}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.producto_id}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.version ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.fecha_vigencia_desde} / {row.fecha_vigencia_hasta ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.estado ?? '—'}</td>
                    <td className="px-4 py-3 text-center flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => loadDetalle(row.bom_id)} className="text-brand-primary hover:text-brand-primary/80" title="Ver detalle"><Eye className="h-4 w-4" /></Button>
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
          <DialogHeader><DialogTitle>Nueva lista de materiales</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
              <div><Label>Código BOM *</Label><input type="text" value={form.codigo_bom} onChange={(e) => setForm((p) => ({ ...p, codigo_bom: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Producto (terminado) *</Label><select value={form.producto_id} onChange={(e) => setForm((p) => ({ ...p, producto_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{productos.map((p) => <option key={p.producto_id} value={p.producto_id}>{p.codigo_sku} – {p.nombre}</option>)}</select></div>
              <div><Label>Unidad medida *</Label><select value={form.unidad_medida_id} onChange={(e) => setForm((p) => ({ ...p, unidad_medida_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{unidadesMedida.map((u) => <option key={u.unidad_medida_id} value={u.unidad_medida_id}>{u.codigo}</option>)}</select></div>
              <div><Label>Fecha vigencia desde *</Label><input type="date" value={form.fecha_vigencia_desde} onChange={(e) => setForm((p) => ({ ...p, fecha_vigencia_desde: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Fecha vigencia hasta</Label><input type="date" value={form.fecha_vigencia_hasta ?? ''} onChange={(e) => setForm((p) => ({ ...p, fecha_vigencia_hasta: e.target.value || undefined }))} className={inputCls} /></div>
              <div><Label>Cantidad base</Label><input type="number" step="0.0001" min="0" value={form.cantidad_base ?? 1} onChange={(e) => setForm((p) => ({ ...p, cantidad_base: parseFloat(e.target.value) || 1 }))} className={inputCls} /></div>
              <div><Label>Tipo BOM</Label><select value={form.tipo_bom ?? 'produccion'} onChange={(e) => setForm((p) => ({ ...p, tipo_bom: e.target.value }))} className={selectCls}>{TIPOS_BOM.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Estado</Label><select value={form.estado ?? 'borrador'} onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value }))} className={selectCls}>{ESTADOS_BOM.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={form.es_bom_activa ?? true} onChange={(e) => setForm((p) => ({ ...p, es_bom_activa: e.target.checked }))} className="rounded" /><Label>BOM activa</Label></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar lista de materiales</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Código BOM *</Label><input type="text" value={editForm.codigo_bom ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, codigo_bom: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Versión</Label><input type="text" value={editForm.version ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, version: e.target.value || undefined }))} className={inputCls} /></div>
              <div><Label>Fecha vigencia desde *</Label><input type="date" value={editForm.fecha_vigencia_desde ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_vigencia_desde: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Fecha vigencia hasta</Label><input type="date" value={editForm.fecha_vigencia_hasta ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_vigencia_hasta: e.target.value || undefined }))} className={inputCls} /></div>
              <div><Label>Cantidad base</Label><input type="number" step="0.0001" min="0" value={editForm.cantidad_base ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, cantidad_base: e.target.value ? parseFloat(e.target.value) : undefined }))} className={inputCls} /></div>
              <div><Label>Estado</Label><select value={editForm.estado ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, estado: e.target.value as ListaMaterialesUpdate['estado'] }))} className={selectCls}>{ESTADOS_BOM.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={editForm.es_bom_activa ?? false} onChange={(e) => setEditForm((p) => ({ ...p, es_bom_activa: e.target.checked }))} className="rounded" /><Label>BOM activa</Label></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={detalleOpen} onOpenChange={setDetalleOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Detalle BOM (componentes)</DialogTitle></DialogHeader>
          {detalleLoading && <div className="flex justify-center py-8"><Loader className="h-8 w-8 animate-spin text-brand-primary" /></div>}
          {!detalleLoading && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Sec.</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Producto componente</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cantidad</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {detalleLines.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">Sin líneas.</td></tr>
                  ) : (
                    detalleLines.map((line) => (
                      <tr key={line.bom_detalle_id}>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{line.secuencia ?? '—'}</td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{line.producto_componente_id}</td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{line.cantidad}</td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{line.tipo_componente ?? '—'}</td>
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
