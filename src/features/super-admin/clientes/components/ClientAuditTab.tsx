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

interface ClientAuditTabProps {
  clienteId: string;
}

const PAGE_SIZE = 20;

const ClientAuditTab: React.FC<ClientAuditTabProps> = ({ clienteId }) => {
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

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const usuario_id = usuarioIdFilter ? Number(usuarioIdFilter) : undefined;
      const exito =
        exitoFilter === 'all' ? undefined : exitoFilter === 'success' ? true : false;

      const response = await superadminAuditoriaService.getAuthLogsByCliente({
        cliente_id: clienteId,
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
      setError(errorData.message || 'Error al cargar la auditoría del cliente');
      toast.error(errorData.message || 'Error al cargar la auditoría del cliente');
    } finally {
      setLoading(false);
    }
  }, [clienteId, page, debouncedEvento, exitoFilter, usuarioIdFilter, fechaDesde, fechaHasta]);

  useEffect(() => {
    setPage(1);
  }, [debouncedEvento, exitoFilter, usuarioIdFilter, fechaDesde, fechaHasta, clienteId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleOpenDetalle = async (log: AuthAuditLog) => {
    setSelectedLog(log);
    setDetalleLoading(true);
    try {
      const fullLog = await superadminAuditoriaService.getAuthLogDetalle(log.log_id, clienteId);
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

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin h-8 w-8 text-brand-primary" />
        <span className="ml-3 text-gray-600 dark:text-gray-400">
          Cargando historial de auditoría...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          {error}
        </div>
        <button
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
      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-brand-primary" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Eventos (página)
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {data?.logs.length ?? 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Éxitos (página)
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {data?.logs.filter((l) => l.exito).length ?? 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Fallos (página)
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {data?.logs.filter((l) => !l.exito).length ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tipo de evento (ej: login_success)"
              value={eventoFilter}
              onChange={(e) => setEventoFilter(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>

          <div className="relative">
            <UserCircle2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="number"
              placeholder="ID de usuario"
              value={usuarioIdFilter}
              onChange={(e) => setUsuarioIdFilter(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={exitoFilter}
              onChange={(e) => setExitoFilter(e.target.value as any)}
              className="pl-10 pr-8 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="all">Todos</option>
              <option value="success">Solo exitosos</option>
              <option value="failed">Solo fallidos</option>
            </select>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="pl-10 pr-2 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:text-white text-xs"
              />
            </div>
            <div className="relative flex-1">
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="pl-10 pr-2 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary dark:bg-gray-700 dark:text-white text-xs"
              />
            </div>
          </div>
        </div>

        {loading && (
          <div className="mt-3 flex items-center text-xs text-gray-500 dark:text-gray-400">
            <Loader className="h-3 w-3 animate-spin mr-2" />
            Actualizando resultados...
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Evento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  IP / Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Resultado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {data && data.logs.length > 0 ? (
                data.logs.map((log) => (
                  <tr
                    key={log.log_id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                    onClick={() => handleOpenDetalle(log)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div>{new Date(log.fecha_evento).toLocaleDateString()}</div>
                      <div className="text-xs">
                        {new Date(log.fecha_evento).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <UserCircle2 className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="text-sm text-gray-900 dark:text-white">
                            {log.usuario?.nombre_usuario ||
                              log.nombre_usuario_intento ||
                              'Anónimo'}
                          </div>
                          {typeof log.usuario_id === 'number' && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              ID: {log.usuario_id}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {log.evento}
                      {log.descripcion && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                          {log.descripcion}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-gray-400" />
                        <span>{log.ip_address || 'N/D'}</span>
                      </div>
                      {log.cliente && (
                        <div className="flex items-center gap-1 text-xs mt-1">
                          <Globe className="h-3 w-3" />
                          <span>{log.cliente.subdominio}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          log.exito
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                      >
                        {log.exito ? 'Exitoso' : 'Fallido'}
                      </span>
                      {log.codigo_error && (
                        <div className="mt-1 text-xs text-red-500 dark:text-red-400">
                          {log.codigo_error}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    {eventoFilter ||
                    usuarioIdFilter ||
                    exitoFilter !== 'all' ||
                    fechaDesde ||
                    fechaHasta ? (
                      <>
                        <p>No se encontraron eventos con los filtros aplicados.</p>
                        <p className="mt-1 text-xs">
                          Ajusta los filtros para ver más resultados.
                        </p>
                      </>
                    ) : (
                      <p>No hay eventos de autenticación registrados para este cliente.</p>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {data && totalLogs > PAGE_SIZE && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Mostrando{' '}
                <span className="font-medium">{(page - 1) * PAGE_SIZE + 1}</span> a{' '}
                <span className="font-medium">
                  {Math.min(page * PAGE_SIZE, totalLogs)}
                </span>{' '}
                de <span className="font-medium">{totalLogs}</span> eventos
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                  Página {page} de {totalPaginas}
                </span>
                <button
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPaginas))}
                  disabled={page === totalPaginas}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detalle de evento */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && handleCloseDetalle()}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalle de evento de autenticación</DialogTitle>
            <DialogDescription>
              Información completa del intento de autenticación y su contexto.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
              {detalleLoading && (
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <Loader className="h-3 w-3 animate-spin mr-2" />
                  Cargando detalle desde el servidor...
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-1">Evento</h4>
                  <p className="break-words">{selectedLog.evento}</p>
                  {selectedLog.descripcion && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {selectedLog.descripcion}
                    </p>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Resultado</h4>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedLog.exito
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}
                    >
                      {selectedLog.exito ? 'Exitoso' : 'Fallido'}
                    </span>
                    {selectedLog.codigo_error && (
                      <span className="text-xs text-red-500 dark:text-red-400">
                        {selectedLog.codigo_error}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
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
                  {typeof selectedLog.usuario_id === 'number' && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      ID: {selectedLog.usuario_id}
                    </p>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Cliente</h4>
                  {selectedLog.cliente ? (
                    <>
                      <p>{selectedLog.cliente.razon_social}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedLog.cliente.codigo_cliente} •{' '}
                        {selectedLog.cliente.subdominio}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-400">Sin información de cliente.</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-1">Red y dispositivo</h4>
                  <p className="text-xs">
                    IP: {selectedLog.ip_address || 'N/D'}
                  </p>
                  <p className="text-xs mt-1">
                    User agent:{' '}
                    {selectedLog.user_agent
                      ? selectedLog.user_agent.substring(0, 120)
                      : 'N/D'}
                  </p>
                  {selectedLog.device_info && (
                    <p className="text-xs mt-1">
                      Device: {selectedLog.device_info}
                    </p>
                  )}
                  {selectedLog.geolocation && (
                    <p className="text-xs mt-1">
                      Geo: {selectedLog.geolocation}
                    </p>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Metadata</h4>
                  {selectedLog.metadata_json ? (
                    <pre className="text-xs bg-gray-900/80 text-gray-100 rounded-md p-2 max-h-40 overflow-y-auto whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.metadata_json, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-xs text-gray-400">
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

export default ClientAuditTab;













