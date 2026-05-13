/**
 * Análisis de Variaciones CST — Solo lectura. Usa GET /api/v1/cst/producto-costo con filtros
 * para comparar real vs estándar o por periodo.
 */
import { useState, useEffect, useCallback } from 'react';
import { Loader, BarChart3 } from 'lucide-react';
import { productoService } from '@/features/inv/services/inv.service';
import { productoCostoService } from '../services/cst.service';
import type { Producto } from '@/features/inv/types/inv.types';
import type { ProductoCosto } from '../types/cst.types';
import { CstPageLayout } from '../components/CstPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Label } from '@/shared/components/ui/label';

const MESES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
const METODOS = ['real', 'estandar', 'promedio'] as const;
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i);

export default function AnalisisVariacionesPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [list, setList] = useState<ProductoCosto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productoFilter, setProductoFilter] = useState<string>('');
  const [anioFilter, setAnioFilter] = useState<number>(currentYear);
  const [mesFilter, setMesFilter] = useState<string>('');
  const [metodoFilter, setMetodoFilter] = useState<string>('');

  const loadProductos = useCallback(async () => {
    try {
      const data = await productoService.list({ solo_activos: true });
      setProductos(Array.isArray(data) ? data : []);
    } catch {
      setProductos([]);
    }
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { producto_id?: string; anio?: number; mes?: number; metodo_costeo?: string } = {};
      if (productoFilter) params.producto_id = productoFilter;
      params.anio = anioFilter;
      if (mesFilter) params.mes = parseInt(mesFilter, 10);
      if (metodoFilter) params.metodo_costeo = metodoFilter;
      const data = await productoCostoService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [productoFilter, anioFilter, mesFilter, metodoFilter]);

  useEffect(() => { loadProductos(); }, [loadProductos]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const getProductoNombre = (id: string) => productos.find((p) => p.producto_id === id)?.codigo_sku ?? id;

  return (
    <CstPageLayout
      title="Análisis de Variaciones"
      description="Comparativa de costos real vs estándar por producto y periodo (solo lectura)."
    >
      <div className="mb-4 flex flex-col sm:flex-row gap-4 flex-wrap">
        <div>
          <Label className="mr-2">Producto</Label>
          <select
            value={productoFilter}
            onChange={(e) => setProductoFilter(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
          >
            <option value="">Todos</option>
            {productos.map((p) => (
              <option key={p.producto_id} value={p.producto_id}>{p.codigo_sku} – {p.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <Label className="mr-2">Año</Label>
          <select value={anioFilter} onChange={(e) => setAnioFilter(parseInt(e.target.value, 10))} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <Label className="mr-2">Mes</Label>
          <select value={mesFilter} onChange={(e) => setMesFilter(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
            <option value="">Todos</option>
            {MESES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <Label className="mr-2">Método</Label>
          <select value={metodoFilter} onChange={(e) => setMetodoFilter(e.target.value)} className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
            <option value="">Todos</option>
            {METODOS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>
      {loading && <div className="flex justify-center py-12"><Loader className="h-8 w-8 animate-spin text-brand-primary" /></div>}
      {error && !loading && <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">{error}</p>}
      {!loading && !error && (
        <>
          {list.length === 0 ? (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
              <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-50" />
              No hay datos para los filtros seleccionados.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Producto</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Año / Mes</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Método</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Material</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Mano obra</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">CIF</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Unitario</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {list.map((row) => (
                    <tr key={row.producto_costo_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{getProductoNombre(row.producto_id)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.anio} / {row.mes}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.metodo_costeo ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">{row.costo_material_directo ?? 0}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">{row.costo_mano_obra_directa ?? 0}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">{row.costo_indirecto_fabricacion ?? 0}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">{row.costo_total ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">{row.costo_unitario != null ? row.costo_unitario : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </CstPageLayout>
  );
}
