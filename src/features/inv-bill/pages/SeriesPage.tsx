/**
 * Series de Comprobantes — Configuración de series por tipo de comprobante.
 * GET/POST /api/v1/inv-bill/series
 */
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, FileText, Plus, Pencil } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import { sucursalService } from '@/features/org/services/org.service';
import { serieComprobanteService } from '../services/inv-bill.service';
import type { Empresa, Sucursal } from '@/features/org/types/org.types';
import type { SerieComprobante, SerieComprobanteCreate, SerieComprobanteUpdate } from '../types/inv-bill.types';
import { InvBillPageLayout } from '../components/InvBillPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const TIPOS_COMPROBANTE = [
  { value: '01', label: '01 - Factura' },
  { value: '03', label: '03 - Boleta de Venta' },
  { value: '07', label: '07 - Nota de Crédito' },
  { value: '08', label: '08 - Nota de Débito' },
] as const;

const DEFAULT: SerieComprobanteCreate = {
  empresa_id: '',
  tipo_comprobante: '01',
  serie: '',
  numero_actual: 0,
  numero_inicial: 1,
  numero_final: null,
  sucursal_id: null,
  punto_venta_id: null,
  es_electronica: true,
  requiere_autorizacion_sunat: true,
  es_activo: true,
  fecha_activacion: new Date().toISOString().split('T')[0],
};

export default function SeriesPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [list, setList] = useState<SerieComprobante[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [tipoFilter, setTipoFilter] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<SerieComprobante | null>(null);
  const [form, setForm] = useState<SerieComprobanteCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<SerieComprobanteUpdate>({});
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
    if (!empresaFilter) return;
    try {
      const data = await sucursalService.list({ empresa_id: empresaFilter, solo_activos: true });
      setSucursales(data);
    } catch {
      setSucursales([]);
    }
  }, [empresaFilter]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { solo_activos: true };
      if (empresaFilter) params.empresa_id = empresaFilter;
      if (tipoFilter) params.tipo_comprobante = tipoFilter;
      const data = await serieComprobanteService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [empresaFilter, tipoFilter]);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);
  useEffect(() => { loadSucursales(); }, [loadSucursales]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    setForm({ ...DEFAULT, empresa_id: empresaFilter || (empresas[0]?.empresa_id ?? '') });
    setCreateOpen(true);
  };
  const openEdit = (row: SerieComprobante) => {
    setEditing(row);
    setEditForm({
      numero_actual: row.numero_actual ?? undefined,
      es_activo: row.es_activo,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id || !form.tipo_comprobante || !form.serie.trim()) {
      toast.error('Completa empresa, tipo de comprobante y serie.');
      return;
    }
    setSubmitting(true);
    try {
      await serieComprobanteService.create(form);
      toast.success('Serie creada.');
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
      await serieComprobanteService.update(editing.serie_id, editForm);
      toast.success('Serie actualizada.');
      setEditOpen(false);
      setEditing(null);
      fetchList();
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const tipoNombre = (tipo: string | null | undefined) => {
    const t = TIPOS_COMPROBANTE.find((tc) => tc.value === tipo);
    return t ? t.label : tipo ?? '-';
  };

  return (
    <InvBillPageLayout
      title="Series de Comprobantes"
      description="Crear series por tipo de comprobante (Factura, Boleta, NC, ND). Configurar numeración inicial y límites."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!empresas.length}>
          <Plus className="h-4 w-4 mr-2" /> Crear serie
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
          <Label className="mr-2">Tipo</Label>
          <select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
            <option value="">Todos</option>
            {TIPOS_COMPROBANTE.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Serie</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Número Actual</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Número Inicial</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Electrónica</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay series.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.serie_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{tipoNombre(row.tipo_comprobante)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.serie}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.numero_actual ?? 0}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.numero_inicial ?? 1}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.es_electronica ? 'Sí' : 'No'}</td>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Crear serie de comprobante</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
              <div><Label>Tipo Comprobante *</Label><select value={form.tipo_comprobante} onChange={(e) => setForm((p) => ({ ...p, tipo_comprobante: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required>{TIPOS_COMPROBANTE.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
              <div><Label>Serie *</Label><input type="text" value={form.serie} onChange={(e) => setForm((p) => ({ ...p, serie: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required placeholder="F001" /></div>
              <div><Label>Número Inicial</Label><input type="number" value={form.numero_inicial ?? 1} onChange={(e) => setForm((p) => ({ ...p, numero_inicial: parseInt(e.target.value) || 1 }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Número Actual</Label><input type="number" value={form.numero_actual ?? 0} onChange={(e) => setForm((p) => ({ ...p, numero_actual: parseInt(e.target.value) || 0 }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Número Final</Label><input type="number" value={form.numero_final ?? ''} onChange={(e) => setForm((p) => ({ ...p, numero_final: e.target.value ? parseInt(e.target.value) : null }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Sucursal</Label><select value={form.sucursal_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, sucursal_id: e.target.value || null }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"><option value="">Ninguna</option>{sucursales.map((s) => <option key={s.sucursal_id} value={s.sucursal_id}>{s.nombre}</option>)}</select></div>
              <div><Label>Fecha Activación</Label><input type="date" value={form.fecha_activacion ?? ''} onChange={(e) => setForm((p) => ({ ...p, fecha_activacion: e.target.value || null }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div className="md:col-span-2"><label className="flex items-center gap-2"><input type="checkbox" checked={form.es_electronica} onChange={(e) => setForm((p) => ({ ...p, es_electronica: e.target.checked }))} className="rounded" /> Electrónica</label></div>
              <div className="md:col-span-2"><label className="flex items-center gap-2"><input type="checkbox" checked={form.requiere_autorizacion_sunat} onChange={(e) => setForm((p) => ({ ...p, requiere_autorizacion_sunat: e.target.checked }))} className="rounded" /> Requiere Autorización SUNAT</label></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Editar serie de comprobante</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Número Actual</Label><input type="number" value={editForm.numero_actual ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, numero_actual: e.target.value ? parseInt(e.target.value) : undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </InvBillPageLayout>
  );
}
