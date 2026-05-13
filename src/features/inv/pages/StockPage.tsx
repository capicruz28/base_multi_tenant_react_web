/**
 * Consulta de Stock — Ver stock actual, reservado y disponible por almacén.
 * GET /api/v1/inv/stock
 */
import { useState, useEffect, useCallback } from 'react';
import { Loader, PackageSearch, AlertTriangle, ListTree } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import { productoService } from '../services/inv.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { Almacen, Stock, Producto } from '../types/inv.types';
import { InvPageLayout } from '../components/InvPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { useNavigate } from 'react-router-dom';
import { useAlmacenes } from '../hooks/almacenes.hooks';
import { useStockAlertas, useStocks } from '../hooks/stock.hooks';

export default function StockPage() {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [almacenFilter, setAlmacenFilter] = useState<string>('');
  const [productosMap, setProductosMap] = useState<Record<string, Producto>>({});
  const [verAlertas, setVerAlertas] = useState(false);

  const loadEmpresas = useCallback(async () => {
    try {
      const data = await empresaService.list({ solo_activos: true });
      setEmpresas(data);
      if (data.length === 1 && !empresaFilter) setEmpresaFilter(data[0].empresa_id);
    } catch {
      setEmpresas([]);
    }
  }, [empresaFilter]);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);

  const almacenesQuery = useAlmacenes({
    empresa_id: empresaFilter || undefined,
    solo_activos: true,
    enabled: !!empresaFilter,
  });
  const almacenes = (almacenesQuery.data ?? []) as Almacen[];

  const stocksQuery = useStocks({
    empresa_id: empresaFilter || undefined,
    almacen_id: almacenFilter || undefined,
    enabled: !verAlertas,
  });
  const alertasQuery = useStockAlertas({
    empresa_id: empresaFilter || undefined,
    almacen_id: almacenFilter || undefined,
    enabled: verAlertas,
  });

  const activeQuery = verAlertas ? alertasQuery : stocksQuery;
  const list = (activeQuery.data ?? []) as Stock[];

  const almacenNombre = (id: string) => almacenes.find((a) => a.almacen_id === id)?.nombre ?? id;
  const tieneStockBajo = (stock: Stock) => stock.stock_minimo != null && stock.cantidad_disponible != null && stock.cantidad_disponible < stock.stock_minimo;

  // Cargar datos básicos de productos para mejorar la legibilidad del listado
  useEffect(() => {
    const cargarProductos = async () => {
      const idsUnicos = Array.from(new Set(list.map((row) => row.producto_id))).filter(
        (id) => id && !productosMap[id]
      );
      if (!idsUnicos.length) return;
      try {
        const resultados = await Promise.all(
          idsUnicos.map(async (id) => {
            try {
              const prod = await productoService.getById(id);
              return prod ? { id, prod } : null;
            } catch {
              return null;
            }
          })
        );
        const nuevos: Record<string, Producto> = {};
        resultados.forEach((r) => {
          if (r && r.prod) nuevos[r.id] = r.prod;
        });
        if (Object.keys(nuevos).length) {
          setProductosMap((prev) => ({ ...prev, ...nuevos }));
        }
      } catch {
        // Silenciar errores: la consulta de stock sigue funcionando aunque falle la carga de producto
      }
    };
    if (list.length) {
      void cargarProductos();
    }
  }, [list, productosMap]);

  const productoLabel = (productoId: string) => {
    const p = productosMap[productoId];
    if (!p) return `${productoId.substring(0, 8)}...`;
    return `${p.codigo_sku} — ${p.nombre}`;
  };

  const irAKardex = (productoId: string, almacenId: string) => {
    const params = new URLSearchParams();
    if (empresaFilter) params.set('empresa_id', empresaFilter);
    if (productoId) params.set('producto_id', productoId);
    if (almacenId) params.set('almacen_id', almacenId);
    navigate(`/inv/kardex?${params.toString()}`);
  };

  return (
    <InvPageLayout
      title="Consulta de Stock"
      description="Ver stock actual, reservado y disponible por almacén. Alertas de stock mínimo y máximo."
    >
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        {empresas.length > 0 && (
          <div>
            <label className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">Empresa</label>
            <select value={empresaFilter} onChange={(e) => setEmpresaFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
              <option value="">Todas</option>
              {empresas.map((e) => <option key={e.empresa_id} value={e.empresa_id}>{e.razon_social}</option>)}
            </select>
          </div>
        )}
        {almacenes.length > 0 && (
          <div>
            <label className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">Almacén</label>
            <select value={almacenFilter} onChange={(e) => setAlmacenFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm">
              <option value="">Todos</option>
              {almacenes.map((a) => <option key={a.almacen_id} value={a.almacen_id}>{a.nombre}</option>)}
            </select>
          </div>
        )}
        <div className="sm:ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setVerAlertas(false)}
            className={`px-3 py-2 rounded-md text-sm border ${
              !verAlertas
                ? 'bg-brand-primary text-white border-brand-primary'
                : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700'
            }`}
          >
            Stock
          </button>
          <button
            type="button"
            onClick={() => setVerAlertas(true)}
            className={`px-3 py-2 rounded-md text-sm border inline-flex items-center gap-2 ${
              verAlertas
                ? 'bg-brand-primary text-white border-brand-primary'
                : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700'
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            Alertas
          </button>
        </div>
      </div>
      {activeQuery.isLoading && <div className="flex justify-center py-12"><Loader className="h-8 w-8 animate-spin text-brand-primary" /></div>}
      {activeQuery.error && !activeQuery.isLoading && (
        <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          {getErrorMessage(activeQuery.error).message}
        </p>
      )}
      {!activeQuery.isLoading && !activeQuery.error && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Producto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Almacén</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actual</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Reservado</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Disponible</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Mínimo</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Valor Total</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Kardex</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    <PackageSearch className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    {verAlertas ? 'No hay alertas de stock bajo mínimo.' : 'No hay stock registrado.'}
                  </td>
                </tr>
              ) : (
                list.map((row) => (
                  <tr key={row.stock_id} className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${tieneStockBajo(row) ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}`}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{productoLabel(row.producto_id)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{almacenNombre(row.almacen_id)}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">{row.cantidad_actual.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">{row.cantidad_reservada?.toFixed(2) ?? '0.00'}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">{row.cantidad_disponible?.toFixed(2) ?? row.cantidad_actual.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">{row.stock_minimo?.toFixed(2) ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">{row.valor_total ? `${row.moneda ?? 'PEN'} ${row.valor_total.toFixed(2)}` : '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => irAKardex(row.producto_id, row.almacen_id)}
                        className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                        title="Ver Kardex del producto en este almacén"
                      >
                        <ListTree className="h-3 w-3 mr-1" /> Kardex
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {list.some(tieneStockBajo) && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          <span className="text-sm text-yellow-800 dark:text-yellow-200">Hay productos con stock por debajo del mínimo.</span>
        </div>
      )}
    </InvPageLayout>
  );
}
