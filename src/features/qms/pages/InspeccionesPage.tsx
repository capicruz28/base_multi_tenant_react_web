/**
 * Inspecciones — Listado y gestión. GET/POST /api/v1/qms/inspecciones
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, SearchCheck, Plus, Pencil, Search } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import { productoService, unidadMedidaService } from '@/features/inv/services/inv.service';
import { planInspeccionService, inspeccionService } from '../services/qms.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { Producto } from '@/features/inv/types/inv.types';
import type { UnidadMedida } from '@/features/inv/types/inv.types';
import type { PlanInspeccion } from '../types/qms.types';
import type { Inspeccion, InspeccionCreate, InspeccionUpdate } from '../types/qms.types';
import { QmsPageLayout } from '../components/QmsPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const RESULTADOS = ['pendiente', 'aprobado', 'rechazado', 'aprobado_condicional'] as const;

const DEFAULT: InspeccionCreate = {
  empresa_id: '',
  numero_inspeccion: '',
  plan_inspeccion_id: '',
  producto_id: '',
  cantidad_total: 0,
  cantidad_inspeccionada: 0,
  unidad_medida_id: '',
  resultado: 'pendiente',
};

export default function InspeccionesPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [unidades, setUnidades] = useState<UnidadMedida[]>([]);
  const [planes, setPlanes] = useState<PlanInspeccion[]>([]);
  const [list, setList] = useState<Inspeccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [resultadoFilter, setResultadoFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Inspeccion | null>(null);
  const [form, setForm] = useState<InspeccionCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<InspeccionUpdate>({});
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

  const loadUnidades = useCallback(async () => {
    try {
      const data = await unidadMedidaService.list({ solo_activos: true });
      setUnidades(data);
    } catch {
      setUnidades([]);
    }
  }, []);

  const loadPlanes = useCallback(async () => {
    try {
      const data = await planInspeccionService.list({ solo_activos: true });
      setPlanes(data);
    } catch {
      setPlanes([]);
    }
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { empresa_id?: string; resultado?: string; buscar?: string } = {};
      if (empresaFilter) params.empresa_id = empresaFilter;
      if (resultadoFilter) params.resultado = resultadoFilter;
      if (searchTerm.trim()) params.buscar = searchTerm.trim();
      const data = await inspeccionService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [empresaFilter, resultadoFilter, searchTerm]);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);
  useEffect(() => { loadProductos(); }, [loadProductos]);
  useEffect(() => { loadUnidades(); }, [loadUnidades]);
  useEffect(() => { loadPlanes(); }, [loadPlanes]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    const empId = (empresaFilter || empresas[0]?.empresa_id) ?? '';
    const firstUm = unidades[0]?.unidad_medida_id ?? '';
    setForm({ ...DEFAULT, empresa_id: empId, unidad_medida_id: firstUm });
    setCreateOpen(true);
  };

  const openEdit = (row: Inspeccion) => {
    setEditing(row);
    setEditForm({
      cantidad_inspeccionada: row.cantidad_inspeccionada,
      cantidad_aprobada: row.cantidad_aprobada ?? undefined,
      cantidad_rechazada: row.cantidad_rechazada ?? undefined,
      cantidad_observada: row.cantidad_observada ?? undefined,
      defectos_criticos: row.defectos_criticos ?? undefined,
      defectos_mayores: row.defectos_mayores ?? undefined,
      defectos_menores: row.defectos_menores ?? undefined,
      resultado: (row.resultado as InspeccionUpdate['resultado']) ?? undefined,
      inspector_nombre: row.inspector_nombre ?? undefined,
      observaciones: row.observaciones ?? undefined,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id || !form.numero_inspeccion.trim() || !form.plan_inspeccion_id || !form.producto_id || !form.unidad_medida_id) {
      toast.error('Completa empresa, número, plan, producto y unidad de medida.');
      return;
    }
    if (form.cantidad_total <= 0 || form.cantidad_inspeccionada <= 0) {
      toast.error('Cantidad total e inspeccionada deben ser mayores a 0.');
      return;
    }
    setSubmitting(true);
    try {
      await inspeccionService.create(form);
      toast.success('Inspección creada.');
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
      await inspeccionService.update(editing.inspeccion_id, editForm);
      toast.success('Inspección actualizada.');
      setEditOpen(false);
      setEditing(null);
      fetchList();
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (s: string | null | undefined) => (s ? new Date(s).toLocaleString() : '-');

  return (
    <QmsPageLayout
      title="Inspecciones"
      description="Registrar resultados de inspección (aprobado / rechazado) según plan y producto."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!empresas.length || !planes.length || !productos.length || !unidades.length}>
          <Plus className="h-4 w-4 mr-2" /> Crear inspección
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
          <Label className="mr-2">Resultado</Label>
          <select value={resultadoFilter} onChange={(e) => setResultadoFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
            <option value="">Todos</option>
            {RESULTADOS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por número o observaciones..."
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Número</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Producto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Lote</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cant. / Resultado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><SearchCheck className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay inspecciones.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.inspeccion_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.numero_inspeccion}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{formatDate(row.fecha_inspeccion)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.producto_nombre ?? row.producto_codigo ?? row.producto_id}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.lote ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.cantidad_inspeccionada} / {row.resultado ?? 'pendiente'}</td>
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
          <DialogHeader><DialogTitle>Crear inspección</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
              <div><Label>Número inspección *</Label><input type="text" value={form.numero_inspeccion} onChange={(e) => setForm((p) => ({ ...p, numero_inspeccion: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Plan inspección *</Label><select value={form.plan_inspeccion_id} onChange={(e) => setForm((p) => ({ ...p, plan_inspeccion_id: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{planes.map((p) => <option key={p.plan_inspeccion_id} value={p.plan_inspeccion_id}>{p.codigo} – {p.nombre}</option>)}</select></div>
              <div><Label>Producto *</Label><select value={form.producto_id} onChange={(e) => setForm((p) => ({ ...p, producto_id: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{productos.map((p) => <option key={p.producto_id} value={p.producto_id}>{p.codigo_sku} – {p.nombre}</option>)}</select></div>
              <div><Label>Lote</Label><input type="text" value={form.lote ?? ''} onChange={(e) => setForm((p) => ({ ...p, lote: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Unidad de medida *</Label><select value={form.unidad_medida_id} onChange={(e) => setForm((p) => ({ ...p, unidad_medida_id: e.target.value }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required><option value="">Seleccionar</option>{unidades.map((u) => <option key={u.unidad_medida_id} value={u.unidad_medida_id}>{u.codigo}</option>)}</select></div>
              <div><Label>Cantidad total *</Label><input type="number" step="0.01" min="0" value={form.cantidad_total || ''} onChange={(e) => setForm((p) => ({ ...p, cantidad_total: parseFloat(e.target.value) || 0 }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Cantidad inspeccionada *</Label><input type="number" step="0.01" min="0" value={form.cantidad_inspeccionada || ''} onChange={(e) => setForm((p) => ({ ...p, cantidad_inspeccionada: parseFloat(e.target.value) || 0 }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" required /></div>
              <div><Label>Inspector</Label><input type="text" value={form.inspector_nombre ?? ''} onChange={(e) => setForm((p) => ({ ...p, inspector_nombre: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div className="md:col-span-2"><Label>Observaciones</Label><input type="text" value={form.observaciones ?? ''} onChange={(e) => setForm((p) => ({ ...p, observaciones: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar inspección</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Cantidad inspeccionada</Label><input type="number" step="0.01" min="0" value={editForm.cantidad_inspeccionada ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, cantidad_inspeccionada: e.target.value ? parseFloat(e.target.value) : undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Cantidad aprobada</Label><input type="number" step="0.01" min="0" value={editForm.cantidad_aprobada ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, cantidad_aprobada: e.target.value ? parseFloat(e.target.value) : undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Cantidad rechazada</Label><input type="number" step="0.01" min="0" value={editForm.cantidad_rechazada ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, cantidad_rechazada: e.target.value ? parseFloat(e.target.value) : undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
              <div><Label>Resultado</Label><select value={editForm.resultado ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, resultado: (e.target.value || undefined) as InspeccionUpdate['resultado'] }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"><option value="">—</option>{RESULTADOS.map((r) => <option key={r} value={r}>{r}</option>)}</select></div>
              <div className="md:col-span-2"><Label>Observaciones</Label><input type="text" value={editForm.observaciones ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, observaciones: e.target.value || undefined }))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm" /></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </QmsPageLayout>
  );
}
