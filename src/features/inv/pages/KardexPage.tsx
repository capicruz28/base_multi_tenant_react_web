/**
 * Kardex — Líneas según contrato GET /api/v1/inv/kardex.
 * tipo_movimiento_id se enriquece con useTiposMovimiento (decisión de diseño).
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ListTree, Filter } from 'lucide-react';
import { productoService } from '../services/inv.service';
import type { Almacen, Producto, KardexLineaRead } from '../types/inv.types';
import { InvPageLayout } from '../components/InvPageLayout';
import { InvTableSkeleton } from '../components/InvTableSkeleton';
import { getErrorMessage } from '@/core/services/error.service';
import { useAlmacenes } from '../hooks/almacenes.hooks';
import { useKardex } from '../hooks/kardex.hooks';
import { useTiposMovimiento } from '../hooks/tipos-movimiento.hooks';
import { useProductos } from '../hooks/productos.hooks';
import { useInvSessionScope, useInvScopeEmpresaReset } from '../hooks/useInvSessionScope';

function fmtCant(s: string | null | undefined): string {
  if (s == null || s === '') return '-';
  const n = Number(s);
  return Number.isFinite(n) ? n.toFixed(4) : s;
}

export default function KardexPage() {
  const [searchParams] = useSearchParams();
  const { canQueryCompanyScoped } = useInvSessionScope();
  const [productosMap, setProductosMap] = useState<Record<string, Producto>>({});
  const [almacenFilter, setAlmacenFilter] = useState(() => searchParams.get('almacen_id') ?? '');
  const [productoFilter, setProductoFilter] = useState(() => searchParams.get('producto_id') ?? '');
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');

  const resetPageFilters = useCallback(() => {
    setAlmacenFilter('');
    setProductoFilter('');
    setFechaDesde('');
    setFechaHasta('');
    setProductosMap({});
  }, []);
  useInvScopeEmpresaReset(resetPageFilters);

  const almacenesQuery = useAlmacenes({
    solo_activos: true,
  });
  const almacenes = (almacenesQuery.data ?? []) as Almacen[];

  const tiposQuery = useTiposMovimiento({
    solo_activos: true,
  });
  const tipoNombre = (id: string) => tiposQuery.data?.find((t) => t.tipo_movimiento_id === id)?.nombre ?? '—';

  const productosListaQuery = useProductos({
    solo_activos: true,
  });
  const productosOpciones = productosListaQuery.data ?? [];

  const kardexQuery = useKardex({
    almacen_id: almacenFilter || undefined,
    producto_id: productoFilter || undefined,
    fecha_desde: fechaDesde || undefined,
    fecha_hasta: fechaHasta || undefined,
  });
  const list = (kardexQuery.data ?? []) as KardexLineaRead[];

  const lineProductIds = useMemo(
    () =>
      [...new Set(list.map((row) => row.producto_id))]
        .sort()
        .join(','),
    [list]
  );

  useEffect(() => {
    if (!list.length) return;
    const ids = [...new Set(list.map((row) => row.producto_id))].filter((id) => id && !productosMap[id]);
    if (!ids.length) return;
    void (async () => {
      const resultados = await Promise.all(
        ids.map(async (id) => {
          try {
            const prod = await productoService.getById(id);
            return { id, prod };
          } catch {
            return null;
          }
        })
      );
      setProductosMap((prev) => {
        const next = { ...prev };
        resultados.forEach((r) => {
          if (r?.prod) next[r.id] = r.prod;
        });
        return next;
      });
    })();
  }, [lineProductIds, productosMap]);

  const productoLabel = (productoId: string) => {
    const p = productosMap[productoId];
    if (!p) return '—';
    return `${p.codigo_sku} — ${p.nombre}`;
  };

  const almacenEtiqueta = (origen?: string | null, destino?: string | null) => {
    const no = origen ? almacenes.find((a) => a.almacen_id === origen)?.nombre ?? null : null;
    const nd = destino ? almacenes.find((a) => a.almacen_id === destino)?.nombre ?? null : null;
    if (no && nd) return `${no} → ${nd}`;
    if (no) return `Origen: ${no}`;
    if (nd) return `Destino: ${nd}`;
    return '-';
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
        <select
          value={productoFilter}
          onChange={(e) => setProductoFilter(e.target.value)}
          disabled={!canQueryCompanyScoped}
          className="min-w-[10rem] max-w-[16rem] px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm disabled:opacity-50"
        >
          <option value="">Producto</option>
          {productosOpciones.map((p) => (
            <option key={p.producto_id} value={p.producto_id}>
              {p.codigo_sku} — {p.nombre}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={fechaDesde}
          onChange={(e) => setFechaDesde(e.target.value)}
          className="px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
          title="Fecha desde"
        />
        <input
          type="date"
          value={fechaHasta}
          onChange={(e) => setFechaHasta(e.target.value)}
          className="px-3 py-2 border border-border-base rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-subtle dark:text-text-base text-sm"
          title="Fecha hasta"
        />
        <span className="inline-flex items-center gap-1.5 text-xs text-text-soft sm:ml-auto max-w-[14rem]">
          <Filter className="h-4 w-4 shrink-0" />
          Acota por fechas y empresa para mejores tiempos de respuesta.
        </span>
      </div>
      {kardexQuery.isLoading && <InvTableSkeleton columns={8} />}
      {kardexQuery.error && !kardexQuery.isLoading && (
        <p className="text-error bg-error/10 p-4 rounded-lg">
          {getErrorMessage(kardexQuery.error).message}
        </p>
      )}
      {!kardexQuery.isLoading && !kardexQuery.error && (
        <div className="overflow-x-auto rounded-lg border border-border-base shadow">
          <table className="min-w-full divide-y divide-border-base">
            <thead className="bg-subtle">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Producto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Almacén</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Tipo mov.</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-soft uppercase">Cant. base</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-soft uppercase">Costo u.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">Lote</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-soft uppercase">N.º serie</th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border-base">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <ListTree className="h-12 w-12 mx-auto mb-3 text-text-soft opacity-70" />
                    <p className="text-sm font-medium text-text-soft">
                      No hay movimientos en el rango seleccionado.
                    </p>
                  </td>
                </tr>
              ) : (
                list.map((row) => (
                  <tr key={row.movimiento_detalle_id} className="hover:bg-overlay dark:hover:bg-overlay">
                    <td className="px-4 py-3 text-sm text-text-base">
                      {new Date(row.fecha_movimiento).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-base">{productoLabel(row.producto_id)}</td>
                    <td className="px-4 py-3 text-sm text-text-base">
                      {almacenEtiqueta(row.almacen_origen_id, row.almacen_destino_id)}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-base">{tipoNombre(row.tipo_movimiento_id)}</td>
                    <td className="px-4 py-3 text-sm text-right text-text-base">{fmtCant(row.cantidad_base)}</td>
                    <td className="px-4 py-3 text-sm text-right text-text-base">{fmtCant(row.costo_unitario)}</td>
                    <td className="px-4 py-3 text-sm text-text-base">{row.lote ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-text-base">{row.numero_serie ?? '-'}</td>
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
