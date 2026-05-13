/**
 * Centros de Trabajo MFG — Listado y gestión. GET/POST/PUT /api/v1/mfg/centros-trabajo
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, Factory, Plus, Pencil, Search } from 'lucide-react';
import { empresaService, sucursalService, centroCostoService } from '@/features/org/services/org.service';
import { centroTrabajoService } from '../services/mfg.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { Sucursal, CentroCosto } from '@/features/org/types/org.types';
import type { CentroTrabajo, CentroTrabajoCreate, CentroTrabajoUpdate } from '../types/mfg.types';
import { MfgPageLayout } from '../components/MfgPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const TIPOS_CENTRO = ['maquina', 'linea_montaje', 'estacion_manual', 'celula_trabajo'] as const;
const ESTADOS_CENTRO = ['disponible', 'produccion', 'mantenimiento', 'averiado', 'inactivo'] as const;

const DEFAULT: CentroTrabajoCreate = {
  empresa_id: '',
  codigo: '',
  nombre: '',
  tipo_centro: 'maquina',
  es_activo: true,
};

export default function CentrosTrabajoPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [centrosCosto, setCentrosCosto] = useState<CentroCosto[]>([]);
  const [list, setList] = useState<CentroTrabajo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<CentroTrabajo | null>(null);
  const [form, setForm] = useState<CentroTrabajoCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<CentroTrabajoUpdate>({});
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

  const loadCentrosCosto = useCallback(async () => {
    if (!empresaFilter) { setCentrosCosto([]); return; }
    try {
      const data = await centroCostoService.list({ empresa_id: empresaFilter, solo_activos: true });
      setCentrosCosto(data);
    } catch {
      setCentrosCosto([]);
    }
  }, [empresaFilter]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { empresa_id?: string; estado_centro?: string; buscar?: string } = {};
      if (empresaFilter) params.empresa_id = empresaFilter;
      if (estadoFilter) params.estado_centro = estadoFilter;
      if (searchTerm.trim()) params.buscar = searchTerm.trim();
      const data = await centroTrabajoService.list(params);
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
  useEffect(() => { loadCentrosCosto(); }, [loadCentrosCosto]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    setForm({
      ...DEFAULT,
      empresa_id: (empresaFilter || empresas[0]?.empresa_id) ?? '',
    });
    setCreateOpen(true);
  };

  const openEdit = (row: CentroTrabajo) => {
    setEditing(row);
    setEditForm({
      codigo: row.codigo,
      nombre: row.nombre,
      descripcion: row.descripcion ?? undefined,
      sucursal_id: row.sucursal_id ?? undefined,
      ubicacion_fisica: row.ubicacion_fisica ?? undefined,
      tipo_centro: row.tipo_centro,
      capacidad_horas_dia: row.capacidad_horas_dia ?? undefined,
      capacidad_unidades_hora: row.capacidad_unidades_hora ?? undefined,
      eficiencia_promedio: row.eficiencia_promedio ?? undefined,
      costo_hora_maquina: row.costo_hora_maquina ?? undefined,
      costo_setup: row.costo_setup ?? undefined,
      centro_costo_id: row.centro_costo_id ?? undefined,
      estado_centro: row.estado_centro ?? undefined,
      es_activo: row.es_activo,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.empresa_id || !form.codigo.trim() || !form.nombre.trim()) {
      toast.error('Completa empresa, código y nombre.');
      return;
    }
    setSubmitting(true);
    try {
      await centroTrabajoService.create(form);
      toast.success('Centro de trabajo creado.');
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
      await centroTrabajoService.update(editing.centro_trabajo_id, editForm);
      toast.success('Centro de trabajo actualizado.');
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
      title="Centros de Trabajo"
      description="Máquinas, líneas de montaje y estaciones de producción."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!empresas.length}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo centro de trabajo
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
            {ESTADOS_CENTRO.map((s) => <option key={s} value={s}>{s}</option>)}
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ubicación</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><Factory className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay centros de trabajo.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.centro_trabajo_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.codigo}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.tipo_centro}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.ubicacion_fisica ?? row.sucursal_id ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.estado_centro ?? '—'}</td>
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
          <DialogHeader><DialogTitle>Nuevo centro de trabajo</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
              <div><Label>Código *</Label><input type="text" value={form.codigo} onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))} className={inputCls} required /></div>
              <div className="md:col-span-2"><Label>Nombre *</Label><input type="text" value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Descripción</Label><input type="text" value={form.descripcion ?? ''} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value || undefined }))} className={inputCls} /></div>
              <div><Label>Tipo</Label><select value={form.tipo_centro} onChange={(e) => setForm((p) => ({ ...p, tipo_centro: e.target.value }))} className={selectCls}>{TIPOS_CENTRO.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Sucursal</Label><select value={form.sucursal_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, sucursal_id: e.target.value || undefined }))} className={selectCls}><option value="">—</option>{sucursales.map((s) => <option key={s.sucursal_id} value={s.sucursal_id}>{s.nombre}</option>)}</select></div>
              <div><Label>Ubicación física</Label><input type="text" value={form.ubicacion_fisica ?? ''} onChange={(e) => setForm((p) => ({ ...p, ubicacion_fisica: e.target.value || undefined }))} className={inputCls} /></div>
              <div><Label>Centro de costo</Label><select value={form.centro_costo_id ?? ''} onChange={(e) => setForm((p) => ({ ...p, centro_costo_id: e.target.value || undefined }))} className={selectCls}><option value="">—</option>{centrosCosto.map((c) => <option key={c.centro_costo_id} value={c.centro_costo_id}>{c.nombre}</option>)}</select></div>
              <div><Label>Estado centro</Label><select value={form.estado_centro ?? 'disponible'} onChange={(e) => setForm((p) => ({ ...p, estado_centro: e.target.value }))} className={selectCls}>{ESTADOS_CENTRO.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={form.es_activo ?? true} onChange={(e) => setForm((p) => ({ ...p, es_activo: e.target.checked }))} className="rounded" /><Label>Activo</Label></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar centro de trabajo</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Código *</Label><input type="text" value={editForm.codigo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, codigo: e.target.value }))} className={inputCls} required /></div>
              <div className="md:col-span-2"><Label>Nombre *</Label><input type="text" value={editForm.nombre ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Tipo</Label><select value={editForm.tipo_centro ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, tipo_centro: e.target.value }))} className={selectCls}>{TIPOS_CENTRO.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Estado centro</Label><select value={editForm.estado_centro ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, estado_centro: e.target.value }))} className={selectCls}>{ESTADOS_CENTRO.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
              <div className="flex items-center gap-2"><input type="checkbox" checked={editForm.es_activo ?? false} onChange={(e) => setEditForm((p) => ({ ...p, es_activo: e.target.checked }))} className="rounded" /><Label>Activo</Label></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MfgPageLayout>
  );
}
