import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import {
  Activity,
  Search,
  Filter,
  Calendar as CalendarIcon,
  Loader,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Globe,
  UserCircle2,
  Building,
} from 'lucide-react';
import { useDebounce } from '@/core/utils/debounce';
import { getErrorMessage } from '@/core/services/error.service';
import { superadminAuditoriaService } from '@/services/superadmin-auditoria.service';
import {
  AuthAuditLog,
  PaginatedAuthAuditLogResponse,
} from '@/types/superadmin-auditoria.types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/components/ui/dialog';
import { useClientes } from '@/core/hooks/useClientes';

export interface AuthAuditLogPanelProps {
  /** Si se define, el listado queda acotado a ese cliente (sin filtro de cliente en UI). */
  clienteId?: string;
  /** Muestra selector de cliente (solo auditoría global). */
  showClienteFilter?: boolean;
}

const PAGE_SIZE = 20;

const AuthAuditLogPanel: React.FC<AuthAuditLogPanelProps> = ({
  clienteId: lockedClienteId,
  showClienteFilter = false,
}) => {
  const [clienteFilter, setClienteFilter] = useState<string>('');
  const effectiveClienteId = lockedClienteId ?? (clienteFilter || undefined);
  const isGlobalScope = !lockedClienteId;

  const { data: clientesData } = useClientes({
    pagina: 1,
    limite: 500,
    enabled: showClienteFilter && isGlobalScope,
  });
  const clientes = clientesData?.clientes ?? [];

  const [data, setData] = useState<PaginatedAuthAuditLogResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState<number>(1);
  const [eventoFilter, setEventoFilter] = useState<string>('');
  const [usuarioIdFilter, setUsuarioIdFilter] = useState<string>('');
  const [exitoFilter, setExitoFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');

  const debouncedEvento = useDebounce(eventoFilter, 400);

  const [selectedLog, setSelectedLog] = useState<AuthAuditLog | null>(null);
  const [detalleLoading, setDetalleLoading] = useState<boolean>(false);

  const errorScopeLabel = lockedClienteId
    ? 'la auditoría del cliente'
    : 'la auditoría global';

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const usuario_id = usuarioIdFilter ? Number(usuarioIdFilter) : undefined;
      const exito =
        exitoFilter === 'all' ? undefined : exitoFilter === 'success' ? true : false;

      const response = await superadminAuditoriaService.getAuthLogsByCliente({
        cliente_id: effectiveClienteId,
        page,
        limit: PAGE_SIZE,
        usuario_id: usuario_id && !isNaN(usuario_id) ? usuario_id : undefined,
        evento: debouncedEvento || undefined,
        exito,
        fecha_desde: fechaDesde ? new Date(fechaDesde).toISOString() : undefined,
        fecha_hasta: fechaHasta ? new Date(fechaHasta).toISOString() : undefined,
      });

      setData(response);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      const errorData = getErrorMessage(err);
      const message = errorData.message || `Error al cargar ${errorScopeLabel}`;
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [
    effectiveClienteId,
    page,
    debouncedEvento,
    exitoFilter,
    usuarioIdFilter,
    fechaDesde,
    fechaHasta,
    errorScopeLabel,
  ]);

  useEffect(() => {
    setPage(1);
  }, [
    debouncedEvento,
    exitoFilter,
    usuarioIdFilter,
    fechaDesde,
    fechaHasta,
    effectiveClienteId,
  ]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleOpenDetalle = async (log: AuthAuditLog) => {
    setSelectedLog(log);
    setDetalleLoading(true);
    const detalleClienteId = effectiveClienteId ?? log.cliente_id;
    try {
      const fullLog = await superadminAuditoriaService.getAuthLogDetalle(
        log.log_id,
        detalleClienteId,
      );
      setSelectedLog(fullLog);
    } catch (err) {
      const errorData = getErrorMessage(err);
      toast.error(errorData.message || 'Error al cargar el detalle del evento');
    } finally {
      setDetalleLoading(false);
    }
  };

  const handleCloseDetalle = () => {
    setSelectedLog(null);
  };

  const totalLogs = data?.total_logs ?? 0;
  const totalPaginas = data?.total_paginas ?? 1;
  const hasActiveFilters =
    !!eventoFilter ||
    !!usuarioIdFilter ||
    exitoFilter !== 'all' ||
    !!fechaDesde ||
    !!fechaHasta ||
    (!!clienteFilter && isGlobalScope);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin h-8 w-8 text-brand-primary" />
        <span className="ml-3 text-text-soft">Cargando historial de auditoría...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-error bg-error/10 p-4 rounded-lg">{error}</div>
        <button
          type="button"
          onClick={fetchLogs}
          className="mt-4 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface rounded-lg shadow-sm border border-border-base p-4">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-brand-primary" />
            <div className="ml-4">
              <p className="text-sm font-medium text-text-soft">Eventos (página)</p>
              <p className="text-2xl font-semibold text-text-base">{data?.logs.length ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-lg shadow-sm border border-border-base p-4">
          <div className="flex items-center">
            <CheckCircle2 className="h-8 w-8 text-success" />
            <div className="ml-4">
              <p className="text-sm font-medium text-text-soft">Éxitos (página)</p>
              <p className="text-2xl font-semibold text-text-base">
                {data?.logs.filter((l) => l.exito).length ?? 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-lg shadow-sm border border-border-base p-4">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-error" />
            <div className="ml-4">
              <p className="text-sm font-medium text-text-soft">Fallos (página)</p>
              <p className="text-2xl font-semibold text-text-base">
                {data?.logs.filter((l) => !l.exito).length ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-lg shadow-sm border border-border-base p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {showClienteFilter && isGlobalScope && (
            <div className="relative md:col-span-2">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-soft" />
              <select
                value={clienteFilter}
                onChange={(e) => setClienteFilter(e.target.value)}
                className="pl-10 pr-8 py-2 w-full border border-border-base rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base text-sm"
              >
                <option value="">Todos los clientes</option>
                {clientes.map((c) => (
                  <option key={c.cliente_id} value={c.cliente_id}>
                    {c.nombre_comercial || c.razon_social} ({c.codigo_cliente})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-soft" />
            <input
              type="text"
              placeholder="Tipo de evento (ej: login_success)"
              value={eventoFilter}
              onChange={(e) => setEventoFilter(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-border-base rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base text-sm"
            />
          </div>

          <div className="relative">
            <UserCircle2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-soft" />
            <input
              type="number"
              placeholder="ID de usuario"
              value={usuarioIdFilter}
              onChange={(e) => setUsuarioIdFilter(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-border-base rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base text-sm"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-soft" />
            <select
              value={exitoFilter}
              onChange={(e) => setExitoFilter(e.target.value as 'all' | 'success' | 'failed')}
              className="pl-10 pr-8 py-2 w-full border border-border-base rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base text-sm"
            >
              <option value="all">Todos</option>
              <option value="success">Solo exitosos</option>
              <option value="failed">Solo fallidos</option>
            </select>
          </div>

          <div className="flex gap-2 md:col-span-2">
            <div className="relative flex-1">
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-soft" />
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="pl-10 pr-2 py-2 w-full border border-border-base rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base text-xs"
                aria-label="Fecha desde"
              />
            </div>
            <div className="relative flex-1">
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-soft" />
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="pl-10 pr-2 py-2 w-full border border-border-base rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base text-xs"
                aria-label="Fecha hasta"
              />
            </div>
          </div>
        </div>

        {loading && (
          <div className="mt-3 flex items-center text-xs text-text-soft">
            <Loader className="h-3 w-3 animate-spin mr-2" />
            Actualizando resultados...
          </div>
        )}
      </div>

      <div className="bg-surface rounded-lg shadow-sm border border-border-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border-base">
            <thead className="bg-subtle">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase tracking-wider">
                  Usuario
                </th>
                {isGlobalScope && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase tracking-wider">
                    Cliente
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase tracking-wider">
                  Evento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase tracking-wider">
                  IP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-soft uppercase tracking-wider">
                  Resultado
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border-base">
              {data && data.logs.length > 0 ? (
                data.logs.map((log) => (
                  <tr
                    key={log.log_id}
                    className="hover:bg-overlay/50 dark:hover:bg-overlay/50 cursor-pointer"
                    onClick={() => handleOpenDetalle(log)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-soft">
                      <div>{new Date(log.fecha_evento).toLocaleDateString()}</div>
                      <div className="text-xs">
                        {new Date(log.fecha_evento).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <UserCircle2 className="h-4 w-4 text-text-soft" />
                        <div>
                          <div className="text-sm text-text-base">
                            {log.usuario?.nombre_usuario ||
                              log.nombre_usuario_intento ||
                              'Anónimo'}
                          </div>
                          {log.usuario_id && (
                            <div className="text-xs text-text-soft">ID: {log.usuario_id}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    {isGlobalScope && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-base">
                        {log.cliente ? (
                          <>
                            <div>{log.cliente.razon_social}</div>
                            <div className="text-xs text-text-soft flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {log.cliente.subdominio}
                            </div>
                          </>
                        ) : (
                          <span className="text-text-soft text-xs">N/D</span>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-base">
                      {log.evento}
                      {log.descripcion && (
                        <div className="text-xs text-text-soft mt-1 line-clamp-1">
                          {log.descripcion}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-soft">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-text-soft" />
                        <span>{log.ip_address || 'N/D'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          log.exito
                            ? 'bg-success/10 text-success'
                            : 'bg-error/10 text-error'
                        }`}
                      >
                        {log.exito ? 'Exitoso' : 'Fallido'}
                      </span>
                      {log.codigo_error && (
                        <div className="mt-1 text-xs text-error">{log.codigo_error}</div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={isGlobalScope ? 6 : 5}
                    className="px-6 py-10 text-center text-sm text-text-soft"
                  >
                    <Activity className="mx-auto h-12 w-12 text-text-soft mb-4" />
                    {hasActiveFilters ? (
                      <>
                        <p>No se encontraron eventos con los filtros aplicados.</p>
                        <p className="mt-1 text-xs">Ajusta los filtros para ver más resultados.</p>
                      </>
                    ) : lockedClienteId ? (
                      <p>No hay eventos de autenticación registrados para este cliente.</p>
                    ) : (
                      <p>No hay eventos de autenticación registrados en el sistema.</p>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data && totalLogs > PAGE_SIZE && (
          <div className="px-6 py-4 border-t border-border-base bg-subtle">
            <div className="flex items-center justify-between">
              <div className="text-sm text-text-base">
                Mostrando <span className="font-medium">{(page - 1) * PAGE_SIZE + 1}</span> a{' '}
                <span className="font-medium">{Math.min(page * PAGE_SIZE, totalLogs)}</span> de{' '}
                <span className="font-medium">{totalLogs}</span> eventos
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border border-border-base rounded-md bg-surface text-text-soft hover:bg-overlay dark:hover:bg-overlay disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="px-3 py-1 text-sm text-text-base">
                  Página {page} de {totalPaginas}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPaginas))}
                  disabled={page === totalPaginas}
                  className="px-3 py-1 text-sm border border-border-base rounded-md bg-surface text-text-soft hover:bg-overlay dark:hover:bg-overlay disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && handleCloseDetalle()}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalle de evento de autenticación</DialogTitle>
            <DialogDescription>
              Información completa del intento de autenticación y su contexto.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 text-sm text-text-base">
              {detalleLoading && (
                <div className="flex items-center text-xs text-text-soft">
                  <Loader className="h-3 w-3 animate-spin mr-2" />
                  Cargando detalle desde el servidor...
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-1">Evento</h4>
                  <p className="break-words">{selectedLog.evento}</p>
                  {selectedLog.descripcion && (
                    <p className="mt-1 text-xs text-text-soft">{selectedLog.descripcion}</p>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Resultado</h4>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedLog.exito
                          ? 'bg-success/10 text-success'
                          : 'bg-error/10 text-error'
                      }`}
                    >
                      {selectedLog.exito ? 'Exitoso' : 'Fallido'}
                    </span>
                    {selectedLog.codigo_error && (
                      <span className="text-xs text-error">{selectedLog.codigo_error}</span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-text-soft">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{new Date(selectedLog.fecha_evento).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-1">Usuario</h4>
                  <p>
                    {selectedLog.usuario?.nombre_usuario ||
                      selectedLog.nombre_usuario_intento ||
                      'Anónimo'}
                  </p>
                  {selectedLog.usuario_id && (
                    <p className="text-xs text-text-soft">ID: {selectedLog.usuario_id}</p>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Cliente</h4>
                  {selectedLog.cliente ? (
                    <>
                      <p>{selectedLog.cliente.razon_social}</p>
                      <p className="text-xs text-text-soft">
                        {selectedLog.cliente.codigo_cliente} • {selectedLog.cliente.subdominio}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-text-soft">Sin información de cliente.</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-1">Red y dispositivo</h4>
                  <p className="text-xs">IP: {selectedLog.ip_address || 'N/D'}</p>
                  <p className="text-xs mt-1">
                    User agent:{' '}
                    {selectedLog.user_agent
                      ? selectedLog.user_agent.substring(0, 120)
                      : 'N/D'}
                  </p>
                  {selectedLog.device_info && (
                    <p className="text-xs mt-1">Device: {selectedLog.device_info}</p>
                  )}
                  {selectedLog.geolocation && (
                    <p className="text-xs mt-1">Geo: {selectedLog.geolocation}</p>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Metadata</h4>
                  {selectedLog.metadata_json ? (
                    <pre className="text-xs bg-subtle text-text-base border border-border-base rounded-md p-2 max-h-40 overflow-y-auto whitespace-pre-wrap font-mono">
                      {JSON.stringify(selectedLog.metadata_json, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-xs text-text-soft">
                      No hay metadata adicional para este evento.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuthAuditLogPanel;
