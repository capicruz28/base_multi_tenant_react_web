/**
 * Log de Auditoría — Consulta del log (solo lectura). GET /api/v1/aud/log-auditoria
 */
import { useState, useEffect, useCallback } from 'react';
import { Loader, FileSearch, Search, Eye } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import { logAuditoriaService } from '../services/aud.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { LogAuditoriaRead } from '../types/aud.types';
import { AudPageLayout } from '../components/AudPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Label } from '@/shared/components/ui/label';

const ACCIONES = ['INSERT', 'UPDATE', 'DELETE', 'SELECT'] as const;
const MODULOS = ['INV', 'SLS', 'FIN', 'ORG', 'PUR', 'HCM', 'BDG', 'PM', 'SVC', 'TKT', 'DMS', 'WFL', 'MFG', 'MRP', 'MNT', 'CRM', 'PRC', 'AUD', ''];

const LIMIT_OPTIONS = [100, 250, 500, 1000];

function tryParseJson(s: string | null | undefined): object | string {
  if (!s || !s.trim()) return '—';
  try {
    const o = JSON.parse(s);
    return typeof o === 'object' ? o : s;
  } catch {
    return s;
  }
}

export default function LogPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [list, setList] = useState<LogAuditoriaRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [moduloFilter, setModuloFilter] = useState<string>('');
  const [tablaFilter, setTablaFilter] = useState<string>('');
  const [accionFilter, setAccionFilter] = useState<string>('');
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [limit, setLimit] = useState<number>(250);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<LogAuditoriaRead | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

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
      const params: { empresa_id?: string; modulo?: string; tabla?: string; accion?: string; fecha_desde?: string; fecha_hasta?: string; buscar?: string; limit?: number } = { limit };
      if (empresaFilter) params.empresa_id = empresaFilter;
      if (moduloFilter) params.modulo = moduloFilter;
      if (tablaFilter.trim()) params.tabla = tablaFilter.trim();
      if (accionFilter) params.accion = accionFilter;
      if (fechaDesde) params.fecha_desde = fechaDesde;
      if (fechaHasta) params.fecha_hasta = fechaHasta;
      if (searchTerm.trim()) params.buscar = searchTerm.trim();
      const data = await logAuditoriaService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [empresaFilter, moduloFilter, tablaFilter, accionFilter, fechaDesde, fechaHasta, searchTerm, limit]);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);
  useEffect(() => { fetchList(); }, [fetchList]);

  const openDetail = async (row: LogAuditoriaRead) => {
    setDetail(row);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const full = await logAuditoriaService.getById(row.log_id);
      setDetail(full);
    } catch {
      setDetail(row);
    } finally {
      setDetailLoading(false);
    }
  };

  const formatDateTime = (s: string | null | undefined) => (s ? new Date(s).toLocaleString() : '—');
  const selectCls = 'mt-1 w-full px-3 py-2 border border-brand-border rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-brand-surface-secondary dark:text-brand-text-primary text-sm';
  const inputCls = 'mt-1 w-full px-3 py-2 border border-brand-border rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-brand-surface-secondary dark:text-brand-text-primary text-sm';

  const accionBadge = (accion: string) => {
    const colors: Record<string, string> = { INSERT: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', UPDATE: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300', DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', SELECT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' };
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[accion] ?? 'bg-brand-surface-secondary'}`}>{accion}</span>;
  };

  return (
    <AudPageLayout
      title="Log de Auditoría"
      description="Registro de cambios: quién, cuándo, qué tabla y acción. El log es inmutable."
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
          <Label className="mr-2">Módulo</Label>
          <select value={moduloFilter} onChange={(e) => setModuloFilter(e.target.value)} className={selectCls}>
            <option value="">Todos</option>
            {MODULOS.filter(Boolean).map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <Label className="mr-2">Tabla</Label>
          <input type="text" placeholder="Nombre tabla" value={tablaFilter} onChange={(e) => setTablaFilter(e.target.value)} className={inputCls} />
        </div>
        <div>
          <Label className="mr-2">Acción</Label>
          <select value={accionFilter} onChange={(e) => setAccionFilter(e.target.value)} className={selectCls}>
            <option value="">Todas</option>
            {ACCIONES.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <Label className="mr-2">Fecha desde</Label>
          <input type="datetime-local" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className={inputCls} />
        </div>
        <div>
          <Label className="mr-2">Fecha hasta</Label>
          <input type="datetime-local" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className={inputCls} />
        </div>
        <div className="flex-1 min-w-[180px]">
          <Label className="mr-2">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-text-secondary" />
            <input type="text" placeholder="Usuario, descripción..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`pl-9 w-full ${inputCls}`} />
          </div>
        </div>
        <div>
          <Label className="mr-2">Límite</Label>
          <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className={selectCls}>
            {LIMIT_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <button type="button" onClick={fetchList} className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-md text-sm font-medium">
            Buscar
          </button>
        </div>
      </div>
      {loading && <div className="flex justify-center py-12"><Loader className="h-8 w-8 animate-spin text-brand-primary" /></div>}
      {error && !loading && <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">{error}</p>}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border border-brand-border shadow">
          <table className="min-w-full divide-y divide-brand-border">
            <thead className="bg-brand-surface-secondary">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase">Usuario</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase">Módulo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase">Tabla</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase">Acción</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase">Registro</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-brand-text-secondary uppercase">Detalle</th>
              </tr>
            </thead>
            <tbody className="bg-brand-surface divide-y divide-brand-border">
              {list.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-brand-text-secondary"><FileSearch className="h-10 w-10 mx-auto mb-2 opacity-50" />No hay registros en el log.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.log_id} className="hover:bg-brand-surface-secondary/50 dark:hover:bg-brand-surface-secondary/50">
                    <td className="px-4 py-3 text-sm text-brand-text-secondary whitespace-nowrap">{formatDateTime(row.fecha_evento)}</td>
                    <td className="px-4 py-3 text-sm text-brand-text-secondary">{row.usuario_nombre ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-brand-text-secondary">{row.modulo ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-brand-text-secondary">{row.tabla ?? '—'}</td>
                    <td className="px-4 py-3 text-sm">{accionBadge(row.accion)}</td>
                    <td className="px-4 py-3 text-sm text-brand-text-secondary max-w-[200px] truncate" title={row.registro_descripcion ?? undefined}>{row.registro_descripcion ?? (row.registro_id ?? '—')}</td>
                    <td className="px-4 py-3 text-center"><Button variant="ghost" size="icon" onClick={() => openDetail(row)} className="text-brand-primary hover:text-brand-primary/80"><Eye className="h-4 w-4" /></Button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Detalle del evento</DialogTitle></DialogHeader>
          {detailLoading && <div className="flex justify-center py-4"><Loader className="h-6 w-6 animate-spin text-brand-primary" /></div>}
          {detail && !detailLoading && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-brand-text-secondary">Fecha:</span><span>{formatDateTime(detail.fecha_evento)}</span>
                <span className="text-brand-text-secondary">Usuario:</span><span>{detail.usuario_nombre ?? '—'}</span>
                <span className="text-brand-text-secondary">Módulo / Tabla:</span><span>{detail.modulo} / {detail.tabla}</span>
                <span className="text-brand-text-secondary">Acción:</span><span>{accionBadge(detail.accion)}</span>
                <span className="text-brand-text-secondary">Registro ID:</span><span className="font-mono text-xs break-all">{detail.registro_id ?? '—'}</span>
                <span className="text-brand-text-secondary">Descripción:</span><span>{detail.registro_descripcion ?? '—'}</span>
              </div>
              {detail.observaciones && <div><span className="text-brand-text-secondary">Observaciones:</span><p className="mt-1">{detail.observaciones}</p></div>}
              {detail.valores_anteriores && (
                <div>
                  <Label className="text-brand-text-secondary">Valores anteriores</Label>
                  <pre className="mt-1 p-3 bg-brand-surface-secondary rounded text-xs overflow-x-auto max-h-40 overflow-y-auto">{typeof tryParseJson(detail.valores_anteriores) === 'object' ? JSON.stringify(tryParseJson(detail.valores_anteriores), null, 2) : detail.valores_anteriores}</pre>
                </div>
              )}
              {detail.valores_nuevos && (
                <div>
                  <Label className="text-brand-text-secondary">Valores nuevos</Label>
                  <pre className="mt-1 p-3 bg-brand-surface-secondary rounded text-xs overflow-x-auto max-h-40 overflow-y-auto">{typeof tryParseJson(detail.valores_nuevos) === 'object' ? JSON.stringify(tryParseJson(detail.valores_nuevos), null, 2) : detail.valores_nuevos}</pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AudPageLayout>
  );
}
