/**
 * Trazabilidad AUD — Rastrear cambios de un documento/entidad por registro_id.
 * GET /api/v1/aud/log-auditoria?registro_id=...
 */
import { useState, useEffect, useCallback } from 'react';
import { Loader, GitBranch, Search } from 'lucide-react';
import { empresaService } from '@/features/org/services/org.service';
import { logAuditoriaService } from '../services/aud.service';
import type { Empresa } from '@/features/org/types/org.types';
import type { LogAuditoriaRead } from '../types/aud.types';
import { AudPageLayout } from '../components/AudPageLayout';
import { getErrorMessage } from '@/core/services/error.service';
import { Label } from '@/shared/components/ui/label';

function accionBadge(accion: string) {
  const colors: Record<string, string> = { INSERT: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', UPDATE: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300', DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', SELECT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[accion] ?? 'bg-brand-surface-secondary text-brand-text-secondary dark:bg-brand-surface-secondary'}`}>{accion}</span>;
}

export default function TrazabilidadPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [list, setList] = useState<LogAuditoriaRead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [empresaFilter, setEmpresaFilter] = useState<string>('');
  const [registroId, setRegistroId] = useState<string>('');
  const [moduloFilter, setModuloFilter] = useState<string>('');
  const [tablaFilter, setTablaFilter] = useState<string>('');

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
    if (!registroId.trim()) {
      setError('Ingrese un ID de registro (UUID) para rastrear.');
      setList([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params: { registro_id: string; empresa_id?: string; modulo?: string; tabla?: string; limit?: number } = { registro_id: registroId.trim(), limit: 500 };
      if (empresaFilter) params.empresa_id = empresaFilter;
      if (moduloFilter) params.modulo = moduloFilter;
      if (tablaFilter.trim()) params.tabla = tablaFilter.trim();
      const data = await logAuditoriaService.list(params);
      setList(data);
    } catch (err) {
      setError(getErrorMessage(err).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [registroId, empresaFilter, moduloFilter, tablaFilter]);

  useEffect(() => { loadEmpresas(); }, [loadEmpresas]);

  const formatDateTime = (s: string | null | undefined) => (s ? new Date(s).toLocaleString() : '—');
  const selectCls = 'mt-1 w-full px-3 py-2 border border-brand-border rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-brand-surface-secondary dark:text-brand-text-primary text-sm';
  const inputCls = 'mt-1 w-full px-3 py-2 border border-brand-border rounded-md focus:ring-2 focus:ring-brand-primary dark:bg-brand-surface-secondary dark:text-brand-text-primary text-sm';
  const MODULOS = ['INV', 'SLS', 'FIN', 'ORG', 'PUR', 'HCM', 'BDG', 'PM', 'SVC', 'TKT', 'DMS', 'WFL', 'MFG', 'AUD', ''];

  return (
    <AudPageLayout
      title="Trazabilidad"
      description="Rastrear todos los cambios de un documento o entidad por su ID de registro."
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
        <div className="flex-1 min-w-[280px]">
          <Label className="mr-2">ID de registro (UUID) *</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-text-secondary" />
            <input type="text" placeholder="ej. 550e8400-e29b-41d4-a716-446655440000" value={registroId} onChange={(e) => setRegistroId(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchList()} className={`pl-9 w-full ${inputCls}`} />
          </div>
        </div>
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
        <div className="flex items-end">
          <button type="button" onClick={fetchList} className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-md text-sm font-medium">
            Rastrear
          </button>
        </div>
      </div>
      {loading && <div className="flex justify-center py-12"><Loader className="h-8 w-8 animate-spin text-brand-primary" /></div>}
      {error && !loading && <p className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">{error}</p>}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border border-brand-border shadow">
          <table className="min-w-full divide-y divide-brand-border">
            <thead className="bg-brand-surface-secondary dark:bg-brand-surface-secondary">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase">Usuario</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase">Módulo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase">Tabla</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase">Acción</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase">Descripción</th>
              </tr>
            </thead>
            <tbody className="bg-brand-surface dark:bg-brand-surface divide-y divide-brand-border">
              {list.length === 0 && registroId.trim() === '' ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-brand-text-secondary"><GitBranch className="h-10 w-10 mx-auto mb-2 opacity-50" />Ingrese un ID de registro y pulse Rastrear.</td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-brand-text-secondary">No se encontraron eventos para este registro.</td></tr>
              ) : (
                list.map((row) => (
                  <tr key={row.log_id} className="hover:bg-brand-surface-secondary dark:hover:bg-brand-surface-secondary">
                    <td className="px-4 py-3 text-sm text-brand-text-primary whitespace-nowrap">{formatDateTime(row.fecha_evento)}</td>
                    <td className="px-4 py-3 text-sm text-brand-text-primary">{row.usuario_nombre ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-brand-text-primary">{row.modulo ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-brand-text-primary">{row.tabla ?? '—'}</td>
                    <td className="px-4 py-3 text-sm">{accionBadge(row.accion)}</td>
                    <td className="px-4 py-3 text-sm text-brand-text-primary">{row.registro_descripcion ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </AudPageLayout>
  );
}
