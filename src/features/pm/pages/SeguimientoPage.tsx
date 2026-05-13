/**
 * Seguimiento PM — Comparativa presupuesto vs costo real y % avance. Solo lectura.
 * Consume GET /pm/proyectos; % ejecución = (costo_real / presupuesto) * 100 en frontend.
 */
import { useState, useEffect, useCallback } from 'react';
import { Loader, TrendingUp, AlertTriangle } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import { proyectosService } from '../services/pm.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { Proyecto } from '../types/pm.types';
import { PmPageLayout } from '../components/PmPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Label } from '@/shared/components/ui/label';

function porcentajeEjecucion(presupuesto: number | null | undefined, costoReal: number | null | undefined): number {
  const p = presupuesto ?? 0;
  if (p <= 0) return 0;
  return ((costoReal ?? 0) / p) * 100;
}

function desviacion(presupuesto: number | null | undefined, costoReal: number | null | undefined): number {
  return (costoReal ?? 0) - (presupuesto ?? 0);
}

export default function SeguimientoPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [list, setList] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');

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
      const params: { empresa_id?: string; estado?: string } = {};
      if (empresaFilter) params.empresa_id = empresaFilter;
      if (estadoFilter) params.estado = estadoFilter;
      const data = await proyectosService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [empresaFilter, estadoFilter]);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const alertas = list.filter((p) => (p.presupuesto ?? 0) > 0 && (p.costo_real ?? 0) > (p.presupuesto ?? 0));
  const selectCls = 'mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm';

  return (
    <PmPageLayout
      title="Seguimiento de Proyectos"
      description="Comparativa presupuesto vs costo real y porcentaje de ejecución."
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
          <Label className="mr-2">Estado</Label>
          <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} className={selectCls}>
            <option value="">Todos</option>
            <option value="planificado">Planificado</option>
            <option value="en_curso">En curso</option>
            <option value="pausado">Pausado</option>
            <option value="completado">Completado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      {alertas.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              Proyectos que superan el presupuesto: {alertas.map((p) => p.codigo_proyecto).join(', ')}
            </div>
          </div>
        </div>
      )}

      {loading && <div className="flex justify-center py-12"><Loader className="h-8 w-8 animate-spin text-brand-primary" /></div>}
      {error && !loading && <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">{error}</p>}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Presupuesto</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Costo real</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">% Ej. costo</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Desviación</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay proyectos.</td></tr>
              ) : (
                list.map((row) => {
                  const pct = porcentajeEjecucion(row.presupuesto, row.costo_real);
                  const dev = desviacion(row.presupuesto, row.costo_real);
                  const sobrePresupuesto = dev > 0;
                  return (
                    <tr key={row.proyecto_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.codigo_proyecto}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.nombre}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.estado ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">{row.presupuesto ?? 0}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">{row.costo_real ?? 0}</td>
                      <td className={`px-4 py-3 text-sm text-right font-medium ${pct > 100 ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                        {row.presupuesto != null && row.presupuesto > 0 ? `${pct.toFixed(1)}%` : '—'}
                      </td>
                      <td className={`px-4 py-3 text-sm text-right font-medium ${sobrePresupuesto ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                        {dev}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </PmPageLayout>
  );
}
