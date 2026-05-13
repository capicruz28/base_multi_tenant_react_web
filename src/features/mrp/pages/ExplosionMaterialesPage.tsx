/**
 * Explosión de Materiales MRP — Listado (lectura/consulta). GET /api/v1/mrp/explosion-materiales
 */
import { useState, useEffect, useCallback } from 'react';
import { Loader, Layers } from 'lucide-react';
import { planMaestroService } from '../services/mrp.service';
import { explosionMaterialesService } from '../services/mrp.service';
import { productoService } from '@/features/inv/services/inv.service';
import type { PlanMaestro } from '../types/mrp.types';
import type { Producto } from '@/features/inv/types/inv.types';
import type { ExplosionMateriales } from '../types/mrp.types';
import { MrpPageLayout } from '../components/MrpPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Label } from '@/shared/components/ui/label';

export default function ExplosionMaterialesPage() {
  const [planes, setPlanes] = useState<PlanMaestro[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [list, setList] = useState<ExplosionMateriales[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planFilter, setPlanFilter] = useState<string>('');
  const [nivelFilter, setNivelFilter] = useState<string>('');

  const loadPlanes = useCallback(async () => {
    try {
      const data = await planMaestroService.list({});
      setPlanes(data);
      if (data.length === 1 && !planFilter) setPlanFilter(data[0].plan_maestro_id);
    } catch {
      setPlanes([]);
    }
  }, [planFilter]);

  const loadProductos = useCallback(async () => {
    try {
      const data = await productoService.list({ solo_activos: true });
      setProductos(Array.isArray(data) ? data : []);
    } catch {
      setProductos([]);
    }
  }, []);

  const fetchList = useCallback(async () => {
    if (!planFilter) {
      setList([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params: { plan_maestro_id: string; nivel_bom?: number } = {
        plan_maestro_id: planFilter,
      };
      if (nivelFilter !== '') params.nivel_bom = parseInt(nivelFilter, 10);
      const data = await explosionMaterialesService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [planFilter, nivelFilter]);

  useEffect(() => { loadPlanes(); }, [loadPlanes]);
  useEffect(() => { loadProductos(); }, [loadProductos]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const getProductoNombre = (id: string) =>
    productos.find((p) => p.producto_id === id)?.codigo_sku ?? id;

  return (
    <MrpPageLayout
      title="Explosión de Materiales"
      description="Necesidades de componentes por plan (resultado de explosión BOM)."
    >
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        {planes.length > 0 && (
          <div>
            <Label className="mr-2">Plan maestro *</Label>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="">Seleccionar plan</option>
              {planes.map((p) => (
                <option key={p.plan_maestro_id} value={p.plan_maestro_id}>
                  {p.codigo_plan} – {p.nombre}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <Label className="mr-2">Nivel BOM</Label>
          <select
            value={nivelFilter}
            onChange={(e) => setNivelFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
          >
            <option value="">Todos</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={String(n)}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>
      {!planFilter && (
        <p className="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
          Seleccione un plan maestro para ver la explosión de materiales.
        </p>
      )}
      {loading && planFilter && (
        <div className="flex justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      )}
      {error && !loading && (
        <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          {error}
        </p>
      )}
      {!loading && !error && planFilter && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Producto padre
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Componente
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Nivel
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Cant. necesaria
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Stock disp.
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Cant. a ordenar
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Fecha req.
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
                    <Layers className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    No hay líneas de explosión. Ejecute el cálculo de explosión para este plan.
                  </td>
                </tr>
              ) : (
                list.map((row) => (
                  <tr
                    key={row.explosion_id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {getProductoNombre(row.producto_padre_id)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {getProductoNombre(row.producto_componente_id)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {row.nivel_bom ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {row.cantidad_necesaria}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {row.stock_disponible ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {row.cantidad_a_ordenar ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {row.fecha_requerida}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </MrpPageLayout>
  );
}
