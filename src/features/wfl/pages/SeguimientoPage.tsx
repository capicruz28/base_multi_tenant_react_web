/**
 * Seguimiento WFL — Estado de aprobaciones. Lista flujos activos; cuando existan
 * instancias de aprobación en otros módulos, integrar con esos endpoints.
 */
import { useState, useEffect, useCallback } from 'react';
import { Loader, ClipboardList } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import { flujosTrabajoService } from '../services/wfl.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { FlujoTrabajoRead } from '../types/wfl.types';
import { WflPageLayout } from '../components/WflPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Label } from '@/shared/components/ui/label';

export default function SeguimientoPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [list, setList] = useState<FlujoTrabajoRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [tipoFilter, setTipoFilter] = useState<string>('');

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
      const params: { empresa_id?: string; tipo_flujo?: string; es_activo: boolean } = { es_activo: true };
      if (empresaFilter) params.empresa_id = empresaFilter;
      if (tipoFilter) params.tipo_flujo = tipoFilter;
      const data = await flujosTrabajoService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [empresaFilter, tipoFilter]);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const formatDateTime = (s: string | null | undefined) => (s ? new Date(s).toLocaleString() : '—');
  const selectCls = 'mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm';

  return (
    <WflPageLayout
      title="Seguimiento"
      description="Flujos de trabajo activos. Las instancias de aprobación (ej. OC pendientes) se mostrarán cuando estén integradas con los módulos correspondientes."
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
            <option value="aprobacion">Aprobación</option>
            <option value="revision">Revisión</option>
            <option value="notificacion">Notificación</option>
          </select>
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
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Módulo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Creación</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay flujos activos o no hay instancias de aprobación registradas aún.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.flujo_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.codigo_flujo ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.nombre ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.tipo_flujo ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.modulo_aplicable ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{formatDateTime(row.fecha_creacion)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </WflPageLayout>
  );
}
