/**
 * Documentos DMS — Gestión documental (metadatos). GET/POST/PUT /api/v1/dms/documentos
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Loader, FileText, Plus, Pencil, Search } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import { documentosService } from '../services/dms.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { DocumentoDms, DocumentoDmsCreate, DocumentoDmsUpdate } from '../types/dms.types';
import { DmsPageLayout } from '../components/DmsPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const TIPOS_DOCUMENTO = ['contrato', 'factura', 'reporte', 'certificado', 'manual', 'politica', 'otro'] as const;
const NIVELES_ACCESO = ['publico', 'general', 'restringido', 'confidencial'] as const;
const ESTADOS = ['activo', 'archivado', 'eliminado'] as const;

const DEFAULT: DocumentoDmsCreate = {
  empresa_id: '',
  nombre_archivo: '',
  tipo_documento: 'contrato',
  ruta_archivo: '',
  nivel_acceso: 'general',
  estado: 'activo',
};

function formatBytes(n: number | null | undefined): string {
  if (n == null || n === 0) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentosPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [list, setList] = useState<DocumentoDms[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [tipoFilter, setTipoFilter] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<DocumentoDms | null>(null);
  const [form, setForm] = useState<DocumentoDmsCreate>(DEFAULT);
  const [editForm, setEditForm] = useState<DocumentoDmsUpdate>({});
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

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { empresa_id?: string; tipo_documento?: string; estado?: string; buscar?: string } = {};
      if (empresaFilter) params.empresa_id = empresaFilter;
      if (tipoFilter) params.tipo_documento = tipoFilter;
      if (estadoFilter) params.estado = estadoFilter;
      if (searchTerm.trim()) params.buscar = searchTerm.trim();
      const data = await documentosService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [empresaFilter, tipoFilter, estadoFilter, searchTerm]);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openCreate = () => {
    setForm({
      ...DEFAULT,
      empresa_id: (empresaFilter || empresas[0]?.empresa_id) ?? '',
      ruta_archivo: '/',
    });
    setCreateOpen(true);
  };

  const openEdit = (row: DocumentoDms) => {
    setEditing(row);
    setEditForm({
      codigo_documento: row.codigo_documento ?? undefined,
      nombre_archivo: row.nombre_archivo ?? undefined,
      descripcion: row.descripcion ?? undefined,
      tipo_documento: row.tipo_documento ?? undefined,
      categoria: row.categoria ?? undefined,
      ruta_archivo: row.ruta_archivo ?? undefined,
      tamano_bytes: row.tamano_bytes ?? undefined,
      extension: row.extension ?? undefined,
      carpeta: row.carpeta ?? undefined,
      tags: row.tags ?? undefined,
      nivel_acceso: row.nivel_acceso ?? undefined,
      estado: row.estado ?? undefined,
    });
    setEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await documentosService.create(form);
      toast.success('Documento registrado.');
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
      await documentosService.update(editing.documento_id, editForm);
      toast.success('Documento actualizado.');
      setEditOpen(false);
      setEditing(null);
      fetchList();
    } catch (err) {
      toast.error(getErrorMessage(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateTime = (s: string | null | undefined) => (s ? new Date(s).toLocaleString() : '—');
  const inputCls = 'mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm';
  const selectCls = 'mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm';

  return (
    <DmsPageLayout
      title="Documentos"
      description="Registro de documentos (metadatos). La subida del archivo se gestiona por almacenamiento o endpoint específico."
      action={
        <Button onClick={openCreate} className="bg-brand-primary hover:bg-brand-primary-hover text-white" disabled={!empresas.length}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo documento
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
            {TIPOS_DOCUMENTO.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <Label className="mr-2">Estado</Label>
          <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} className={selectCls}>
            <option value="">Todos</option>
            {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <Label className="mr-2">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Nombre, descripción..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`pl-9 w-full ${inputCls}`} />
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nombre archivo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Carpeta</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tamaño</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Creación</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay documentos.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.documento_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.codigo_documento ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.nombre_archivo ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.tipo_documento ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.carpeta ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">{formatBytes(row.tamano_bytes)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.estado ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{formatDateTime(row.fecha_creacion)}</td>
                    <td className="px-4 py-3 text-center"><Button variant="ghost" size="icon" onClick={() => openEdit(row)} className="text-brand-primary hover:text-brand-primary/80"><Pencil className="h-4 w-4" /></Button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nuevo documento (metadatos)</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Empresa *</Label><select value={form.empresa_id} onChange={(e) => setForm((p) => ({ ...p, empresa_id: e.target.value }))} className={selectCls} required><option value="">Seleccionar</option>{empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}</select></div>
              <div><Label>Código documento</Label><input type="text" value={form.codigo_documento ?? ''} onChange={(e) => setForm((p) => ({ ...p, codigo_documento: e.target.value || undefined }))} className={inputCls} /></div>
              <div className="md:col-span-2"><Label>Nombre archivo *</Label><input type="text" value={form.nombre_archivo} onChange={(e) => setForm((p) => ({ ...p, nombre_archivo: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Tipo documento *</Label><select value={form.tipo_documento} onChange={(e) => setForm((p) => ({ ...p, tipo_documento: e.target.value }))} className={selectCls} required>{TIPOS_DOCUMENTO.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Categoría</Label><input type="text" value={form.categoria ?? ''} onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value || undefined }))} className={inputCls} /></div>
              <div className="md:col-span-2"><Label>Ruta archivo *</Label><input type="text" value={form.ruta_archivo} onChange={(e) => setForm((p) => ({ ...p, ruta_archivo: e.target.value }))} className={inputCls} required placeholder="/carpeta/archivo.pdf" /></div>
              <div><Label>Tamaño (bytes)</Label><input type="number" min={0} value={form.tamano_bytes ?? ''} onChange={(e) => setForm((p) => ({ ...p, tamano_bytes: e.target.value ? parseInt(e.target.value, 10) : undefined }))} className={inputCls} /></div>
              <div><Label>Extensión</Label><input type="text" value={form.extension ?? ''} onChange={(e) => setForm((p) => ({ ...p, extension: e.target.value || undefined }))} className={inputCls} placeholder="pdf" /></div>
              <div><Label>Carpeta</Label><input type="text" value={form.carpeta ?? ''} onChange={(e) => setForm((p) => ({ ...p, carpeta: e.target.value || undefined }))} className={inputCls} /></div>
              <div><Label>Nivel acceso</Label><select value={form.nivel_acceso ?? 'general'} onChange={(e) => setForm((p) => ({ ...p, nivel_acceso: e.target.value as DocumentoDmsCreate['nivel_acceso'] }))} className={selectCls}>{NIVELES_ACCESO.map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
              <div><Label>Estado</Label><select value={form.estado ?? 'activo'} onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value as DocumentoDmsCreate['estado'] }))} className={selectCls}>{ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            </div>
            <div><Label>Descripción</Label><textarea value={form.descripcion ?? ''} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value || undefined }))} className={inputCls} rows={2} /></div>
            <div><Label>Tags (JSON array, ej. ["tag1","tag2"])</Label><input type="text" value={form.tags ?? ''} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value || undefined }))} className={inputCls} /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Crear</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar documento</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Código documento</Label><input type="text" value={editForm.codigo_documento ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, codigo_documento: e.target.value || undefined }))} className={inputCls} /></div>
              <div><Label>Nombre archivo *</Label><input type="text" value={editForm.nombre_archivo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nombre_archivo: e.target.value }))} className={inputCls} required /></div>
              <div><Label>Tipo documento</Label><select value={editForm.tipo_documento ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, tipo_documento: e.target.value || undefined }))} className={selectCls}>{TIPOS_DOCUMENTO.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><Label>Categoría</Label><input type="text" value={editForm.categoria ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, categoria: e.target.value || undefined }))} className={inputCls} /></div>
              <div><Label>Ruta archivo</Label><input type="text" value={editForm.ruta_archivo ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, ruta_archivo: e.target.value || undefined }))} className={inputCls} /></div>
              <div><Label>Carpeta</Label><input type="text" value={editForm.carpeta ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, carpeta: e.target.value || undefined }))} className={inputCls} /></div>
              <div><Label>Nivel acceso</Label><select value={editForm.nivel_acceso ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, nivel_acceso: e.target.value || undefined }))} className={selectCls}>{NIVELES_ACCESO.map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
              <div><Label>Estado</Label><select value={editForm.estado ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, estado: e.target.value || undefined }))} className={selectCls}>{ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            </div>
            <div><Label>Descripción</Label><textarea value={editForm.descripcion ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, descripcion: e.target.value || undefined }))} className={inputCls} rows={2} /></div>
            <div><Label>Tags (JSON array)</Label><input type="text" value={editForm.tags ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, tags: e.target.value || undefined }))} className={inputCls} /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover text-white">Guardar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DmsPageLayout>
  );
}
