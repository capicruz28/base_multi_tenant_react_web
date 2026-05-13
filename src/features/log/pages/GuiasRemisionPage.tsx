/**
 * Guías de Remisión — Listado y gestión completa. GET/POST /api/v1/log/guias-remision
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, FileText, Pencil, Search, Eye, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { empresaService } from '@/features/org/services/org.service';
import { vehiculoService } from '../services/log.service';
import { transportistaService } from '../services/log.service';
import { guiaRemisionService } from '../services/log.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { Vehiculo } from '../types/log.types';
import type { Transportista } from '../types/log.types';
import type { GuiaRemision, GuiaRemisionCreate, GuiaRemisionUpdate } from '../types/log.types';
import { LogPageLayout } from '../components/LogPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const TIPOS_GUIA = ['remitente', 'transportista'] as const;
const MOTIVOS_TRASLADO = ['venta', 'compra', 'transferencia', 'consignacion', 'devolucion'] as const;
const MODALIDADES_TRANSPORTE = ['publico', 'privado'] as const;
const ESTADOS = ['borrador', 'emitida', 'en_transito', 'entregada', 'anulada'] as const;

const DEFAULT: GuiaRemisionCreate = {
  empresa_id: '',
  serie: '',
  numero: '',
  fecha_traslado: new Date().toISOString().split('T')[0],
  tipo_guia: 'remitente',
  motivo_traslado: 'venta',
  remitente_razon_social: '',
  destinatario_razon_social: '',
  punto_partida: '',
  punto_llegada: '',
  modalidad_transporte: 'privado',
  estado: 'borrador',
};

export default function GuiasRemisionPage() {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [transportistas, setTransportistas] = useState<Transportista[]>([]);
  const [list, setList] = useState<GuiaRemision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<GuiaRemision | null>(null);
  const [form, setForm] = useState<GuiaRemisionCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<GuiaRemisionUpdate>({});
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
      const params: any = {};
      if (empresaFilter) params.empresa_id = empresaFilter;
      if (estadoFilter) params.estado = estadoFilter;
      if (searchTerm.trim()) params.buscar = searchTerm.trim();
      const data = await guiaRemisionService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [empresaFilter, estadoFilter, searchTerm]);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);
  useEffect(() => { loadVehiculos(); }, [loadVehiculos]);
  useEffect(() => { loadTransportistas(); }, [loadTransportistas]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    const empresa = empresas.find(e => e.empresa_id === (empresaFilter || empresas[0]?.empresa_id));
    setForm({
      ...DEFAULT,
      empresa_id: empresaFilter || (empresas[0]?.empresa_id ?? ''),
      remitente_razon_social: empresa?.razon_social ?? '',
      remitente_ruc: empresa?.ruc ?? undefined,
      remitente_direccion: empresa?.direccion_fiscal ?? undefined,
    });
    setCreateOpen(true);
  };
  const openEdit = (row: GuiaRemision) => {
    setEditing(row);
    setEditForm({
      fecha_traslado: row.fecha_traslado,
      tipo_guia: row.tipo_guia,
      motivo_traslado: row.motivo_traslado,
      remitente_razon_social: row.remitente_razon_social,
      remitente_ruc: row.remitente_ruc ?? undefined,
      remitente_direccion: row.remitente_direccion ?? undefined,
      destinatario_razon_social: row.destinatario_razon_social,
      destinatario_ruc: row.destinatario_ruc ?? undefined,
      destinatario_direccion: row.destinatario_direccion ?? undefined,
      punto_partida: row.punto_partida,
      punto_llegada: row.punto_llegada,
      modalidad_transporte: row.modalidad_transporte,
      vehiculo_id: row.vehiculo_id ?? undefined,
      conductor_nombre: row.conductor_nombre ?? undefined,
      conductor_licencia: row.conductor_licencia ?? undefined,
      transportista_id: row.transportista_id ?? undefined,
      estado: row.estado,
      observaciones: row.observaciones ?? undefined,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id || !form.serie.trim() || !form.numero.trim() || !form.remitente_razon_social.trim() || !form.destinatario_razon_social.trim()) {
      toast.error('Completa empresa, serie, número, remitente y destinatario.');
      return;
    }
    setSubmitting(true);
    try {
      await guiaRemisionService.create(form);
      toast.success('Guía de remisión creada.');
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
      await guiaRemisionService.update(editing.guia_remision_id, editForm);
      toast.success('Guía de remisión actualizada.');
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
      title="Guías de Remisión"
      description="Gestión de guías de remisión electrónicas para ventas, compras, transferencias, etc."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white">
          <Plus className="h-4 w-4 mr-2" /> Crear guía
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
            placeholder="Buscar por serie, número o destinatario..."
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Serie-Número</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha Traslado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Destinatario</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Motivo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Vehículo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {error ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />{error}</td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay guías de remisión.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.guia_remision_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.serie}-{row.numero}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.fecha_traslado}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.destinatario_razon_social}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.motivo_traslado}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.vehiculo_placa ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        row.estado === 'emitida' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        row.estado === 'en_transito' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        row.estado === 'entregada' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                        row.estado === 'anulada' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                        {row.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/log/guias-remision/${row.guia_remision_id}/detalles`)} className="text-brand-primary hover:text-brand-primary/80" title="Ver detalles"><Eye className="h-4 w-4" /></Button>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Crear guía de remisión</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => {
                const empresa = empresas.find(emp => emp.empresa_id === e.target.value);
                setForm((p) => ({
                  ...p,
                  empresa_id: e.target.value,
                  remitente_razon_social: empresa?.razon_social ?? '',
                  remitente_ruc: empresa?.ruc ?? undefined,
                  remitente_direccion: empresa?.direccion_fiscal ?? undefined,
                }));
              }} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
              <div><Label>Serie *</Label><input type="text" value={form.serie} onChange={(e) => setForm((p) => ({ ...p, serie: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Número *</Label><input type="text" value={form.numero} onChange={(e) => setForm((p) => ({ ...p, numero: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Fecha Traslado *</Label><input type="date" value={form.fecha_traslado} onChange={(e) => setForm((p) => ({ ...p, fecha_traslado: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Tipo Guía</Label><select value={form.tipo_guia} onChange={(e) => setForm((p) => ({ ...p, tipo_guia: e.target.value as any }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{TIPOS_GUIA.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Motivo Traslado</Label><select value={form.motivo_traslado} onChange={(e) => setForm((p) => ({ ...p, motivo_traslado: e.target.value as any }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{MOTIVOS_TRASLADO.map((m) => <option key={m} value={m}>{m}</option>)}</select></div>
              <div className="md:col-span-2 border-t pt-4"><h3 className="text-sm font-semibold mb-3">Remitente</h3></div>
              <div className="md:col-span-2"><Label>Razón Social *</Label><input type="text" value={form.remitente_razon_social} onChange={(e) => setForm((p) => ({ ...p, remitente_razon_social: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>RUC</Label><input type="text" value={form.remitente_ruc ?? ''} onChange={(e) => setForm((p) => ({ ...p, remitente_ruc: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div className="md:col-span-2"><Label>Dirección</Label><input type="text" value={form.remitente_direccion ?? ''} onChange={(e) => setForm((p) => ({ ...p, remitente_direccion: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div className="md:col-span-2 border-t pt-4"><h3 className="text-sm font-semibold mb-3">Destinatario</h3></div>
              <div className="md:col-span-2"><Label>Razón Social *</Label><input type="text" value={form.destinatario_razon_social} onChange={(e) => setForm((p) => ({ ...p, destinatario_razon_social: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>RUC</Label><input type="text" value={form.destinatario_ruc ?? ''} onChange={(e) => setForm((p) => ({ ...p, destinatario_ruc: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div className="md:col-span-2"><Label>Dirección</Label><input type="text" value={form.destinatario_direccion ?? ''} onChange={(e) => setForm((p) => ({ ...p, destinatario_direccion: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div className="md:col-span-2 border-t pt-4"><h3 className="text-sm font-semibold mb-3">Transporte</h3></div>
              <div><Label>Punto Partida *</Label><input type="text" value={form.punto_partida} onChange={(e) => setForm((p) => ({ ...p, punto_partida: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Punto Llegada *</Label><input type="text" value={form.punto_llegada} onChange={(e) => setForm((p) => ({ ...p, punto_llegada: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Modalidad Transporte</Label><select value={form.modalidad_transporte} onChange={(e) => setForm((p) => ({ ...p, modalidad_transporte: e.target.value as any }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{MODALIDADES_TRANSPORTE.map((m) => <option key={m} value={m}>{m}</option>)}</select></div>
              {form.modalidad_transporte === 'privado' && (
                <>
                  <div><Label>Vehículo</Label><select value={form.vehiculo_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, vehiculo_id: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"><option value="">Seleccionar</option>{vehiculos.map((v) => <option key={v.vehiculo_id} value={v.vehiculo_id}>{v.placa} - {v.marca} {v.modelo}</option>)}</select></div>
                  <div><Label>Conductor</Label><input type="text" value={form.conductor_nombre ?? ''} onChange={(e) => setForm((p) => ({ ...p, conductor_nombre: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
                  <div><Label>Licencia Conductor</Label><input type="text" value={form.conductor_licencia ?? ''} onChange={(e) => setForm((p) => ({ ...p, conductor_licencia: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
                </>
              )}
              {form.modalidad_transporte === 'publico' && (
                <div><Label>Transportista</Label><select value={form.transportista_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, transportista_id: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"><option value="">Seleccionar</option>{transportistas.map((t) => <option key={t.transportista_id} value={t.transportista_id}>{t.razon_social}</option>)}</select></div>
              )}
              <div><Label>Total Bultos</Label><input type="number" min="0" value={form.total_bultos ?? ''} onChange={(e) => setForm((p) => ({ ...p, total_bultos: e.target.value ? parseInt(e.target.value) : undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Peso Total (kg)</Label><input type="number" step="0.01" min="0" value={form.peso_total_kg ?? ''} onChange={(e) => setForm((p) => ({ ...p, peso_total_kg: e.target.value ? parseFloat(e.target.value) : undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar guía de remisión</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Fecha Traslado</Label><input type="date" value={editForm.fecha_traslado ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_traslado: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Estado</Label><select value={editForm.estado ?? 'borrador'} onChange={(e) => setEditForm((p) => ({ ...p, estado: e.target.value as any }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}</select></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </LogPageLayout>
  );
}
