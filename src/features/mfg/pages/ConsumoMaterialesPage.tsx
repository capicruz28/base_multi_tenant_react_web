/**
 * Consumo de Materiales MFG — Listado por OP. GET /api/v1/mfg/consumo-materiales
 * Ruta: /mfg/consumo-materiales
 */
import { useState, useEffect, useCallback } from 'react';
import { Loader, Package } from 'lucide-react';
import { ordenProduccionService } from '../services/mfg.service';
import { consumoMaterialesService } from '../services/mfg.service';
import type { OrdenProduccion } from '../types/mfg.types';
import type { ConsumoMateriales } from '../types/mfg.types';
import { MfgPageLayout } from '../components/MfgPageLayout';
import { Label } from '@/shared/components/ui/label';

export default function ConsumoMaterialesPage() {
  const [ordenes, setOrdenes] = useState<OrdenProduccion[]>([]);
  const [list, setList] = useState<ConsumoMateriales[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ordenFilter, setOrdenFilter] = useState<string>('');

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
      const params = ordenFilter ? { orden_produccion_id: ordenFilter } : undefined;
      const data = await consumoMaterialesService.list(params);
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar consumo de materiales');
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [ordenFilter]);

  useEffect(() => {
    loadOrdenes();
  }, [loadOrdenes]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  return (
    <MfgPageLayout
      title="Consumo de Materiales"
      description="Registro de materiales consumidos por orden de producción."
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
                  Producto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Cant. planificada
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Cant. consumida
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Lote
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    No hay registros de consumo. Seleccione una orden de producción o no hay datos.
                  </td>
                </tr>
              ) : (
                list.map((row) => (
                  <tr
                    key={row.consumo_id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {ordenes.find((o) => o.orden_produccion_id === row.orden_produccion_id)
                        ?.numero_op ?? row.orden_produccion_id}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {row.producto_id}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {row.cantidad_planificada}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {row.cantidad_consumida}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {row.lote ?? '—'}
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
