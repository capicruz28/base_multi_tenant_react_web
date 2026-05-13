/**
 * Kardex — Líneas de movimiento por producto y almacén.
 * GET /api/v1/inv/kardex
 */
import { useState, useEffect, useCallback } from 'react';
import { Loader, ListTree, Filter } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import { productoService } from '../services/inv.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { Almacen, Producto, KardexLineaRead } from '../types/inv.types';
import { InvPageLayout } from '../components/InvPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { useAlmacenes } from '../hooks/almacenes.hooks';
import { useKardex } from '../hooks/kardex.hooks';

export default function KardexPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [productosMap, setProductosMap] = useState<Record<string, Producto>>({});
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [almacenFilter, setAlmacenFilter] = useState<string>('');
  const [productoFilter, setProductoFilter] = useState<string>('');
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

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);

  const almacenesQuery = useAlmacenes({
    empresa_id: empresaFilter || undefined,
    solo_activos: true,
    enabled: !!empresaFilter,
  });
  const almacenes = (almacenesQuery.data ?? []) as Almacen[];

  const kardexQuery = useKardex({
    empresa_id: empresaFilter || undefined,
    almacen_id: almacenFilter || undefined,
    producto_id: productoFilter || undefined,
    fecha_desde: fechaDesde || undefined,
    fecha_hasta: fechaHasta || undefined,
    enabled: true,
  });
  const list = (kardexQuery.data ?? []) as KardexLineaRead[];

  // Cargar productos referenciados para mostrar SKU y nombre
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
        // Silenciado: el kardex sigue funcionando aunque falle la carga de productos
      }
    };
    if (list.length) {
      void cargarProductos();
    }
  }, [list, productosMap]);

  const productoLabel = (productoId: string) => {
    const p = productosMap[productoId];
    if (!p) return productoId.substring(0, 8) + '...';
    return `${p.codigo_sku} — ${p.nombre}`;
  };

  const almacenNombre = (id?: string | null) => {
    if (!id) return '-';
    return almacenes.find((a) => a.almacen_id === id)?.nombre ?? id;
  };

  return (
    <InvPageLayout
      title="Kardex de Inventario"
      description="Detalle de movimientos por producto y almacén, con saldos valorizados."
      action={
        <div className="inline-flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Filter className="h-4 w-4" /> Usa filtros para acotar el rango de fechas.
        </div>
      }
    >
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {empresas.length > 0 && (
          <div>
            <label className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">Empresa</label>
            <select
              value={empresaFilter}
              onChange={(e) => setEmpresaFilter(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="">Todas</option>
              {empresas.map((e) => (
                <option key={e.empresa_id} value={e.empresa_id}>
                  {e.razon_social}
                </option>
              ))}
            </select>
          </div>
        )}
        {almacenes.length > 0 && (
          <div>
            <label className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">Almacén</label>
            <select
              value={almacenFilter}
              onChange={(e) => setAlmacenFilter(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="">Todos</option>
              {almacenes.map((a) => (
                <option key={a.almacen_id} value={a.almacen_id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">Producto (ID)</label>
          <input
            type="text"
            value={productoFilter}
            onChange={(e) => setProductoFilter(e.target.value)}
            placeholder="Pega aquí el ID de producto"
            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
          />
        </div>
        <div>
          <label className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">Fecha desde</label>
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
          />
        </div>
        <div>
          <label className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">Fecha hasta</label>
          <input
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm"
          />
        </div>
      </div>
      {kardexQuery.isLoading && (
        <div className="flex justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      )}
      {kardexQuery.error && !kardexQuery.isLoading && (
        <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          {getErrorMessage(kardexQuery.error).message}
        </p>
      )}
      {!kardexQuery.isLoading && !kardexQuery.error && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Producto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Almacén
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Movimiento
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Documento
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Entrada
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Salida
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Saldo
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Costo Unit.
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Costo Total
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Saldo Valorizado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {list.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    <ListTree className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    No hay movimientos en el rango seleccionado.
                  </td>
                </tr>
              ) : (
                list.map((row) => (
                  <tr key={row.kardex_linea_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {new Date(row.fecha_movimiento).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {productoLabel(row.producto_id)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {almacenNombre(row.almacen_id)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {row.tipo_movimiento_codigo
                        ? `${row.tipo_movimiento_codigo} - ${row.tipo_movimiento_nombre ?? ''}`
                        : row.tipo_movimiento_nombre ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {row.documento_referencia_tipo && row.documento_referencia_numero
                        ? `${row.documento_referencia_tipo} ${row.documento_referencia_numero}`
                        : row.documento_referencia_numero ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                      {row.cantidad_entrada != null ? row.cantidad_entrada.toFixed(2) : ''}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                      {row.cantidad_salida != null ? row.cantidad_salida.toFixed(2) : ''}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                      {row.saldo_cantidad != null ? row.saldo_cantidad.toFixed(2) : ''}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                      {row.costo_unitario != null ? row.costo_unitario.toFixed(4) : ''}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                      {row.costo_total != null
                        ? `${row.moneda ?? ''} ${row.costo_total.toFixed(2)}`
                        : ''}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                      {row.saldo_valorizado != null
                        ? `${row.moneda ?? ''} ${row.saldo_valorizado.toFixed(2)}`
                        : ''}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </InvPageLayout>
  );
}

