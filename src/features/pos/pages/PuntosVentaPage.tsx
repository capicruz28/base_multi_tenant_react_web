/**
 * Puntos de Venta — Listado y gestión. GET/POST /api/v1/pos/puntos-venta
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, Store, Plus, Pencil, Search } from 'lucide-react';
import { empresaService, sucursalService } from '@/features/org/services/org.service';
import { almacenService } from '@/features/inv/services/inv.service';
import { listaPrecioService } from '@/features/prc/services/prc.service';
import { puntoVentaService } from '../services/pos.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { Sucursal } from '@/features/org/types/org.types';
import type { Almacen } from '@/features/inv/types/inv.types';
import type { ListaPrecio } from '@/features/prc/types/prc.types';
import type { PuntoVenta, PuntoVentaCreate, PuntoVentaUpdate } from '../types/pos.types';
import { PosPageLayout } from '../components/PosPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const TIPOS_PV = ['caja', 'autoservicio', 'movil'] as const;
const ESTADOS_PV = ['abierto', 'cerrado', 'bloqueado'] as const;

const DEFAULT: PuntoVentaCreate = {
  empresa_id: '',
  codigo_punto_venta: '',
  nombre: '',
  sucursal_id: '',
  tipo_punto_venta: 'caja',
  acepta_efectivo: true,
  acepta_tarjeta: true,
  acepta_transferencia: false,
  acepta_yape_plin: false,
  estado: 'cerrado',
  es_activo: true,
};

export default function PuntosVentaPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
  const [listasPrecio, setListasPrecio] = useState<ListaPrecio[]>([]);
  const [list, setList] = useState<PuntoVenta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<PuntoVenta | null>(null);
  const [form, setForm] = useState<PuntoVentaCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<PuntoVentaUpdate>({});
  const [submitting, setSubmitting] = useState(false);

  const loadEmpresas = useCallback(async () => {
    try {
      const data = await empresaService.list({ solo_activos: true });
      setEmpresas(data);
      if (data.length === 1 && !empresaFilter) setEmpresaFilter(data[0].empresa_id);
    } catch {
      setEmpresas([]);
    }
  }, [empresaFilter]);

  const loadSucursales = useCallback(async () => {
    if (!empresaFilter) { setSucursales([]); return; }
    try {
      const data = await sucursalService.list({ empresa_id: empresaFilter, solo_activos: true });
      setSucursales(data);
    } catch {
      setSucursales([]);
    }
  }, [empresaFilter]);

  const loadAlmacenes = useCallback(async () => {
    try {
      const data = await almacenService.list({ solo_activos: true });
      setAlmacenes(data);
    } catch {
      setAlmacenes([]);
    }
  }, []);

  const loadListasPrecio = useCallback(async () => {
    try {
      const data = await listaPrecioService.list({ solo_activos: true });
      setListasPrecio(Array.isArray(data) ? data : []);
    } catch {
      setListasPrecio([]);
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
      const data = await puntoVentaService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [empresaFilter, estadoFilter, searchTerm]);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);
  useEffect(() => { loadSucursales(); }, [loadSucursales]);
  useEffect(() => { loadAlmacenes(); }, [loadAlmacenes]);
  useEffect(() => { loadListasPrecio(); }, [loadListasPrecio]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    setForm({
      ...DEFAULT,
      empresa_id: (empresaFilter || empresas[0]?.empresa_id) ?? '',
      sucursal_id: sucursales[0]?.sucursal_id ?? '',
    });
    setCreateOpen(true);
  };

  const openEdit = (row: PuntoVenta) => {
    setEditing(row);
    setEditForm({
      codigo_punto_venta: row.codigo_punto_venta,
      nombre: row.nombre,
      ubicacion_fisica: row.ubicacion_fisica ?? undefined,
      tipo_punto_venta: (row.tipo_punto_venta as PuntoVentaUpdate['tipo_punto_venta']) ?? undefined,
      almacen_id: row.almacen_id ?? undefined,
      lista_precio_id: row.lista_precio_id ?? undefined,
      acepta_efectivo: row.acepta_efectivo,
      acepta_tarjeta: row.acepta_tarjeta,
      acepta_transferencia: row.acepta_transferencia,
      acepta_yape_plin: row.acepta_yape_plin,
      estado: (row.estado as PuntoVentaUpdate['estado']) ?? undefined,
      es_activo: row.es_activo,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id || !form.codigo_punto_venta.trim() || !form.nombre.trim() || !form.sucursal_id) {
      toast.error('Completa empresa, código, nombre y sucursal.');
      return;
    }
    setSubmitting(true);
    try {
      await puntoVentaService.create(form);
      toast.success('Punto de venta creado.');
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
      await puntoVentaService.update(editing.punto_venta_id, editForm);
      toast.success('Punto de venta actualizado.');
      setEditOpen(false);
      setEditing(null);
      fetchList();
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PosPageLayout
      title="Puntos de Venta"
      description="Configurar terminales o cajas por sucursal, con almacén y lista de precios."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!empresas.length || !sucursales.length}>
          <Plus className="h-4 w-4 mr-2" /> Crear punto de venta
        </Button>
      }
    >
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        {empresas.length > 0 && (
          <div>
            <Label className="mr-2">Empresa</Label>
            <select value={empresaFilter} onChange={(e) => setEmpresaFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
              <option value="">Todas</option>
              {empresas.map((e) => (
                <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <Label className="mr-2">Estado</Label>
          <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
            <option value="">Todos</option>
            {ESTADOS_PV.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-3 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
          />
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ubicación</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><Store className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay puntos de venta.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.punto_venta_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.codigo_punto_venta}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.tipo_punto_venta ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.ubicacion_fisica ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.estado ?? '-'}</td>
                    <td className="px-4 py-3 text-center">
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
          <DialogHeader><DialogTitle>Crear punto de venta</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
              <div><Label>Sucursal *</Label><select value={form.sucursal_id} onChange={(e) => setForm((p) => ({ ...p, sucursal_id: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{sucursales.map((s) => <option key={s.sucursal_id} value={s.sucursal_id}>{s.nombre}</option>)}</select></div>
              <div><Label>Código *</Label><input type="text" value={form.codigo_punto_venta} onChange={(e) => setForm((p) => ({ ...p, codigo_punto_venta: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div className="md:col-span-2"><Label>Nombre *</Label><input type="text" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Ubicación física</Label><input type="text" value={form.ubicacion_fisica ?? ''} onChange={(e) => setForm((p) => ({ ...p, ubicacion_fisica: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Tipo</Label><select value={form.tipo_punto_venta ?? 'caja'} onChange={(e) => setForm((p) => ({ ...p, tipo_punto_venta: e.target.value as PuntoVentaCreate['tipo_punto_venta'] }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{TIPOS_PV.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Almacén</Label><select value={form.almacen_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, almacen_id: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"><option value="">—</option>{almacenes.map((a) => <option key={a.almacen_id} value={a.almacen_id}>{a.nombre}</option>)}</select></div>
              <div><Label>Lista de precio</Label><select value={form.lista_precio_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, lista_precio_id: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"><option value="">—</option>{listasPrecio.map((l) => <option key={l.lista_precio_id} value={l.lista_precio_id}>{l.codigo_lista} – {l.nombre}</option>)}</select></div>
              <div className="md:col-span-2 flex flex-wrap gap-4">
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.acepta_efectivo ?? true} onChange={(e) => setForm((p) => ({ ...p, acepta_efectivo: e.target.checked }))} className="rounded" /><span className="text-sm">Efectivo</span></label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.acepta_tarjeta ?? true} onChange={(e) => setForm((p) => ({ ...p, acepta_tarjeta: e.target.checked }))} className="rounded" /><span className="text-sm">Tarjeta</span></label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.acepta_transferencia ?? false} onChange={(e) => setForm((p) => ({ ...p, acepta_transferencia: e.target.checked }))} className="rounded" /><span className="text-sm">Transferencia</span></label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.acepta_yape_plin ?? false} onChange={(e) => setForm((p) => ({ ...p, acepta_yape_plin: e.target.checked }))} className="rounded" /><span className="text-sm">Yape/Plin</span></label>
              </div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={form.es_activo ?? true} onChange={(e) => setForm((p) => ({ ...p, es_activo: e.target.checked }))} className="rounded" /><Label>Activo</Label></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar punto de venta</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Código *</Label><input type="text" value={editForm.codigo_punto_venta ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, codigo_punto_venta: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div className="md:col-span-2"><Label>Nombre *</Label><input type="text" value={editForm.nombre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Tipo</Label><select value={editForm.tipo_punto_venta ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, tipo_punto_venta: e.target.value as PuntoVentaUpdate['tipo_punto_venta'] }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{TIPOS_PV.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Estado</Label><select value={editForm.estado ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, estado: e.target.value as PuntoVentaUpdate['estado'] }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{ESTADOS_PV.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={editForm.es_activo ?? false} onChange={(e) => setEditForm((p) => ({ ...p, es_activo: e.target.checked }))} className="rounded" /><Label>Activo</Label></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PosPageLayout>
  );
}
