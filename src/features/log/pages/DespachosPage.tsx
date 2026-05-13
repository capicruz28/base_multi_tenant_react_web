/**
 * Despachos — Listado y gestión completa. GET/POST /api/v1/log/despachos
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, Truck, Pencil, Search, Eye, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { empresaService } from '@/features/org/services/org.service';
import { rutaService } from '../services/log.service';
import { vehiculoService } from '../services/log.service';
import { despachoService } from '../services/log.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { Ruta } from '../types/log.types';
import type { Vehiculo } from '../types/log.types';
import type { Despacho, DespachoCreate, DespachoUpdate } from '../types/log.types';
import { LogPageLayout } from '../components/LogPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const ESTADOS = ['planificado', 'en_ruta', 'completado', 'cancelado'] as const;

const DEFAULT: DespachoCreate = {
  empresa_id: '',
  numero_despacho: '',
  fecha_programada: new Date().toISOString().split('T')[0],
  estado: 'planificado',
};

export default function DespachosPage() {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [list, setList] = useState<Despacho[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Despacho | null>(null);
  const [form, setForm] = useState<DespachoCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<DespachoUpdate>({});
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

  const loadRutas = useCallback(async () => {
    if (!empresaFilter) {
      setRutas([]);
      return;
    }
    try {
      const data = await rutaService.list({ empresa_id: empresaFilter, solo_activos: true });
      setRutas(data);
    } catch {
      setRutas([]);
    }
  }, [empresaFilter]);

  const loadVehiculos = useCallback(async () => {
    if (!empresaFilter) {
      setVehiculos([]);
      return;
    }
    try {
      const data = await vehiculoService.list({ empresa_id: empresaFilter, solo_activos: true });
      setVehiculos(data);
    } catch {
      setVehiculos([]);
    }
  }, [empresaFilter]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (empresaFilter) params.empresa_id = empresaFilter;
      if (estadoFilter) params.estado = estadoFilter;
      if (searchTerm.trim()) params.buscar = searchTerm.trim();
      const data = await despachoService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [empresaFilter, estadoFilter, searchTerm]);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);
  useEffect(() => { loadRutas(); }, [loadRutas]);
  useEffect(() => { loadVehiculos(); }, [loadVehiculos]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    setForm({ ...DEFAULT, empresa_id: empresaFilter || (empresas[0]?.empresa_id ?? '') });
    setCreateOpen(true);
  };
  const openEdit = (row: Despacho) => {
    setEditing(row);
    setEditForm({
      numero_despacho: row.numero_despacho,
      fecha_programada: row.fecha_programada,
      hora_salida_programada: row.hora_salida_programada ?? undefined,
      ruta_id: row.ruta_id ?? undefined,
      vehiculo_id: row.vehiculo_id ?? undefined,
      conductor_nombre: row.conductor_nombre ?? undefined,
      fecha_salida_real: row.fecha_salida_real ?? undefined,
      fecha_retorno: row.fecha_retorno ?? undefined,
      km_inicial: row.km_inicial ?? undefined,
      km_final: row.km_final ?? undefined,
      costo_combustible: row.costo_combustible ?? undefined,
      costo_peajes: row.costo_peajes ?? undefined,
      costo_otros: row.costo_otros ?? undefined,
      estado: row.estado,
      observaciones: row.observaciones ?? undefined,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id || !form.numero_despacho.trim()) {
      toast.error('Completa empresa y número de despacho.');
      return;
    }
    setSubmitting(true);
    try {
      await despachoService.create(form);
      toast.success('Despacho creado.');
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
      await despachoService.update(editing.despacho_id, editForm);
      toast.success('Despacho actualizado.');
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
    <LogPageLayout
      title="Despachos"
      description="Gestión de despachos agrupando múltiples guías de remisión para optimizar rutas."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white">
          <Plus className="h-4 w-4 mr-2" /> Crear despacho
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
            {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por número de despacho..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-3 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
          />
        </div>
      </div>
      {loading && <div className="flex justify-center py-12"><Loader className="h-8 w-8 animate-spin text-brand-primary" /></div>}
      {!loading && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Número</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha Programada</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ruta</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Vehículo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Guías</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {error ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><Truck className="h-10 w-10 mx-auto mb-2 opacity-50" />{error}</td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><Truck className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay despachos.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.despacho_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.numero_despacho}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.fecha_programada}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.ruta_nombre ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.vehiculo_placa ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.total_guias}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        row.estado === 'completado' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        row.estado === 'en_ruta' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        row.estado === 'cancelado' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {row.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/log/despachos/${row.despacho_id}/guias`)} className="text-brand-primary hover:text-brand-primary/80" title="Ver guías"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(row)} className="text-brand-primary hover:text-brand-primary/80"><Pencil className="h-4 w-4" /></Button>
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
          <DialogHeader><DialogTitle>Crear despacho</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
              <div><Label>Número Despacho *</Label><input type="text" value={form.numero_despacho} onChange={(e) => setForm((p) => ({ ...p, numero_despacho: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Fecha Programada *</Label><input type="date" value={form.fecha_programada} onChange={(e) => setForm((p) => ({ ...p, fecha_programada: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Hora Salida Programada</Label><input type="time" value={form.hora_salida_programada ?? ''} onChange={(e) => setForm((p) => ({ ...p, hora_salida_programada: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Ruta</Label><select value={form.ruta_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, ruta_id: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"><option value="">Seleccionar</option>{rutas.map((r) => <option key={r.ruta_id} value={r.ruta_id}>{r.nombre_ruta}</option>)}</select></div>
              <div><Label>Vehículo</Label><select value={form.vehiculo_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, vehiculo_id: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"><option value="">Seleccionar</option>{vehiculos.filter(v => v.estado_vehiculo === 'disponible').map((v) => <option key={v.vehiculo_id} value={v.vehiculo_id}>{v.placa} - {v.marca} {v.modelo}</option>)}</select></div>
              <div><Label>Conductor</Label><input type="text" value={form.conductor_nombre ?? ''} onChange={(e) => setForm((p) => ({ ...p, conductor_nombre: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar despacho</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Número Despacho</Label><input type="text" value={editForm.numero_despacho ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, numero_despacho: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Fecha Programada</Label><input type="date" value={editForm.fecha_programada ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_programada: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Estado</Label><select value={editForm.estado ?? 'planificado'} onChange={(e) => setEditForm((p) => ({ ...p, estado: e.target.value as any }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}</select></div>
              {(editForm.estado === 'en_ruta' || editForm.estado === 'completado') && (
                <>
                  <div><Label>Fecha Salida Real</Label><input type="datetime-local" value={editForm.fecha_salida_real ? editForm.fecha_salida_real.substring(0, 16) : ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_salida_real: e.target.value ? `${e.target.value}:00` : undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
                  <div><Label>KM Inicial</Label><input type="number" step="0.01" min="0" value={editForm.km_inicial ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, km_inicial: e.target.value ? parseFloat(e.target.value) : undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
                </>
              )}
              {editForm.estado === 'completado' && (
                <>
                  <div><Label>Fecha Retorno</Label><input type="datetime-local" value={editForm.fecha_retorno ? editForm.fecha_retorno.substring(0, 16) : ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_retorno: e.target.value ? `${e.target.value}:00` : undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
                  <div><Label>KM Final</Label><input type="number" step="0.01" min="0" value={editForm.km_final ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, km_final: e.target.value ? parseFloat(e.target.value) : undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
                  <div><Label>Costo Combustible</Label><input type="number" step="0.01" min="0" value={editForm.costo_combustible ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, costo_combustible: e.target.value ? parseFloat(e.target.value) : undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
                  <div><Label>Costo Peajes</Label><input type="number" step="0.01" min="0" value={editForm.costo_peajes ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, costo_peajes: e.target.value ? parseFloat(e.target.value) : undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
                  <div><Label>Costo Otros</Label><input type="number" step="0.01" min="0" value={editForm.costo_otros ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, costo_otros: e.target.value ? parseFloat(e.target.value) : undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
                </>
              )}
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </LogPageLayout>
  );
}
