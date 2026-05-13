/**
 * No Conformidades — Listado y gestión. GET/POST /api/v1/qms/no-conformidades
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, AlertTriangle, Plus, Pencil, Search } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import { productoService } from '@/features/inv/services/inv.service';
import { inspeccionService } from '../services/qms.service';
import { noConformidadService } from '../services/qms.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { Producto } from '@/features/inv/types/inv.types';
import type { Inspeccion } from '../types/qms.types';
import type { NoConformidad, NoConformidadCreate, NoConformidadUpdate } from '../types/qms.types';
import { QmsPageLayout } from '../components/QmsPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const ORIGENES = ['inspeccion', 'reclamo_cliente', 'auditoria', 'proceso'] as const;
const TIPOS_NC = ['critica', 'mayor', 'menor'] as const;
const ESTADOS = ['abierta', 'en_analisis', 'en_accion', 'cerrada', 'cancelada'] as const;

const DEFAULT: NoConformidadCreate = {
  empresa_id: '',
  numero_nc: '',
  origen: 'inspeccion',
  descripcion_nc: '',
  tipo_nc: 'mayor',
  estado: 'abierta',
};

export default function NoConformidadesPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [inspecciones, setInspecciones] = useState<Inspeccion[]>([]);
  const [list, setList] = useState<NoConformidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [origenFilter, setOrigenFilter] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<NoConformidad | null>(null);
  const [form, setForm] = useState<NoConformidadCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<NoConformidadUpdate>({});
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

  const loadProductos = useCallback(async () => {
    try {
      const data = await productoService.list({ solo_activos: true });
      setProductos(data);
    } catch {
      setProductos([]);
    }
  }, []);

  const loadInspecciones = useCallback(async () => {
    try {
      const data = await inspeccionService.list({});
      setInspecciones(data);
    } catch {
      setInspecciones([]);
    }
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { empresa_id?: string; origen?: string; estado?: string; buscar?: string } = {};
      if (empresaFilter) params.empresa_id = empresaFilter;
      if (origenFilter) params.origen = origenFilter;
      if (estadoFilter) params.estado = estadoFilter;
      if (searchTerm.trim()) params.buscar = searchTerm.trim();
      const data = await noConformidadService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [empresaFilter, origenFilter, estadoFilter, searchTerm]);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);
  useEffect(() => { loadProductos(); }, [loadProductos]);
  useEffect(() => { loadInspecciones(); }, [loadInspecciones]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    setForm({ ...DEFAULT, empresa_id: (empresaFilter || empresas[0]?.empresa_id) ?? '' });
    setCreateOpen(true);
  };

  const openEdit = (row: NoConformidad) => {
    setEditing(row);
    setEditForm({
      descripcion_nc: row.descripcion_nc,
      tipo_nc: row.tipo_nc as NoConformidadUpdate['tipo_nc'],
      area_responsable: row.area_responsable ?? undefined,
      analisis_causa_raiz: row.analisis_causa_raiz ?? undefined,
      causa_raiz_identificada: row.causa_raiz_identificada ?? undefined,
      accion_inmediata: row.accion_inmediata ?? undefined,
      accion_correctiva: row.accion_correctiva ?? undefined,
      accion_preventiva: row.accion_preventiva ?? undefined,
      fecha_compromiso_cierre: row.fecha_compromiso_cierre ?? undefined,
      estado: (row.estado as NoConformidadUpdate['estado']) ?? undefined,
      verificacion_eficacia: row.verificacion_eficacia ?? undefined,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id || !form.numero_nc.trim() || !form.descripcion_nc.trim()) {
      toast.error('Completa empresa, número NC y descripción.');
      return;
    }
    setSubmitting(true);
    try {
      await noConformidadService.create(form);
      toast.success('No conformidad creada.');
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
      await noConformidadService.update(editing.no_conformidad_id, editForm);
      toast.success('No conformidad actualizada.');
      setEditOpen(false);
      setEditing(null);
      fetchList();
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (s: string | null | undefined) => (s ? new Date(s).toLocaleDateString() : '-');

  return (
    <QmsPageLayout
      title="No Conformidades"
      description="Gestionar defectos detectados con análisis de causa raíz y acciones correctivas/preventivas."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!empresas.length}>
          <Plus className="h-4 w-4 mr-2" /> Crear no conformidad
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
          <Label className="mr-2">Origen</Label>
          <select value={origenFilter} onChange={(e) => setOrigenFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
            <option value="">Todos</option>
            {ORIGENES.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <Label className="mr-2">Estado</Label>
          <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
            <option value="">Todos</option>
            {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por número o descripción..."
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Número NC</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Origen</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo / Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Descripción</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><AlertTriangle className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay no conformidades.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.no_conformidad_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.numero_nc}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{formatDate(row.fecha_deteccion)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.origen}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.tipo_nc} / {row.estado ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate" title={row.descripcion_nc}>{row.descripcion_nc}</td>
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
          <DialogHeader><DialogTitle>Crear no conformidad</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
              <div><Label>Número NC *</Label><input type="text" value={form.numero_nc} onChange={(e) => setForm((p) => ({ ...p, numero_nc: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Origen *</Label><select value={form.origen} onChange={(e) => setForm((p) => ({ ...p, origen: e.target.value as NoConformidadCreate['origen'] }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{ORIGENES.map((o) => <option key={o} value={o}>{o}</option>)}</select></div>
              {form.origen === 'inspeccion' && <div><Label>Inspección</Label><select value={form.inspeccion_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, inspeccion_id: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"><option value="">—</option>{inspecciones.map((i) => <option key={i.inspeccion_id} value={i.inspeccion_id}>{i.numero_inspeccion}</option>)}</select></div>}
              <div><Label>Producto</Label><select value={form.producto_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, producto_id: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"><option value="">—</option>{productos.map((p) => <option key={p.producto_id} value={p.producto_id}>{p.codigo_sku} – {p.nombre}</option>)}</select></div>
              <div><Label>Lote</Label><input type="text" value={form.lote ?? ''} onChange={(e) => setForm((p) => ({ ...p, lote: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Cantidad afectada</Label><input type="number" step="0.01" min="0" value={form.cantidad_afectada ?? ''} onChange={(e) => setForm((p) => ({ ...p, cantidad_afectada: e.target.value ? parseFloat(e.target.value) : undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Tipo NC *</Label><select value={form.tipo_nc} onChange={(e) => setForm((p) => ({ ...p, tipo_nc: e.target.value as NoConformidadCreate['tipo_nc'] }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{TIPOS_NC.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Área responsable</Label><input type="text" value={form.area_responsable ?? ''} onChange={(e) => setForm((p) => ({ ...p, area_responsable: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div className="md:col-span-2"><Label>Descripción NC *</Label><textarea value={form.descripcion_nc} onChange={(e) => setForm((p) => ({ ...p, descripcion_nc: e.target.value }))} rows={3} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Estado</Label><select value={form.estado ?? 'abierta'} onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value as NoConformidadCreate['estado'] }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar no conformidad</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2"><Label>Descripción NC *</Label><textarea value={editForm.descripcion_nc ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, descripcion_nc: e.target.value }))} rows={2} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Tipo NC</Label><select value={editForm.tipo_nc ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, tipo_nc: e.target.value as NoConformidadUpdate['tipo_nc'] }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{TIPOS_NC.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Estado</Label><select value={editForm.estado ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, estado: e.target.value as NoConformidadUpdate['estado'] }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">{ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
              <div><Label>Área responsable</Label><input type="text" value={editForm.area_responsable ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, area_responsable: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Fecha compromiso cierre</Label><input type="date" value={editForm.fecha_compromiso_cierre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, fecha_compromiso_cierre: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div className="md:col-span-2"><Label>Análisis causa raíz</Label><textarea value={editForm.analisis_causa_raiz ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, analisis_causa_raiz: e.target.value || undefined }))} rows={2} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div className="md:col-span-2"><Label>Causa raíz identificada</Label><input type="text" value={editForm.causa_raiz_identificada ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, causa_raiz_identificada: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div className="md:col-span-2"><Label>Acción inmediata</Label><textarea value={editForm.accion_inmediata ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, accion_inmediata: e.target.value || undefined }))} rows={2} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div className="md:col-span-2"><Label>Acción correctiva</Label><textarea value={editForm.accion_correctiva ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, accion_correctiva: e.target.value || undefined }))} rows={2} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div className="md:col-span-2"><Label>Acción preventiva</Label><textarea value={editForm.accion_preventiva ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, accion_preventiva: e.target.value || undefined }))} rows={2} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div className="md:col-span-2"><Label>Verificación eficacia</Label><textarea value={editForm.verificacion_eficacia ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, verificacion_eficacia: e.target.value || undefined }))} rows={2} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </QmsPageLayout>
  );
}
