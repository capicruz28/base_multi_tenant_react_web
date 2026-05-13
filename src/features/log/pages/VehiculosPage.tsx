/**
 * Vehículos — Listado y gestión completa. GET/POST /api/v1/log/vehiculos
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, Car, Pencil, Search, Plus } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import { transportistaService } from '../services/log.service';
import { vehiculoService } from '../services/log.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { Transportista } from '../types/log.types';
import type { Vehiculo, VehiculoCreate, VehiculoUpdate } from '../types/log.types';
import { LogPageLayout } from '../components/LogPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const TIPOS_VEHICULO = ['camion', 'camioneta', 'furgon', 'moto', 'trailer'] as const;
const TIPOS_PROPIEDAD = ['propio', 'tercero'] as const;
const ESTADOS_VEHICULO = ['disponible', 'en_ruta', 'mantenimiento', 'inactivo'] as const;

const DEFAULT: VehiculoCreate = {
  empresa_id: '',
  placa: '',
  tipo_vehiculo: 'camioneta',
  tipo_propiedad: 'propio',
  estado_vehiculo: 'disponible',
  es_activo: true,
};

export default function VehiculosPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [transportistas, setTransportistas] = useState<Transportista[]>([]);
  const [list, setList] = useState<Vehiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [tipoPropiedadFilter, setTipoPropiedadFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Vehiculo | null>(null);
  const [form, setForm] = useState<VehiculoCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<VehiculoUpdate>({});
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

  const loadTransportistas = useCallback(async () => {
    if (!empresaFilter) {
      setTransportistas([]);
      return;
    }
    try {
      const data = await transportistaService.list({ empresa_id: empresaFilter, solo_activos: true });
      setTransportistas(data);
    } catch {
      setTransportistas([]);
    }
  }, [empresaFilter]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { solo_activos: true };
      if (empresaFilter) params.empresa_id = empresaFilter;
      if (tipoPropiedadFilter) params.tipo_propiedad = tipoPropiedadFilter;
      if (searchTerm.trim()) params.buscar = searchTerm.trim();
      const data = await vehiculoService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [empresaFilter, tipoPropiedadFilter, searchTerm]);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);
  useEffect(() => { loadTransportistas(); }, [loadTransportistas]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    setForm({ ...DEFAULT, empresa_id: empresaFilter || (empresas[0]?.empresa_id ?? '') });
    setCreateOpen(true);
  };
  const openEdit = (row: Vehiculo) => {
    setEditing(row);
    setEditForm({
      placa: row.placa,
      marca: row.marca ?? undefined,
      modelo: row.modelo ?? undefined,
      año: row.año ?? undefined,
      tipo_vehiculo: row.tipo_vehiculo,
      categoria_vehiculo: row.categoria_vehiculo ?? undefined,
      capacidad_kg: row.capacidad_kg ?? undefined,
      capacidad_m3: row.capacidad_m3 ?? undefined,
      tipo_propiedad: row.tipo_propiedad,
      transportista_id: row.transportista_id ?? undefined,
      conductor_nombre: row.conductor_nombre ?? undefined,
      conductor_licencia: row.conductor_licencia ?? undefined,
      soat_numero: row.soat_numero ?? undefined,
      soat_vencimiento: row.soat_vencimiento ?? undefined,
      tiene_gps: row.tiene_gps,
      codigo_gps: row.codigo_gps ?? undefined,
      estado_vehiculo: row.estado_vehiculo,
      es_activo: row.es_activo,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id || !form.placa.trim()) {
      toast.error('Completa empresa y placa.');
      return;
    }
    setSubmitting(true);
    try {
      await vehiculoService.create(form);
      toast.success('Vehículo creado.');
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
      await vehiculoService.update(editing.vehiculo_id, editForm);
      toast.success('Vehículo actualizado.');
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
      title="Vehículos"
      description="Gestión de flota de vehículos (propios o de terceros) con capacidad, documentos y GPS."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white">
          <Plus className="h-4 w-4 mr-2" /> Crear vehículo
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
          <Label className="mr-2">Tipo Propiedad</Label>
          <select value={tipoPropiedadFilter} onChange={(e) => setTipoPropiedadFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
            <option value="">Todos</option>
            {TIPOS_PROPIEDAD.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por placa, marca o modelo..."
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Placa</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Marca/Modelo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Capacidad</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Propiedad</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {error ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><Car className="h-10 w-10 mx-auto mb-2 opacity-50" />{error}</td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><Car className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay vehículos.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.vehiculo_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.placa}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.marca ?? '-'} {row.modelo ?? ''}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.tipo_vehiculo}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.capacidad_kg ? `${row.capacidad_kg} kg` : '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.tipo_propiedad}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        row.estado_vehiculo === 'disponible' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        row.estado_vehiculo === 'en_ruta' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        row.estado_vehiculo === 'mantenimiento' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                        {row.estado_vehiculo}
                      </span>
                    </td>
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Crear vehículo</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
              <div><Label>Placa *</Label><input type="text" value={form.placa} onChange={(e) => setForm((p) => ({ ...p, placa: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Marca</Label><input type="text" value={form.marca ?? ''} onChange={(e) => setForm((p) => ({ ...p, marca: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Modelo</Label><input type="text" value={form.modelo ?? ''} onChange={(e) => setForm((p) => ({ ...p, modelo: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Año</Label><input type="number" min="1900" max={new Date().getFullYear() + 1} value={form.año ?? ''} onChange={(e) => setForm((p) => ({ ...p, año: e.target.value ? parseInt(e.target.value) : undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Tipo Vehículo *</Label><select value={form.tipo_vehiculo} onChange={(e) => setForm((p) => ({ ...p, tipo_vehiculo: e.target.value as any }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required>{TIPOS_VEHICULO.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Tipo Propiedad *</Label><select value={form.tipo_propiedad} onChange={(e) => setForm((p) => ({ ...p, tipo_propiedad: e.target.value as any }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required>{TIPOS_PROPIEDAD.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              {form.tipo_propiedad === 'tercero' && (
                <div><Label>Transportista</Label><select value={form.transportista_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, transportista_id: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"><option value="">Seleccionar</option>{transportistas.map((t) => <option key={t.transportista_id} value={t.transportista_id}>{t.razon_social}</option>)}</select></div>
              )}
              <div><Label>Capacidad (kg)</Label><input type="number" step="0.01" min="0" value={form.capacidad_kg ?? ''} onChange={(e) => setForm((p) => ({ ...p, capacidad_kg: e.target.value ? parseFloat(e.target.value) : undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Capacidad (m³)</Label><input type="number" step="0.01" min="0" value={form.capacidad_m3 ?? ''} onChange={(e) => setForm((p) => ({ ...p, capacidad_m3: e.target.value ? parseFloat(e.target.value) : undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Conductor</Label><input type="text" value={form.conductor_nombre ?? ''} onChange={(e) => setForm((p) => ({ ...p, conductor_nombre: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Licencia Conductor</Label><input type="text" value={form.conductor_licencia ?? ''} onChange={(e) => setForm((p) => ({ ...p, conductor_licencia: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>SOAT Número</Label><input type="text" value={form.soat_numero ?? ''} onChange={(e) => setForm((p) => ({ ...p, soat_numero: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>SOAT Vencimiento</Label><input type="date" value={form.soat_vencimiento ?? ''} onChange={(e) => setForm((p) => ({ ...p, soat_vencimiento: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={form.tiene_gps ?? false} onChange={(e) => setForm((p) => ({ ...p, tiene_gps: e.target.checked }))} className="rounded" /><Label>Tiene GPS</Label></div>
              {form.tiene_gps && (
                <div><Label>Código GPS</Label><input type="text" value={form.codigo_gps ?? ''} onChange={(e) => setForm((p) => ({ ...p, codigo_gps: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              )}
              <div><Label>Estado</Label><select value={form.estado_vehiculo ?? 'disponible'} onChange={(e) => setForm((p) => ({ ...p, estado_vehiculo: e.target.value as any }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{ESTADOS_VEHICULO.map((e) => <option key={e} value={e}>{e}</option>)}</select></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar vehículo</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Placa *</Label><input type="text" value={editForm.placa ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, placa: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Estado</Label><select value={editForm.estado_vehiculo ?? 'disponible'} onChange={(e) => setEditForm((p) => ({ ...p, estado_vehiculo: e.target.value as any }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{ESTADOS_VEHICULO.map((e) => <option key={e} value={e}>{e}</option>)}</select></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={editForm.es_activo ?? false} onChange={(e) => setEditForm((p) => ({ ...p, es_activo: e.target.checked }))} className="rounded" /><Label>Activo</Label></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </LogPageLayout>
  );
}
