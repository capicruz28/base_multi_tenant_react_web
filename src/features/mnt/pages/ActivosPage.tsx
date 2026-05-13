/**
 * Activos MNT — Listado y gestión. GET/POST/PUT /api/v1/mnt/activos
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, Wrench, Plus, Pencil, Search, Calendar, ClipboardList, History } from 'lucide-react';
import { empresaService, sucursalService } from '@/features/org/services/org.service';
import { centroTrabajoService } from '@/features/mfg/services/mfg.service';
import { vehiculoService } from '@/features/log/services/log.service';
import { proveedorService } from '@/features/pur/services/pur.service';
import { activoService, planMantenimientoService, ordenTrabajoService, historialMantenimientoService } from '../services/mnt.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { Sucursal } from '@/features/org/types/org.types';
import type { CentroTrabajo } from '@/features/mfg/types/mfg.types';
import type { Vehiculo } from '@/features/log/types/log.types';
import type { Activo, ActivoCreate, ActivoUpdate } from '../types/mnt.types';
import type { PlanMantenimiento, OrdenTrabajo, HistorialMantenimiento } from '../types/mnt.types';
import { MntPageLayout } from '../components/MntPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const TIPOS_ACTIVO = ['maquinaria', 'vehiculo', 'equipo', 'instalacion', 'herramienta'] as const;
const ESTADOS_ACTIVO = ['operativo', 'mantenimiento', 'averiado', 'baja'] as const;
const CRITICIDAD = ['critica', 'alta', 'media', 'baja'] as const;

const DEFAULT: ActivoCreate = {
  empresa_id: '',
  codigo_activo: '',
  nombre: '',
  tipo_activo: 'equipo',
  es_activo: true,
};

export default function ActivosPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [centrosTrabajo, setCentrosTrabajo] = useState<CentroTrabajo[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [proveedores, setProveedores] = useState<{ proveedor_id: string; razon_social: string }[]>([]);
  const [list, setList] = useState<Activo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [tipoFilter, setTipoFilter] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Activo | null>(null);
  const [form, setForm] = useState<ActivoCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<ActivoUpdate>({});
  const [submitting, setSubmitting] = useState(false);
  const [planesOpen, setPlanesOpen] = useState(false);
  const [otOpen, setOtOpen] = useState(false);
  const [historialOpen, setHistorialOpen] = useState(false);
  const [planesLines, setPlanesLines] = useState<PlanMantenimiento[]>([]);
  const [otLines, setOtLines] = useState<OrdenTrabajo[]>([]);
  const [historialLines, setHistorialLines] = useState<HistorialMantenimiento[]>([]);
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

  const loadSucursales = useCallback(async () => {
    if (!empresaFilter) {
      setSucursales([]);
      return;
    }
    try {
      const data = await sucursalService.list({ empresa_id: empresaFilter, solo_activos: true });
      setSucursales(data);
    } catch {
      setSucursales([]);
    }
  }, [empresaFilter]);

  const loadCentrosTrabajo = useCallback(async () => {
    if (!empresaFilter) {
      setCentrosTrabajo([]);
      return;
    }
    try {
      const data = await centroTrabajoService.list({ empresa_id: empresaFilter, es_activo: true });
      setCentrosTrabajo(data);
    } catch {
      setCentrosTrabajo([]);
    }
  }, [empresaFilter]);

  const loadVehiculos = useCallback(async () => {
    if (!empresaFilter) {
      setVehiculos([]);
      return;
    }
    try {
      const data = await vehiculoService.list({ empresa_id: empresaFilter, solo_activos: true });
      setVehiculos(Array.isArray(data) ? data : []);
    } catch {
      setVehiculos([]);
    }
  }, [empresaFilter]);

  const loadProveedores = useCallback(async () => {
    try {
      const data = await proveedorService.list({ solo_activos: true });
      setProveedores(Array.isArray(data) ? data : []);
    } catch {
      setProveedores([]);
    }
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { empresa_id?: string; tipo_activo?: string; estado_activo?: string; buscar?: string } = {};
      if (empresaFilter) params.empresa_id = empresaFilter;
      if (tipoFilter) params.tipo_activo = tipoFilter;
      if (estadoFilter) params.estado_activo = estadoFilter;
      if (searchTerm.trim()) params.buscar = searchTerm.trim();
      const data = await activoService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [empresaFilter, tipoFilter, estadoFilter, searchTerm]);

  const loadPlanes = useCallback(async (activoId: string) => {
    setPlanesOpen(true);
    setModalLoading(true);
    try {
      const data = await planMantenimientoService.list({ activo_id: activoId });
      setPlanesLines(data);
    } catch {
      setPlanesLines([]);
    } finally {
      setModalLoading(false);
    }
  }, []);

  const loadOT = useCallback(async (activoId: string) => {
    setOtOpen(true);
    setModalLoading(true);
    try {
      const data = await ordenTrabajoService.list({ activo_id: activoId });
      setOtLines(data);
    } catch {
      setOtLines([]);
    } finally {
      setModalLoading(false);
    }
  }, []);

  const loadHistorial = useCallback(async (activoId: string) => {
    setHistorialOpen(true);
    setModalLoading(true);
    try {
      const data = await historialMantenimientoService.list({ activo_id: activoId });
      setHistorialLines(data);
    } catch {
      setHistorialLines([]);
    } finally {
      setModalLoading(false);
    }
  }, []);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);
  useEffect(() => { loadSucursales(); }, [loadSucursales]);
  useEffect(() => { loadCentrosTrabajo(); }, [loadCentrosTrabajo]);
  useEffect(() => { loadVehiculos(); }, [loadVehiculos]);
  useEffect(() => { loadProveedores(); }, [loadProveedores]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    setForm({
      ...DEFAULT,
      empresa_id: (empresaFilter || empresas[0]?.empresa_id) ?? '',
    });
    setCreateOpen(true);
  };

  const openEdit = (row: Activo) => {
    setEditing(row);
    setEditForm({
      codigo_activo: row.codigo_activo,
      nombre: row.nombre,
      descripcion: row.descripcion ?? undefined,
      tipo_activo: row.tipo_activo as ActivoCreate['tipo_activo'],
      categoria: row.categoria ?? undefined,
      marca: row.marca ?? undefined,
      modelo: row.modelo ?? undefined,
      numero_serie: row.numero_serie ?? undefined,
      anio_fabricacion: row.anio_fabricacion ?? undefined,
      sucursal_id: row.sucursal_id ?? undefined,
      centro_trabajo_id: row.centro_trabajo_id ?? undefined,
      ubicacion_detalle: row.ubicacion_detalle ?? undefined,
      vehiculo_id: row.vehiculo_id ?? undefined,
      proveedor_id: row.proveedor_id ?? undefined,
      criticidad: (row.criticidad as ActivoCreate['criticidad']) ?? undefined,
      estado_activo: (row.estado_activo as ActivoCreate['estado_activo']) ?? undefined,
      observaciones: row.observaciones ?? undefined,
      es_activo: row.es_activo,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await activoService.create(form);
      toast.success('Activo creado.');
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
      await activoService.update(editing.activo_id, editForm);
      toast.success('Activo actualizado.');
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
    <MntPageLayout
      title="Activos"
      description="Maestro de activos (maquinaria, equipos, vehículos) sujetos a mantenimiento."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!empresas.length}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo activo
        </Button>
      }
    >
      <div className="mb-4 flex flex-col sm:flex-row gap-4 flex-wrap">
        {empresas.length > 0 && (
          <div>
            <Label className="mr-2">Empresa</Label>
            <select value={empresaFilter} onChange={(e) => setEmpresaFilter(e.target.value)} className={selectCls}>
              <option value="">Todas</option>
              {empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}
            </select>
          </div>
        )}
        <div>
          <Label className="mr-2">Tipo</Label>
          <select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)} className={selectCls}>
            <option value="">Todos</option>
            {TIPOS_ACTIVO.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <Label className="mr-2">Estado</Label>
          <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} className={selectCls}>
            <option value="">Todos</option>
            {ESTADOS_ACTIVO.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <Label className="mr-2">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Código, nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`pl-9 w-full ${inputCls}`} />
          </div>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Criticidad</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><Wrench className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay activos.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.activo_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.codigo_activo}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.tipo_activo}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.estado_activo ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.criticidad ?? '—'}</td>
                    <td className="px-4 py-3 text-center flex items-center justify-center gap-1 flex-wrap">
                      <Button variant="ghost" size="icon" onClick={() => loadPlanes(row.activo_id)} className="text-brand-primary hover:text-brand-primary/80" title="Ver planes"><Calendar className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => loadOT(row.activo_id)} className="text-brand-primary hover:text-brand-primary/80" title="Ver OT"><ClipboardList className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => loadHistorial(row.activo_id)} className="text-brand-primary hover:text-brand-primary/80" title="Ver historial"><History className="h-4 w-4" /></Button>
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
          <DialogHeader><DialogTitle>Nuevo activo</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
              <div><Label>Código *</Label><input type="text" value={form.codigo_activo} onChange={(e) => setForm((p) => ({ ...p, codigo_activo: e.target.value }))} className={inputCls} required /></div>
              <div className="md:col-span-2"><Label>Nombre *</Label><input type="text" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Tipo *</Label><select value={form.tipo_activo} onChange={(e) => setForm((p) => ({ ...p, tipo_activo: e.target.value as ActivoCreate['tipo_activo'] }))} className={selectCls} required>{TIPOS_ACTIVO.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Estado</Label><select value={form.estado_activo ?? 'operativo'} onChange={(e) => setForm((p) => ({ ...p, estado_activo: e.target.value as ActivoCreate['estado_activo'] }))} className={selectCls}>{ESTADOS_ACTIVO.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
              <div><Label>Criticidad</Label><select value={form.criticidad ?? 'media'} onChange={(e) => setForm((p) => ({ ...p, criticidad: e.target.value as ActivoCreate['criticidad'] }))} className={selectCls}>{CRITICIDAD.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><Label>Sucursal</Label><select value={form.sucursal_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, sucursal_id: e.target.value || undefined }))} className={selectCls}><option value="">—</option>{sucursales.map((s) => <option key={s.sucursal_id} value={s.sucursal_id}>{s.nombre}</option>)}</select></div>
              <div><Label>Centro trabajo</Label><select value={form.centro_trabajo_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, centro_trabajo_id: e.target.value || undefined }))} className={selectCls}><option value="">—</option>{centrosTrabajo.map((c) => <option key={c.centro_trabajo_id} value={c.centro_trabajo_id}>{c.codigo} – {c.nombre}</option>)}</select></div>
              <div><Label>Vehículo</Label><select value={form.vehiculo_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, vehiculo_id: e.target.value || undefined }))} className={selectCls}><option value="">—</option>{vehiculos.map((v) => <option key={v.vehiculo_id} value={v.vehiculo_id}>{v.placa ?? v.vehiculo_id}</option>)}</select></div>
              <div><Label>Proveedor</Label><select value={form.proveedor_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, proveedor_id: e.target.value || undefined }))} className={selectCls}><option value="">—</option>{proveedores.map((p) => <option key={p.proveedor_id} value={p.proveedor_id}>{p.razon_social}</option>)}</select></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar activo</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Código *</Label><input type="text" value={editForm.codigo_activo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, codigo_activo: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Nombre *</Label><input type="text" value={editForm.nombre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Tipo</Label><select value={editForm.tipo_activo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, tipo_activo: e.target.value as ActivoCreate['tipo_activo'] }))} className={selectCls}>{TIPOS_ACTIVO.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Estado</Label><select value={editForm.estado_activo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, estado_activo: e.target.value as ActivoCreate['estado_activo'] }))} className={selectCls}>{ESTADOS_ACTIVO.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
              <div><Label>Criticidad</Label><select value={editForm.criticidad ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, criticidad: e.target.value as ActivoCreate['criticidad'] }))} className={selectCls}>{CRITICIDAD.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={planesOpen} onOpenChange={setPlanesOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Planes de mantenimiento</DialogTitle></DialogHeader>
          {modalLoading && <div className="flex justify-center py-8"><Loader className="h-8 w-8 animate-spin text-brand-primary" /></div>}
          {!modalLoading && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800"><tr><th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Código</th><th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th><th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th><th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Próximo</th></tr></thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {planesLines.length === 0 ? <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">Sin planes.</td></tr> : planesLines.map((line) => <tr key={line.plan_mantenimiento_id}><td className="px-4 py-2 text-sm">{line.codigo_plan}</td><td className="px-4 py-2 text-sm">{line.nombre}</td><td className="px-4 py-2 text-sm">{line.tipo_mantenimiento}</td><td className="px-4 py-2 text-sm">{line.fecha_proximo_mantenimiento ?? '—'}</td></tr>)}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={otOpen} onOpenChange={setOtOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Órdenes de trabajo</DialogTitle></DialogHeader>
          {modalLoading && <div className="flex justify-center py-8"><Loader className="h-8 w-8 animate-spin text-brand-primary" /></div>}
          {!modalLoading && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800"><tr><th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nº OT</th><th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th><th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estado</th><th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Programada</th></tr></thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {otLines.length === 0 ? <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">Sin órdenes.</td></tr> : otLines.map((line) => <tr key={line.orden_trabajo_id}><td className="px-4 py-2 text-sm">{line.numero_ot}</td><td className="px-4 py-2 text-sm">{line.tipo_mantenimiento}</td><td className="px-4 py-2 text-sm">{line.estado ?? '—'}</td><td className="px-4 py-2 text-sm">{line.fecha_programada ?? '—'}</td></tr>)}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={historialOpen} onOpenChange={setHistorialOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Historial de mantenimiento</DialogTitle></DialogHeader>
          {modalLoading && <div className="flex justify-center py-8"><Loader className="h-8 w-8 animate-spin text-brand-primary" /></div>}
          {!modalLoading && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800"><tr><th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th><th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th><th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Técnico</th><th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Costo</th></tr></thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {historialLines.length === 0 ? <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">Sin historial.</td></tr> : historialLines.map((line) => <tr key={line.historial_id}><td className="px-4 py-2 text-sm">{line.fecha_mantenimiento}</td><td className="px-4 py-2 text-sm">{line.tipo_mantenimiento}</td><td className="px-4 py-2 text-sm">{line.tecnico_nombre ?? '—'}</td><td className="px-4 py-2 text-sm">{line.costo_total ?? '—'}</td></tr>)}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MntPageLayout>
  );
}
