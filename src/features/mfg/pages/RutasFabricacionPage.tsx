/**
 * Rutas de Fabricación MFG — Listado y gestión. GET/POST/PUT /api/v1/mfg/rutas-fabricacion
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, Route, Plus, Pencil, Search, Eye } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import { productoService } from '@/features/inv/services/inv.service';
import { listaMaterialesService } from '../services/mfg.service';
import { rutaFabricacionService, rutaFabricacionDetalleService } from '../services/mfg.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { Producto } from '@/features/inv/types/inv.types';
import type { ListaMateriales } from '../types/mfg.types';
import type { RutaFabricacion, RutaFabricacionCreate, RutaFabricacionUpdate } from '../types/mfg.types';
import type { RutaFabricacionDetalle } from '../types/mfg.types';
import { MfgPageLayout } from '../components/MfgPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const ESTADOS_RUTA = ['borrador', 'aprobada', 'obsoleta'] as const;

const DEFAULT: RutaFabricacionCreate = {
  empresa_id: '',
  codigo_ruta: '',
  producto_id: '',
  nombre: '',
  es_ruta_activa: true,
  estado: 'borrador',
};

export default function RutasFabricacionPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [boms, setBoms] = useState<ListaMateriales[]>([]);
  const [list, setList] = useState<RutaFabricacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<RutaFabricacion | null>(null);
  const [form, setForm] = useState<RutaFabricacionCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<RutaFabricacionUpdate>({});
  const [submitting, setSubmitting] = useState(false);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [detalleLines, setDetalleLines] = useState<RutaFabricacionDetalle[]>([]);
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

  const loadBoms = useCallback(async () => {
    if (!empresaFilter) { setBoms([]); return; }
    try {
      const data = await listaMaterialesService.list({ empresa_id: empresaFilter, es_bom_activa: true });
      setBoms(data);
    } catch {
      setBoms([]);
    }
  }, [empresaFilter]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { empresa_id?: string; estado?: string; buscar?: string } = {};
      if (empresaFilter) params.empresa_id = empresaFilter;
      if (estadoFilter) params.estado = estadoFilter;
      if (searchTerm.trim()) params.buscar = searchTerm.trim();
      const data = await rutaFabricacionService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [empresaFilter, estadoFilter, searchTerm]);

  const loadDetalle = useCallback(async (rutaId: string) => {
    setDetalleOpen(true);
    setDetalleLoading(true);
    try {
      const data = await rutaFabricacionDetalleService.list({ ruta_id: rutaId });
      setDetalleLines(data);
    } catch {
      setDetalleLines([]);
    } finally {
      setDetalleLoading(false);
    }
  }, []);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);
  useEffect(() => { loadProductos(); }, [loadProductos]);
  useEffect(() => { loadBoms(); }, [loadBoms]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    setForm({
      ...DEFAULT,
      empresa_id: (empresaFilter || empresas[0]?.empresa_id) ?? '',
      producto_id: productos[0]?.producto_id ?? '',
      bom_id: boms[0]?.bom_id ?? undefined,
    });
    setCreateOpen(true);
  };

  const openEdit = (row: RutaFabricacion) => {
    setEditing(row);
    setEditForm({
      codigo_ruta: row.codigo_ruta,
      bom_id: row.bom_id ?? undefined,
      nombre: row.nombre,
      descripcion: row.descripcion ?? undefined,
      version: row.version ?? undefined,
      es_ruta_activa: row.es_ruta_activa,
      estado: (row.estado as RutaFabricacionUpdate['estado']) ?? undefined,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id || !form.codigo_ruta.trim() || !form.producto_id || !form.nombre.trim()) {
      toast.error('Completa empresa, código, producto y nombre.');
      return;
    }
    setSubmitting(true);
    try {
      await rutaFabricacionService.create(form);
      toast.success('Ruta de fabricación creada.');
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
      await rutaFabricacionService.update(editing.ruta_id, editForm);
      toast.success('Ruta de fabricación actualizada.');
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
      title="Rutas de Fabricación"
      description="Secuencia de operaciones para fabricar un producto."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!empresas.length || !productos.length}>
          <Plus className="h-4 w-4 mr-2" /> Nueva ruta
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
            {ESTADOS_RUTA.map((s) => <option key={s} value={s}>{s}</option>)}
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Producto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><Route className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay rutas de fabricación.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.ruta_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.codigo_ruta}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.producto_id}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.estado ?? '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <Button variant="ghost" size="icon" onClick={() => loadDetalle(row.ruta_id)} className="text-brand-primary hover:text-brand-primary/80" title="Ver detalle"><Eye className="h-4 w-4" /></Button>
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
          <DialogHeader><DialogTitle>Nueva ruta de fabricación</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
              <div><Label>Código ruta *</Label><input type="text" value={form.codigo_ruta} onChange={(e) => setForm((p) => ({ ...p, codigo_ruta: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Producto *</Label><select value={form.producto_id} onChange={(e) => setForm((p) => ({ ...p, producto_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{productos.map((p) => <option key={p.producto_id} value={p.producto_id}>{p.codigo_sku} – {p.nombre}</option>)}</select></div>
              <div><Label>BOM (opcional)</Label><select value={form.bom_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, bom_id: e.target.value || undefined }))} className={selectCls}><option value="">—</option>{boms.map((b) => <option key={b.bom_id} value={b.bom_id}>{b.codigo_bom}</option>)}</select></div>
              <div className="md:col-span-2"><Label>Nombre *</Label><input type="text" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Estado</Label><select value={form.estado ?? 'borrador'} onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value }))} className={selectCls}>{ESTADOS_RUTA.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={form.es_ruta_activa ?? true} onChange={(e) => setForm((p) => ({ ...p, es_ruta_activa: e.target.checked }))} className="rounded" /><Label>Ruta activa</Label></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar ruta de fabricación</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Código ruta *</Label><input type="text" value={editForm.codigo_ruta ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, codigo_ruta: e.target.value }))} className={inputCls} required /></div>
              <div className="md:col-span-2"><Label>Nombre *</Label><input type="text" value={editForm.nombre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))} className={inputCls} required /></div>
              <div><Label>BOM</Label><select value={editForm.bom_id ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, bom_id: e.target.value || undefined }))} className={selectCls}><option value="">—</option>{boms.map((b) => <option key={b.bom_id} value={b.bom_id}>{b.codigo_bom}</option>)}</select></div>
              <div><Label>Estado</Label><select value={editForm.estado ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, estado: e.target.value as RutaFabricacionUpdate['estado'] }))} className={selectCls}>{ESTADOS_RUTA.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={editForm.es_ruta_activa ?? false} onChange={(e) => setEditForm((p) => ({ ...p, es_ruta_activa: e.target.checked }))} className="rounded" /><Label>Ruta activa</Label></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={detalleOpen} onOpenChange={setDetalleOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Detalle ruta (pasos)</DialogTitle></DialogHeader>
          {detalleLoading && <div className="flex justify-center py-8"><Loader className="h-8 w-8 animate-spin text-brand-primary" /></div>}
          {!detalleLoading && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Sec.</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Operación</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Centro trabajo</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Setup / Op (min)</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {detalleLines.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">Sin pasos.</td></tr>
                  ) : (
                    detalleLines.map((line) => (
                      <tr key={line.ruta_detalle_id}>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{line.secuencia}</td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{line.operacion_id}</td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{line.centro_trabajo_id}</td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{line.tiempo_setup_minutos ?? '—'} / {line.tiempo_operacion_minutos ?? '—'}</td>
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
