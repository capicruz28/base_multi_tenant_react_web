/**
 * Ejecución Presupuestal BDG — Comparativa real vs presupuestado y alertas de sobregiro.
 * Solo lectura: consume presupuestos y presupuesto-detalle.
 */
import { useState, useEffect, useCallback } from 'react';
import { Loader, TrendingUp, AlertTriangle } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import { planCuentaService } from '@/features/fin/services/fin.service';
import { centroCostoService } from '@/features/org/services/org.service';
import { presupuestosService, presupuestoDetalleService } from '../services/bdg.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { PlanCuenta } from '@/features/fin/types/fin.types';
import type { CentroCosto } from '@/features/org/types/org.types';
import type { Presupuesto, PresupuestoDetalle } from '../types/bdg.types';
import { BdgPageLayout } from '../components/BdgPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Label } from '@/shared/components/ui/label';

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i);

export default function EjecucionPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [cuentas, setCuentas] = useState<PlanCuenta[]>([]);
  const [centrosCosto, setCentrosCosto] = useState<CentroCosto[]>([]);
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [detalleMap, setDetalleMap] = useState<Record<string, PresupuestoDetalle[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [anioFilter, setAnioFilter] = useState<number>(currentYear);
  const [presupuestoSeleccionado, setPresupuestoSeleccionado] = useState<Presupuesto | null>(null);

  const loadEmpresas = useCallback(async () => {
    try {
      const data = await empresaService.list({ solo_activos: true });
      setEmpresas(data);
      if (data.length === 1 && !empresaFilter) setEmpresaFilter(data[0].empresa_id);
    } catch {
      setEmpresas([]);
    }
  }, [empresaFilter]);

  const loadCuentasCentros = useCallback(async () => {
    const empId = (empresaFilter || empresas[0]?.empresa_id) ?? '';
    if (!empId) {
      setCuentas([]);
      setCentrosCosto([]);
      return;
    }
    try {
      const [cu, cc] = await Promise.all([
        planCuentaService.list({ empresa_id: empId, solo_activos: true }),
        centroCostoService.list({ empresa_id: empId, solo_activos: true }),
      ]);
      setCuentas(Array.isArray(cu) ? cu : []);
      setCentrosCosto(Array.isArray(cc) ? cc : []);
    } catch {
      setCuentas([]);
      setCentrosCosto([]);
    }
  }, [empresaFilter, empresas]);

  const fetchPresupuestos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { empresa_id?: string; anio?: number } = {};
      if (empresaFilter) params.empresa_id = empresaFilter;
      params.anio = anioFilter;
      const data = await presupuestosService.list(params);
      setPresupuestos(data);
      setDetalleMap({});
      setPresupuestoSeleccionado(null);
      if (data.length > 0) {
        const first = data[0];
        setPresupuestoSeleccionado(first);
        const det = await presupuestoDetalleService.list({ presupuesto_id: first.presupuesto_id });
        setDetalleMap((m) => ({ ...m, [first.presupuesto_id]: Array.isArray(det) ? det : [] }));
      }
    } catch (err) {
      setError(getErrorMessage(err).message);
      setPresupuestos([]);
      setDetalleMap({});
    } finally {
      setLoading(false);
    }
  }, [empresaFilter, anioFilter]);

  const loadDetalle = useCallback(async (presupuestoId: string) => {
    if (detalleMap[presupuestoId]) return;
    try {
      const data = await presupuestoDetalleService.list({ presupuesto_id: presupuestoId });
      setDetalleMap((m) => ({ ...m, [presupuestoId]: Array.isArray(data) ? data : [] }));
    } catch {
      setDetalleMap((m) => ({ ...m, [presupuestoId]: [] }));
    }
  }, [detalleMap]);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);
  useEffect(() => { loadCuentasCentros(); }, [loadCuentasCentros]);
  useEffect(() => { fetchPresupuestos(); }, [fetchPresupuestos]);

  useEffect(() => {
    if (presupuestoSeleccionado) loadDetalle(presupuestoSeleccionado.presupuesto_id);
  }, [presupuestoSeleccionado, loadDetalle]);

  const detalleList = presupuestoSeleccionado ? (detalleMap[presupuestoSeleccionado.presupuesto_id] ?? []) : [];
  const alertasCabecera = presupuestos.filter((p) => (p.porcentaje_ejecucion ?? 0) > 100);
  const alertasDetalle = detalleList.filter((d) => (d.monto_disponible ?? 0) < 0);

  const getCuentaLabel = (id: string) => cuentas.find((c) => c.cuenta_id === id)?.codigo_cuenta ?? id;
  const getCentroLabel = (id: string | null | undefined) => (id ? (centrosCosto.find((c) => c.centro_costo_id === id)?.codigo ?? id) : '—');
  const selectCls = 'mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-gray-700 dark:text-white text-sm';

  return (
    <BdgPageLayout
      title="Ejecución Presupuestal"
      description="Comparativa real vs presupuestado y alertas de sobregiro."
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
          <Label className="mr-2">Año</Label>
          <select value={anioFilter} onChange={(e) => setAnioFilter(parseInt(e.target.value, 10))} className={selectCls}>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {(alertasCabecera.length > 0 || alertasDetalle.length > 0) && (
        <div className="mb-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              {alertasCabecera.length > 0 && <p>Presupuestos con ejecución &gt; 100%: {alertasCabecera.map((p) => p.codigo_presupuesto).join(', ')}</p>}
              {alertasDetalle.length > 0 && <p>Líneas con monto disponible &lt; 0 (sobregiro): {alertasDetalle.length} en el presupuesto seleccionado.</p>}
            </div>
          </div>
        </div>
      )}

      {loading && <div className="flex justify-center py-12"><Loader className="h-8 w-8 animate-spin text-brand-primary" /></div>}
      {error && !loading && <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">{error}</p>}
      {!loading && !error && (
        <div className="space-y-6">
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Año</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Presupuestado</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ejecutado</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">% Ej.</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ver detalle</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {presupuestos.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"><TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay presupuestos.</td></tr>
                ) : (
                  presupuestos.map((row) => {
                    const sobreEjecucion = (row.porcentaje_ejecucion ?? 0) > 100;
                    return (
                      <tr
                        key={row.presupuesto_id}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${presupuestoSeleccionado?.presupuesto_id === row.presupuesto_id ? 'bg-brand-primary/5 dark:bg-brand-primary/10' : ''}`}
                      >
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{row.codigo_presupuesto}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.nombre}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.anio}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">{row.monto_total_presupuestado ?? 0}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">{row.monto_total_ejecutado ?? 0}</td>
                        <td className={`px-4 py-3 text-sm text-right font-medium ${sobreEjecucion ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                          {row.porcentaje_ejecucion != null ? `${row.porcentaje_ejecucion.toFixed(1)}%` : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.estado ?? '—'}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => setPresupuestoSeleccionado(row)}
                            className="text-brand-primary hover:underline text-sm"
                          >
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {presupuestoSeleccionado && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 shadow">
              <h2 className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                Detalle: {presupuestoSeleccionado.codigo_presupuesto} – {presupuestoSeleccionado.nombre}
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cuenta</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Centro costo</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Mes</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Presupuestado</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ejecutado</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Disponible</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {detalleList.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-4 text-center text-gray-500">Sin detalle.</td></tr>
                    ) : (
                      detalleList.map((d) => {
                        const sobregiro = (d.monto_disponible ?? 0) < 0;
                        return (
                          <tr key={d.presupuesto_detalle_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{getCuentaLabel(d.cuenta_id)}</td>
                            <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{getCentroLabel(d.centro_costo_id)}</td>
                            <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{d.mes ?? '—'}</td>
                            <td className="px-4 py-2 text-sm text-right text-gray-700 dark:text-gray-300">{d.monto_presupuestado}</td>
                            <td className="px-4 py-2 text-sm text-right text-gray-700 dark:text-gray-300">{d.monto_ejecutado ?? 0}</td>
                            <td className={`px-4 py-2 text-sm text-right font-medium ${sobregiro ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>{d.monto_disponible ?? '—'}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </BdgPageLayout>
  );
}
