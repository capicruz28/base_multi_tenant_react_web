// src/features/admin/pages/ActiveSessionsPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { 
  Loader, 
  Search, 
  Monitor, 
  Smartphone, 
  Globe, 
  Calendar,
  Shield,
  AlertTriangle,
  LogOut,
  RefreshCw
} from 'lucide-react';

// Servicios
import { 
  getAllActiveSessions, 
  revokeSessionById 
} from '../services/session.service';

// Tipos
import { ActiveSession } from '@/features/auth/types/auth.types';

// Utilidad de errores
import { getErrorMessage } from '@/core/services/error.service';

// Guard de autenticación
import { useAuth } from '@/shared/context/AuthContext';

/**
 * 🎨 PÁGINA DE GESTIÓN DE SESIONES ACTIVAS
 * 
 * Características UX/UI:
 * - Vista en cards para mejor legibilidad
 * - Filtros en tiempo real por usuario
 * - Iconos diferenciadores por tipo de cliente
 * - Estados visuales claros (activo/expirando)
 * - Confirmación de acciones críticas
 * - Auto-refresh cada 30 segundos (opcional)
 */
const ActiveSessionsPage: React.FC = () => {
  // Autenticación
  const { isAuthenticated, loading: authLoading, auth } = useAuth();

  // Estados principales
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<ActiveSession[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal de confirmación
  const [isRevokeConfirmOpen, setIsRevokeConfirmOpen] = useState<boolean>(false);
  const [revokingSession, setRevokingSession] = useState<ActiveSession | null>(null);
  const [isRevoking, setIsRevoking] = useState<boolean>(false);

  // Auto-refresh (opcional)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(false);

  /**
   * 🔄 Fetch de sesiones activas
   */
  const fetchActiveSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAllActiveSessions();
      setSessions(data);
      setFilteredSessions(data);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      const errorData = getErrorMessage(err);
      setError(errorData.message || 'Error al cargar las sesiones activas.');
      setSessions([]);
      setFilteredSessions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 🔍 Filtrado local por búsqueda
   */
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSessions(sessions);
      return;
    }

    const lowercasedSearch = searchTerm.toLowerCase();
    const filtered = sessions.filter(
      (session) =>
        session.nombre_usuario?.toLowerCase().includes(lowercasedSearch) ||
        session.nombre?.toLowerCase().includes(lowercasedSearch) ||
        session.apellido?.toLowerCase().includes(lowercasedSearch) ||
        session.ip_address?.toLowerCase().includes(lowercasedSearch)
    );
    setFilteredSessions(filtered);
  }, [searchTerm, sessions]);

  /**
   * 📡 Carga inicial con guards
   */
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    fetchActiveSessions();
  }, [authLoading, isAuthenticated, fetchActiveSessions]);

  /**
   * ⏰ Auto-refresh cada 30 segundos (opcional)
   */
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const intervalId = setInterval(() => {
      fetchActiveSessions();
    }, 30000); // 30 segundos

    return () => clearInterval(intervalId);
  }, [autoRefreshEnabled, fetchActiveSessions]);

  /**
   * 🗑️ Revocar sesión
   */
  const handleOpenRevokeConfirm = (session: ActiveSession) => {
    setRevokingSession(session);
    setIsRevokeConfirmOpen(true);
  };

  const handleCloseRevokeConfirm = () => {
    if (!isRevoking) {
      setIsRevokeConfirmOpen(false);
      setRevokingSession(null);
    }
  };

  const handleConfirmRevoke = async () => {
    if (!revokingSession) return;

    setIsRevoking(true);
    try {
      await revokeSessionById(revokingSession.token_id);
      toast.success(
        `Sesión de ${revokingSession.nombre_usuario} revocada exitosamente.`
      );
      handleCloseRevokeConfirm();
      fetchActiveSessions(); // Recargar lista
    } catch (err) {
      console.error('Error revoking session:', err);
      const errorData = getErrorMessage(err);
      toast.error(errorData.message || 'Error al revocar sesión.');
    } finally {
      setIsRevoking(false);
    }
  };

  /**
   * 🎨 Helper: Icono según tipo de cliente
   */
  const getClientTypeIcon = (clientType: string) => {
    switch (clientType.toLowerCase()) {
      case 'web':
        return <Monitor className="h-5 w-5 text-info" />;
      case 'mobile':
        return <Smartphone className="h-5 w-5 text-success" />;
      default:
        return <Globe className="h-5 w-5 text-text-soft" />;
    }
  };

  /**
   * 🎨 Helper: Badge de estado de expiración
   */
  const getExpirationBadge = (expiresAt: string) => {
    const now = new Date();
    const expiration = new Date(expiresAt);
    const diffHours = (expiration.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 24) {
      return (
        <span className="px-2 py-1 text-xs font-semibold bg-warning/10 text-warning rounded-full flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Expira pronto
        </span>
      );
    }

    return (
      <span className="px-2 py-1 text-xs font-semibold bg-success/10 text-success rounded-full">
        Activo
      </span>
    );
  };

  /**
   * 🎨 Helper: Formatear fecha
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date);
  };

  /**
   * 🎨 Helper: Verificar si es sesión actual
   */
  const isCurrentSession = (session: ActiveSession): boolean => {
    return session.usuario_id === auth.user?.usuario_id;
  };

  // ============================================================================
  // 🎨 RENDERIZADO
  // ============================================================================

  return (
    <div className="w-full">
      {/* Barra de Búsqueda y Acciones */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Búsqueda */}
        <div className="relative w-full sm:w-1/2">
          <input
            type="text"
            placeholder="Buscar por usuario, nombre o IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-3 py-2 w-full border border-border-base bg-surface rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm text-text-base placeholder:text-text-faint dark:bg-subtle"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-soft" />
        </div>

        {/* Acciones */}
        <div className="flex gap-2">
          {/* Toggle Auto-refresh */}
          <button
            onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
            className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
              autoRefreshEnabled
                ? 'bg-brand-primary text-white hover:bg-brand-primary-hover'
                : 'border border-border-base bg-subtle text-text-base hover:bg-overlay dark:bg-subtle dark:text-text-soft dark:hover:bg-overlay'
            }`}
            title={autoRefreshEnabled ? 'Desactivar auto-actualización' : 'Activar auto-actualización'}
          >
            <RefreshCw className={`h-4 w-4 ${autoRefreshEnabled ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">
              {autoRefreshEnabled ? 'Auto' : 'Manual'}
            </span>
          </button>

          {/* Botón Refrescar Manual */}
          <button
            onClick={fetchActiveSessions}
            disabled={isLoading}
            className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      {!isLoading && !error && (
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface p-4 rounded-lg shadow border border-border-base">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-soft">Total Sesiones</p>
                <p className="text-2xl font-bold text-text-base">{sessions.length}</p>
              </div>
              <Shield className="h-8 w-8 text-brand-primary" />
            </div>
          </div>

          <div className="bg-surface p-4 rounded-lg shadow border border-border-base">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-soft">Sesiones Web</p>
                <p className="text-2xl font-bold text-text-base">
                  {sessions.filter(s => s.client_type.toLowerCase() === 'web').length}
                </p>
              </div>
              <Monitor className="h-8 w-8 text-info" />
            </div>
          </div>

          <div className="bg-surface p-4 rounded-lg shadow border border-border-base">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-soft">Sesiones Móvil</p>
                <p className="text-2xl font-bold text-text-base">
                  {sessions.filter(s => s.client_type.toLowerCase() === 'mobile').length}
                </p>
              </div>
              <Smartphone className="h-8 w-8 text-success" />
            </div>
          </div>
        </div>
      )}

      {/* Indicador de Carga */}
      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <Loader className="animate-spin h-8 w-8 text-brand-primary" />
          <p className="ml-3 text-text-soft">
            Cargando sesiones activas...
          </p>
        </div>
      )}

      {/* Error General */}
      {error && !isLoading && (
        <div className="text-center text-error bg-error/10 p-4 rounded-md flex items-center justify-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Grid de Cards de Sesiones */}
      {!isLoading && !error && (
        <>
          {filteredSessions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSessions.map((session) => {
                const isOwnSession = isCurrentSession(session);
                
                return (
                  <div
                    key={session.token_id}
                    className={`bg-surface rounded-lg shadow border p-5 transition-all hover:shadow-lg ${
                      isOwnSession
                        ? 'border-brand-primary dark:border-brand-primary ring-2 ring-brand-primary/20 dark:ring-brand-primary/30'
                        : 'border-border-base'
                    }`}
                  >
                    {/* Header: Usuario y Badge */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-text-base truncate flex items-center gap-2">
                          {session.nombre_usuario}
                          {isOwnSession && (
                            <span className="text-xs bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20 dark:text-brand-primary/80 px-2 py-0.5 rounded-full">
                              Tu sesión
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-text-soft truncate">
                          {session.nombre} {session.apellido}
                        </p>
                      </div>
                      {getExpirationBadge(session.expires_at)}
                    </div>

                    {/* Info: Cliente */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-text-soft">
                        {getClientTypeIcon(session.client_type)}
                        <span className="capitalize">{session.client_type}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-text-soft">
                        <Globe className="h-4 w-4" />
                        <span className="truncate">{session.ip_address || 'IP no disponible'}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-text-soft">
                        <Calendar className="h-4 w-4" />
                        <span>Creada: {formatDate(session.created_at)}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-text-soft">
                        <Calendar className="h-4 w-4" />
                        <span>Expira: {formatDate(session.expires_at)}</span>
                      </div>
                    </div>

                    {/* Botón de Acción */}
                    <button
                      onClick={() => handleOpenRevokeConfirm(session)}
                      disabled={isOwnSession}
                      className={`w-full px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                        isOwnSession
                          ? 'bg-subtle text-text-soft cursor-not-allowed opacity-60 dark:bg-subtle'
                          : 'bg-error text-white hover:bg-error/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-error'
                      }`}
                      title={isOwnSession ? 'No puedes revocar tu propia sesión' : 'Revocar sesión'}
                    >
                      <LogOut className="h-4 w-4" />
                      {isOwnSession ? 'Tu sesión activa' : 'Revocar Sesión'}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Shield className="mx-auto h-12 w-12 text-text-soft mb-4" />
              <p className="text-text-soft text-lg">
                {searchTerm
                  ? 'No se encontraron sesiones que coincidan con la búsqueda.'
                  : 'No hay sesiones activas en este momento.'}
              </p>
            </div>
          )}
        </>
      )}

      {/* Modal de Confirmación de Revocación */}
      {isRevokeConfirmOpen && revokingSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center px-4">
          <div className="relative mx-auto p-6 border border-border-base w-full max-w-md shadow-lg rounded-md bg-surface">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-error" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-medium text-text-base">
                  Confirmar Revocación de Sesión
                </h3>
                <div className="mt-2 text-sm text-text-soft">
                  <p className="mb-2">
                    Estás a punto de revocar la sesión de:
                  </p>
                  <div className="bg-subtle p-3 rounded-md space-y-1">
                    <p className="font-semibold">
                      {revokingSession.nombre_usuario}
                    </p>
                    <p className="text-xs">
                      {revokingSession.nombre} {revokingSession.apellido}
                    </p>
                    <p className="text-xs flex items-center gap-1 mt-2">
                      {getClientTypeIcon(revokingSession.client_type)}
                      {revokingSession.client_type} • {revokingSession.ip_address}
                    </p>
                  </div>
                  <p className="mt-3 text-warning">
                    ⚠️ Esta acción cerrará inmediatamente la sesión del usuario.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCloseRevokeConfirm}
                disabled={isRevoking}
                className="px-4 py-2 text-white bg-brand-secondary rounded-md hover:bg-brand-secondary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-secondary disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmRevoke}
                disabled={isRevoking}
                className="px-4 py-2 bg-error text-white rounded-md hover:bg-error/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-error disabled:opacity-50 flex items-center justify-center"
              >
                {isRevoking && <Loader className="animate-spin h-4 w-4 mr-2" />}
                {isRevoking ? 'Revocando...' : 'Sí, Revocar Sesión'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveSessionsPage;