/**
 * Consulta de Stock — Ver stock actual, reservado y disponible por almacén.
 * GET /api/v1/inv/stock
 */
import { useState, useEffect, useCallback } from 'react';
import { PackageSearch, AlertTriangle, ListTree } from 'lucide-react';
import { productoService } from '../services/inv.service';
import type { Almacen, Stock, Producto } from '../types/inv.types';
import { InvPageLayout } from '../components/InvPageLayout';
import { InvTableSkeleton } from '../components/InvTableSkeleton';
import { getErrorMessage } from '@/core/services/error.service';
import { useNavigate } from 'react-router-dom';
import { toAppPath } from '@/core/routing/post-login-path';
import { useAlmacenes } from '../hooks/almacenes.hooks';
import { useStockAlertas, useStocks } from '../hooks/stock.hooks';
import { useInvSessionScope, useInvScopeEmpresaReset } from '../hooks/useInvSessionScope';

export default function StockPage() {
  const navigate = useNavigate();
  const { scopeEmpresaId } = useInvSessionScope();
  const [almacenFilter, setAlmacenFilter] = useState<string>('');
  const [productosMap, setProductosMap] = useState<Record<string, Producto>>({});
  const [verAlertas, setVerAlertas] = useState(false);

  const resetPageFilters = useCallback(() => {
    setAlmacenFilter('');
    setVerAlertas(false);
    setProductosMap({});
  }, []);
  useInvScopeEmpresaReset(resetPageFilters);

  const almacenesQuery = useAlmacenes({
    solo_activos: true,
  });
  const almacenes = (almacenesQuery.data ?? []) as Almacen[];

  const stocksQuery = useStocks({
    almacen_id: almacenFilter || undefined,
    enabled: !verAlertas,
  });
  const alertasQuery = useStockAlertas({
    almacen_id: almacenFilter || undefined,
    enabled: verAlertas,
  });

  const activeQuery = verAlertas ? alertasQuery : stocksQuery;
  const list = (activeQuery.data ?? []) as Stock[];

  const almacenNombre = (id: string) => almacenes.find((a) => a.almacen_id === id)?.nombre ?? '—';
  const tieneStockBajo = (stock: Stock) =>
    stock.stock_minimo != null &&
    stock.cantidad_disponible != null &&
    stock.cantidad_disponible < stock.stock_minimo;

  useEffect(() => {
    const cargarProductos = async () => {
      const idsUnicos = Array.from(new Set(list.map((row) => row.producto_id))).filter(
        (id) => id && !productosMap[id],
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
          }),
        );
        const nuevos: Record<string, Producto> = {};
        resultados.forEach((r) => {
          if (r && r.prod) nuevos[r.id] = r.prod;
        });
        if (Object.keys(nuevos).length) {
          setProductosMap((prev) => ({ ...prev, ...nuevos }));
        }
      } catch {
        /* silenciar: stock sigue visible sin etiqueta de producto */
      }
    };
    if (list.length) {
      void cargarProductos();
    }
  }, [list, productosMap]);

  const productoLabel = (productoId: string) => {
    const p = productosMap[productoId];
    if (!p) return '—';
    return `${p.codigo_sku} — ${p.nombre}`;
  };

  const irAKardex = (productoId: string, almacenId: string) => {
    const params = new URLSearchParams();
    if (scopeEmpresaId) params.set('empresa_id', scopeEmpresaId);
    if (productoId) params.set('producto_id', productoId);
    if (almacenId) params.set('almacen_id', almacenId);
    navigate(toAppPath(`/inv/kardex?${params.toString()}`));
  };

  return (
    <InvPageLayout>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {almacenes.length > 0 && (
          <select
            value={almacenFilter}
            onChange={(e) => setAlmacenFilter(e.target.value)}
            className="px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
          >
            <option value="">Todos los almacenes</option>
            {almacenes.map((a) => (
              <option key={a.almacen_id} value={a.almacen_id}>
                {a.nombre}
              </option>
            ))}
          </select>
        )}
        <div className="flex flex-wrap items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={() => setVerAlertas(false)}
            className={`px-3 py-2 rounded-md text-sm border inline-flex items-center gap-2 ${
              !verAlertas
                ? 'bg-brand-primary text-white border-brand-primary'
                : 'bg-surface text-text-base border-border-base hover:bg-overlay'
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
                : 'bg-surface text-text-base border-border-base hover:bg-overlay'
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            Alertas
          </button>
        </div>
      </div>

      {activeQuery.isLoading && <InvTableSkeleton columns={8} />}
      {activeQuery.error && !activeQuery.isLoading && (
        <p className="text-error bg-error/10 p-4 rounded-lg">
          {getErrorMessage(activeQuery.error).message}
        </p>
      )}
      {!activeQuery.isLoading && !activeQuery.error && (
        <div className="overflow-x-auto rounded-lg border border-border-base shadow">
          <table className="min-w-full divide-y divide-border-base">
            <thead className="bg-subtle">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Producto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Almacén</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-soft uppercase">Actual</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-soft uppercase">Reservado</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-soft uppercase">Disponible</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-soft uppercase">Mínimo</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-soft uppercase">Valor total</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-text-soft uppercase">Kardex</th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border-base">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <PackageSearch className="h-12 w-12 mx-auto mb-3 text-text-soft opacity-70" />
                    <p className="text-sm font-medium text-text-soft">
                      {verAlertas ? 'No hay alertas de stock bajo mínimo.' : 'No hay stock registrado.'}
                    </p>
                  </td>
                </tr>
              ) : (
                list.map((row) => (
                  <tr
                    key={row.stock_id}
                    className={`hover:bg-overlay dark:hover:bg-overlay ${tieneStockBajo(row) ? 'bg-amber-50 dark:bg-amber-900/10' : ''}`}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-text-base">{productoLabel(row.producto_id)}</td>
                    <td className="px-4 py-3 text-sm text-text-base">{almacenNombre(row.almacen_id)}</td>
                    <td className="px-4 py-3 text-sm text-text-base text-right">{row.cantidad_actual.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-text-base text-right">
                      {row.cantidad_reservada?.toFixed(2) ?? '0.00'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-text-base">
                      {row.cantidad_disponible?.toFixed(2) ?? row.cantidad_actual.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-base text-right">
                      {row.stock_minimo?.toFixed(2) ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-base text-right">
                      {row.valor_total != null ? `${row.moneda ?? 'PEN'} ${row.valor_total.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => irAKardex(row.producto_id, row.almacen_id)}
                        className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-md border border-border-base text-text-base hover:bg-overlay"
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
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden />
          <span className="text-sm text-amber-800 dark:text-amber-200">
            Hay productos con stock por debajo del mínimo.
          </span>
        </div>
      )}
    </InvPageLayout>
  );
}
