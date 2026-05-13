/**
 * Dashboards BI — Lista reportes tipo 'dashboard'. Los widgets se renderizan según
 * configuracion_json cuando exista endpoint de ejecución o integración.
 */
import { useState, useEffect, useCallback } from 'react';
import { Loader, LayoutDashboard } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import { reportesService } from '../services/bi.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { ReporteRead } from '../types/bi.types';
import { BiPageLayout } from '../components/BiPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Label } from '@/shared/components/ui/label';

export default function DashboardsPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [list, setList] = useState<ReporteRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [moduloFilter, setModuloFilter] = useState<string>('');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('');

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
      const params: { empresa_id?: string; tipo_reporte: string; modulo_origen?: string; categoria?: string; es_activo?: boolean } = { tipo_reporte: 'dashboard', es_activo: true };
      if (empresaFilter) params.empresa_id = empresaFilter;
      if (moduloFilter) params.modulo_origen = moduloFilter;
      if (categoriaFilter.trim()) params.categoria = categoriaFilter.trim();
      const data = await reportesService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [empresaFilter, moduloFilter, categoriaFilter]);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const formatDateTime = (s: string | null | undefined) => (s ? new Date(s).toLocaleString() : '—');
  const selectCls = 'mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm';
  const MODULOS = ['INV', 'SLS', 'FIN', 'ORG', 'PUR', 'HCM', 'BDG', 'PM', 'SVC', 'TKT', 'DMS', 'WFL', 'MFG', 'CRM', ''];

  return (
    <BiPageLayout
      title="Dashboards"
      description="Vista de reportes tipo dashboard. Los KPIs y gráficos se cargarán cuando exista integración con el endpoint de ejecución."
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
          <Label className="mr-2">Módulo</Label>
          <select value={moduloFilter} onChange={(e) => setModuloFilter(e.target.value)} className={selectCls}>
            <option value="">Todos</option>
            {MODULOS.filter(Boolean).map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <Label className="mr-2">Categoría</Label>
          <input type="text" placeholder="ventas, inventarios..." value={categoriaFilter} onChange={(e) => setCategoriaFilter(e.target.value)} className={selectCls} />
        </div>
        <div className="flex items-end">
          <button type="button" onClick={fetchList} className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-md text-sm font-medium">
            Actualizar
          </button>
        </div>
      </div>
      {loading && <div className="flex justify-center py-12"><Loader className="h-8 w-8 animate-spin text-brand-primary" /></div>}
      {error && !loading && <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">{error}</p>}
      {!loading && !error && (
        <>
          {list.length === 0 ? (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-12 text-center">
              <LayoutDashboard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400">No hay dashboards configurados. Cree reportes con tipo &quot;dashboard&quot; en Reportes.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {list.map((r) => (
                <div key={r.reporte_id} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{r.nombre ?? r.codigo_reporte}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{r.codigo_reporte} · {r.modulo_origen ?? '—'} {r.categoria ? `· ${r.categoria}` : ''}</p>
                      {r.descripcion && <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">{r.descripcion}</p>}
                    </div>
                    <LayoutDashboard className="h-8 w-8 text-brand-primary flex-shrink-0" />
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-400 dark:text-gray-500">Creado: {formatDateTime(r.fecha_creacion)}</p>
                    {r.configuracion_json && (
                      <details className="mt-2">
                        <summary className="text-xs text-brand-primary cursor-pointer">Ver configuración JSON</summary>
                        <pre className="mt-1 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto max-h-24 overflow-y-auto">{r.configuracion_json}</pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </BiPageLayout>
  );
}
