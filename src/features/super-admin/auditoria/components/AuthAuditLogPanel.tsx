import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Activity,
  Filter,
  Calendar as CalendarIcon,
  Loader,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Globe,
  UserCircle2,
  Building,
  RefreshCw,
} from 'lucide-react';
import { getErrorMessage } from '@/core/services/error.service';
import { superadminAuditoriaService } from '@/services/superadmin-auditoria.service';
import type { AuthAuditLog } from '@/types/superadmin-auditoria.types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/components/ui/dialog';
import { useClientes } from '@/core/hooks/useClientes';
import { useDebouncedSearch } from '@/core/list';
import { ErpPagination } from '@/shared/components/erp-list';
import { OrgToolbarSearch } from '@/features/org/components/OrgToolbarSearch';
import { InvTableSkeleton } from '@/features/inv/components/InvTableSkeleton';
import { IamTableEmptyState } from '@/features/admin/components/iam';

export interface AuthAuditLogPanelProps {
  /** Si se define, el listado queda acotado a ese cliente (sin filtro de cliente en UI). */
  clienteId?: string;
  /** Muestra selector de cliente (solo auditoría global). */
  showClienteFilter?: boolean;
}

const DEFAULT_LIMIT = 25;
const LIMIT_OPTIONS = [10, 25, 50] as const;

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

  const eventSearch = useDebouncedSearch();

  const [page, setPage] = useState<number>(1);
  const [limitPerPage, setLimitPerPage] = useState<number>(DEFAULT_LIMIT);
  const [usuarioIdFilter, setUsuarioIdFilter] = useState<string>('');
  const [exitoFilter, setExitoFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');

  const [selectedLog, setSelectedLog] = useState<AuthAuditLog | null>(null);
  const [detalleLoading, setDetalleLoading] = useState<boolean>(false);

  const errorScopeLabel = lockedClienteId
    ? 'la auditoría del cliente'
    : 'la auditoría global';

  useEffect(() => {
    setPage(1);
  }, [
    eventSearch.debouncedValue,
    exitoFilter,
    usuarioIdFilter,
    fechaDesde,
    fechaHasta,
    effectiveClienteId,
  ]);

  const {
    data,
    isLoading,
    isFetching,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: [
      'superadmin',
      'auth-audit-logs',
      effectiveClienteId ?? '',
      page,
      limitPerPage,
      eventSearch.debouncedValue,
      exitoFilter,
      usuarioIdFilter,
      fechaDesde,
      fechaHasta,
    ],
    queryFn: async () => {
      const usuario_id = usuarioIdFilter ? Number(usuarioIdFilter) : undefined;
      const exito =
        exitoFilter === 'all' ? undefined : exitoFilter === 'success' ? true : false;

      return superadminAuditoriaService.getAuthLogsByCliente({
        cliente_id: effectiveClienteId,
        page,
        limit: limitPerPage,
        usuario_id: usuario_id && !isNaN(usuario_id) ? usuario_id : undefined,
        evento: eventSearch.debouncedValue || undefined,
        exito,
        fecha_desde: fechaDesde ? new Date(fechaDesde).toISOString() : undefined,
        fecha_hasta: fechaHasta ? new Date(fechaHasta).toISOString() : undefined,
      });
    },
  });

  const logs = data?.logs ?? [];
  const listError = queryError
    ? getErrorMessage(queryError).message || `Error al cargar ${errorScopeLabel}`
    : null;

  const tableColSpan = isGlobalScope ? 6 : 5;

  const pagination = data
    ? {
        total: data.total_logs,
        pagina_actual: data.pagina_actual,
        total_paginas: data.total_paginas,
        limit: limitPerPage,
      }
    : undefined;

  const showInitialSkeleton = isLoading && logs.length === 0;
  const listIsRefreshing = isFetching && logs.length > 0;

  const hasActiveFilters =
    eventSearch.hasSearch ||
    !!usuarioIdFilter ||
    exitoFilter !== 'all' ||
    !!fechaDesde ||
    !!fechaHasta ||
    (!!clienteFilter && isGlobalScope);

  const handleLimitChange = (nextLimit: number) => {
    setLimitPerPage(nextLimit);
    setPage(1);
  };

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

  const emptyTitle = hasActiveFilters
    ? 'No se encontraron eventos con los filtros aplicados.'
    : lockedClienteId
      ? 'No hay eventos de autenticación registrados para este cliente.'
      : 'No hay eventos de autenticación registrados en el sistema.';

  const emptyDescription = hasActiveFilters
    ? 'Ajusta los filtros para ver más resultados.'
    : undefined;

  return (
    <div className="w-full">
      <div className="mb-4 bg-surface rounded-lg shadow-sm border border-border-base p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-wrap items-center">
            {showClienteFilter && isGlobalScope && (
              <div className="relative shrink-0 min-w-[12rem] max-w-xs w-full sm:w-auto">
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

            <OrgToolbarSearch
              value={eventSearch.inputValue}
              onChange={eventSearch.setInputValue}
              placeholder="Tipo de evento (ej: login_success)"
              aria-label="Filtrar por tipo de evento"
            />

            <div className="relative shrink-0 min-w-[9rem] w-full sm:w-auto">
              <UserCircle2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-soft" />
              <input
                type="number"
                placeholder="ID de usuario"
                value={usuarioIdFilter}
                onChange={(e) => setUsuarioIdFilter(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-border-base rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base text-sm"
              />
            </div>

            <div className="relative shrink-0 min-w-[10rem] w-full sm:w-auto">
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

            <div className="flex gap-2 shrink-0 w-full sm:w-auto">
              <div className="relative flex-1 min-w-[8.5rem]">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-soft" />
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="pl-10 pr-2 py-2 w-full border border-border-base rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base text-xs"
                  aria-label="Fecha desde"
                />
              </div>
              <div className="relative flex-1 min-w-[8.5rem]">
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

          <div className="flex gap-2 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isFetching}
              className="p-2 text-text-soft hover:text-text-base hover:bg-overlay dark:hover:bg-overlay rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Actualizar"
              aria-label="Actualizar listado"
            >
              <RefreshCw className={`h-5 w-5 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-surface rounded-lg shadow-sm border border-border-base p-3">
          <div className="flex items-center">
            <Activity className="h-6 w-6 flex-shrink-0 text-brand-primary" />
            <div className="ml-3 min-w-0">
              <p className="text-sm font-medium text-text-soft">Eventos (página)</p>
              <p className="text-xl font-semibold text-text-base">{logs.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-lg shadow-sm border border-border-base p-3">
          <div className="flex items-center">
            <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-success" />
            <div className="ml-3 min-w-0">
              <p className="text-sm font-medium text-text-soft">Éxitos (página)</p>
              <p className="text-xl font-semibold text-text-base">
                {logs.filter((l) => l.exito).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-surface rounded-lg shadow-sm border border-border-base p-3">
          <div className="flex items-center">
            <XCircle className="h-6 w-6 flex-shrink-0 text-error" />
            <div className="ml-3 min-w-0">
              <p className="text-sm font-medium text-text-soft">Fallos (página)</p>
              <p className="text-xl font-semibold text-text-base">
                {logs.filter((l) => !l.exito).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {listError && !isLoading ? (
        <div className="mb-4 rounded-lg border border-border-base bg-surface p-6">
          <p className="text-error bg-error/10 p-4 rounded-lg mb-4">{listError}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reintentar
          </button>
        </div>
      ) : null}

      {!listError ? (
        <div className="bg-surface rounded-lg shadow-sm border border-border-base overflow-hidden">
          <div
            className={`transition-opacity duration-150 ${listIsRefreshing ? 'opacity-70' : 'opacity-100'}`}
            aria-busy={listIsRefreshing}
          >
            {showInitialSkeleton ? (
              <InvTableSkeleton columns={tableColSpan} />
            ) : (
              <>
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
                      {logs.length > 0 ? (
                        logs.map((log) => (
                          <tr
                            key={log.log_id}
                            className="hover:bg-overlay/50 dark:hover:bg-overlay/50 cursor-pointer"
                            onClick={() => void handleOpenDetalle(log)}
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
                                    <div className="text-xs text-text-soft">
                                      ID: {log.usuario_id}
                                    </div>
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
                        <IamTableEmptyState
                          colSpan={tableColSpan}
                          icon={Activity}
                          title={emptyTitle}
                          description={emptyDescription}
                        />
                      )}
                    </tbody>
                  </table>
                </div>

                {pagination ? (
                  <ErpPagination
                    pagination={pagination}
                    onPageChange={setPage}
                    onLimitChange={handleLimitChange}
                    limitOptions={LIMIT_OPTIONS}
                    disabled={isFetching}
                  />
                ) : null}
              </>
            )}
          </div>
        </div>
      ) : null}

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
