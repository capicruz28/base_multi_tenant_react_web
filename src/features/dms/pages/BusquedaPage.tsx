/**
 * Búsqueda DMS — Buscar documentos por nombre, tipo, categoría, carpeta, etiquetas.
 * Consume GET /dms/documentos con query params; filtro por fecha en frontend.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader, Search as SearchIcon } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import { documentosService } from '../services/dms.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { DocumentoDms } from '../types/dms.types';
import { DmsPageLayout } from '../components/DmsPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Label } from '@/shared/components/ui/label';

const TIPOS_DOCUMENTO = ['contrato', 'factura', 'reporte', 'certificado', 'manual', 'politica', 'otro'] as const;

function formatBytes(n: number | null | undefined): string {
  if (n == null || n === 0) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function BusquedaPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [list, setList] = useState<DocumentoDms[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [buscar, setBuscar] = useState<string>('');
  const [tipoFilter, setTipoFilter] = useState<string>('');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('');
  const [carpetaFilter, setCarpetaFilter] = useState<string>('');
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');

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
      const params: { empresa_id?: string; tipo_documento?: string; categoria?: string; carpeta?: string; buscar?: string } = {};
      if (empresaFilter) params.empresa_id = empresaFilter;
      if (tipoFilter) params.tipo_documento = tipoFilter;
      if (categoriaFilter.trim()) params.categoria = categoriaFilter.trim();
      if (carpetaFilter.trim()) params.carpeta = carpetaFilter.trim();
      if (buscar.trim()) params.buscar = buscar.trim();
      const data = await documentosService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [empresaFilter, tipoFilter, categoriaFilter, carpetaFilter, buscar]);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const filteredByDate = useMemo(() => {
    if (!fechaDesde && !fechaHasta) return list;
    const desde = fechaDesde ? new Date(fechaDesde).getTime() : 0;
    const hasta = fechaHasta ? new Date(fechaHasta + 'T23:59:59').getTime() : Number.MAX_SAFE_INTEGER;
    return list.filter((d) => {
      const t = d.fecha_creacion ? new Date(d.fecha_creacion).getTime() : 0;
      return t >= desde && t <= hasta;
    });
  }, [list, fechaDesde, fechaHasta]);

  const formatDateTime = (s: string | null | undefined) => (s ? new Date(s).toLocaleString() : '—');
  const selectCls = 'mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm';
  const inputCls = 'mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm';

  return (
    <DmsPageLayout
      title="Búsqueda de Documentos"
      description="Buscar documentos por nombre, tipo, categoría, carpeta o fecha."
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
        <div className="flex-1 min-w-[200px]">
          <Label className="mr-2">Buscar (nombre, descripción)</Label>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Texto a buscar..." value={buscar} onChange={(e) => setBuscar(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchList()} className={`pl-9 w-full ${inputCls}`} />
          </div>
        </div>
        <div>
          <Label className="mr-2">Tipo</Label>
          <select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)} className={selectCls}>
            <option value="">Todos</option>
            {TIPOS_DOCUMENTO.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <Label className="mr-2">Categoría</Label>
          <input type="text" placeholder="Categoría" value={categoriaFilter} onChange={(e) => setCategoriaFilter(e.target.value)} className={inputCls} />
        </div>
        <div>
          <Label className="mr-2">Carpeta</Label>
          <input type="text" placeholder="Carpeta" value={carpetaFilter} onChange={(e) => setCarpetaFilter(e.target.value)} className={inputCls} />
        </div>
        <div>
          <Label className="mr-2">Fecha desde</Label>
          <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className={inputCls} />
        </div>
        <div>
          <Label className="mr-2">Fecha hasta</Label>
          <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className={inputCls} />
        </div>
        <div className="flex items-end">
          <button type="button" onClick={fetchList} className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-md text-sm font-medium">
            Buscar
          </button>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Categoría</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Carpeta</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tamaño</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Creación</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredByDate.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><SearchIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />No se encontraron documentos.</td></tr>
              ) : (
                filteredByDate.map((row) => (
                  <tr key={row.documento_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.codigo_documento ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.nombre_archivo ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.tipo_documento ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.categoria ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.carpeta ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">{formatBytes(row.tamano_bytes)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{formatDateTime(row.fecha_creacion)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </DmsPageLayout>
  );
}
