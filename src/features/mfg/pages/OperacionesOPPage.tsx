/**
 * Operaciones de OP MFG — Listado por orden de producción. GET /api/v1/mfg/orden-produccion-operaciones
 * Ruta: /mfg/operaciones-op
 */
import { useState, useEffect, useCallback } from 'react';
import { Loader, Settings } from 'lucide-react';
import { ordenProduccionService } from '../services/mfg.service';
import { ordenProduccionOperacionService } from '../services/mfg.service';
import type { OrdenProduccion } from '../types/mfg.types';
import type { OrdenProduccionOperacion } from '../types/mfg.types';
import { MfgPageLayout } from '../components/MfgPageLayout';
import { Label } from '@/shared/components/ui/label';

const ESTADOS_OP_OP = ['pendiente', 'en_proceso', 'terminada'] as const;

export default function OperacionesOPPage() {
  const [ordenes, setOrdenes] = useState<OrdenProduccion[]>([]);
  const [list, setList] = useState<OrdenProduccionOperacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ordenFilter, setOrdenFilter] = useState<string>('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');

  const loadOrdenes = useCallback(async () => {
    try {
      const data = await ordenProduccionService.list({});
      setOrdenes(data);
      if (data.length === 1 && !ordenFilter) setOrdenFilter(data[0].orden_produccion_id);
    } catch {
      setOrdenes([]);
    }
  }, [ordenFilter]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { orden_produccion_id?: string; estado?: string } = {};
      if (ordenFilter) params.orden_produccion_id = ordenFilter;
      if (estadoFilter) params.estado = estadoFilter;
      const data = await ordenProduccionOperacionService.list(
        Object.keys(params).length ? params : undefined
      );
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al cargar operaciones de OP'
      );
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [ordenFilter, estadoFilter]);

  useEffect(() => {
    loadOrdenes();
  }, [loadOrdenes]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  return (
    <MfgPageLayout
      title="Operaciones de OP"
      description="Operaciones o pasos de trabajo asociados a cada orden de producción."
    >
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        <div>
          <Label className="mr-2">Orden de producción</Label>
          <select
            value={ordenFilter}
            onChange={(e) => setOrdenFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
          >
            <option value="">Todas</option>
            {ordenes.map((o) => (
              <option key={o.orden_produccion_id} value={o.orden_produccion_id}>
                {o.numero_op}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label className="mr-2">Estado</Label>
          <select
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
          >
            <option value="">Todos</option>
            {ESTADOS_OP_OP.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
      {loading && (
        <div className="flex justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      )}
      {error && !loading && (
        <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          {error}
        </p>
      )}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  OP
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Sec.
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Operación
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Centro trabajo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Tiempo plan. (setup/op)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Cant. procesada
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    <Settings className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    No hay operaciones de OP. Seleccione una orden o no hay datos.
                  </td>
                </tr>
              ) : (
                list.map((row) => (
                  <tr
                    key={row.op_operacion_id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {ordenes.find((o) => o.orden_produccion_id === row.orden_produccion_id)
                        ?.numero_op ?? row.orden_produccion_id}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {row.secuencia}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {row.operacion_id}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {row.centro_trabajo_id}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {row.tiempo_setup_planificado_minutos ?? '—'} /{' '}
                      {row.tiempo_operacion_planificado_minutos ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {row.cantidad_procesada ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {row.estado ?? '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </MfgPageLayout>
  );
}
