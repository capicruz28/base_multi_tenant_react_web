import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Loader, RefreshCw, XCircle } from 'lucide-react';
import type { SyncAuditLog } from '@/types/superadmin-auditoria.types';

export interface SyncActivityFeedProps {
  logs: SyncAuditLog[];
  loading?: boolean;
  error?: boolean;
}

const isFailedSync = (estado: string): boolean =>
  estado.toLowerCase() === 'fallido' || estado.toLowerCase() === 'failed';

const formatSyncTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const resolveTenantLabel = (log: SyncAuditLog): string => {
  const origen =
    log.cliente_origen?.razon_social ||
    log.cliente_origen?.nombre_comercial ||
    log.cliente_origen?.codigo_cliente;
  const destino =
    log.cliente_destino?.razon_social ||
    log.cliente_destino?.nombre_comercial ||
    log.cliente_destino?.codigo_cliente;

  if (origen && destino && origen !== destino) {
    return `${origen} → ${destino}`;
  }
  return origen || destino || 'Tenant no identificado';
};

const SyncActivityFeed: React.FC<SyncActivityFeedProps> = ({
  logs,
  loading = false,
  error = false,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="h-6 w-6 animate-spin text-brand-primary" />
        <span className="ml-2 text-sm text-text-soft">Cargando sincronizaciones...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <RefreshCw className="mx-auto h-8 w-8 text-text-soft mb-2" />
        <p className="text-sm text-text-soft">No se pudo cargar el feed de sincronización</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-6">
        <RefreshCw className="mx-auto h-8 w-8 text-text-soft mb-2" />
        <p className="text-sm text-text-soft">No hay sincronizaciones recientes</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => {
        const failed = isFailedSync(log.estado);
        return (
          <div key={log.log_id} className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              {failed ? (
                <XCircle className="h-5 w-5 text-error" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-success" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-base truncate">{resolveTenantLabel(log)}</p>
              <p className="text-sm text-text-soft truncate">
                {log.tipo_sincronizacion} · {log.operacion}
                {log.usuario?.nombre_usuario ? ` · ${log.usuario.nombre_usuario}` : ''}
              </p>
              {failed && log.mensaje_error && (
                <p className="text-xs text-error truncate mt-0.5">{log.mensaje_error}</p>
              )}
            </div>
            <div className="flex-shrink-0 text-xs text-text-soft">
              {formatSyncTime(log.fecha_sincronizacion)}
            </div>
          </div>
        );
      })}
      <div className="pt-2">
        <Link
          to="/super-admin/auditoria?estado=fallido"
          className="text-sm text-brand-primary hover:text-brand-primary-hover transition-colors"
        >
          Ver fallos en auditoría
        </Link>
      </div>
    </div>
  );
};

export default SyncActivityFeed;
