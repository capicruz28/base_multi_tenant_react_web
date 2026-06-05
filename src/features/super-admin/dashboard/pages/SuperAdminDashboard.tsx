import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Building,
  Users,
  Package,
  Activity,
  Clock,
  Loader,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  PauseCircle,
  Sparkles,
  Ban,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/shared/context/AuthContext';
import { usePlatformDashboardP0 } from '../hooks/usePlatformDashboardP0';
import { usePlatformDashboardP1A } from '../hooks/usePlatformDashboardP1A';
import { usePlatformDashboardP1B } from '../hooks/usePlatformDashboardP1B';
import { usePlatformDashboardP1C } from '../hooks/usePlatformDashboardP1C';
import PlatformAlertBanner from '../components/PlatformAlertBanner';
import ClientesPlanDonutChart from '../components/ClientesPlanDonutChart';
import DashboardKpiCard from '../components/DashboardKpiCard';
import DashboardSection from '../components/DashboardSection';
import DashboardPanel from '../components/DashboardPanel';
import AuthEventsBarChart from '../components/AuthEventsBarChart';
import TopIpsTable from '../components/TopIpsTable';
import TopUsuariosTable from '../components/TopUsuariosTable';
import SyncActivityFeed from '../components/SyncActivityFeed';
import RecentClientesList from '../components/RecentClientesList';
import PlatformOperatorsPanel from '../components/PlatformOperatorsPanel';
import { toEventTypeChartSegments } from '../utils/auditoria-stats.utils';
import { mergeDashboardAlerts } from '../utils/dashboard-alert.rules';

const SuperAdminDashboard: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const dashboard = usePlatformDashboardP0(isSuperAdmin);
  const security = usePlatformDashboardP1A(isSuperAdmin);
  const portfolio = usePlatformDashboardP1B(isSuperAdmin);
  const operations = usePlatformDashboardP1C(isSuperAdmin);

  const dashboardAlerts = mergeDashboardAlerts(
    security.securityAlerts,
    portfolio.portfolioAlerts,
    operations.operatorAlerts,
  );
  const alertsLoading =
    security.alertsLoading || portfolio.snapshotLoading || operations.alertsLoading;

  const statsLoading = security.loginsFallidos.isLoading;
  const statsError = security.loginsFallidos.isError;
  const eventTypeSegments = useMemo(
    () => toEventTypeChartSegments(security.estadisticas?.autenticacion?.eventos_por_tipo),
    [security.estadisticas],
  );

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building className="mx-auto h-12 w-12 text-text-soft" />
          <h3 className="mt-2 text-sm font-medium text-text-base">Acceso restringido</h3>
          <p className="mt-1 text-sm text-text-soft">
            No tienes permisos para acceder al dashboard de super administrador.
          </p>
        </div>
      </div>
    );
  }

  const { actividadReciente } = dashboard;

  return (
    <div className="w-full">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-text-base">Centro de Operaciones</h1>
      </div>

      <PlatformAlertBanner alerts={dashboardAlerts} loading={alertsLoading} />

      <DashboardSection title="Plataforma">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardKpiCard
            icon={Building}
            iconClassName="text-brand-primary"
            label="Clientes Activos"
            metric={dashboard.clientesActivos}
          />
          <DashboardKpiCard
            icon={Building}
            iconClassName="text-brand-primary"
            label="Total Clientes"
            metric={dashboard.totalClientes}
          />
          <DashboardKpiCard
            icon={Users}
            iconClassName="text-info"
            label="Total Usuarios"
            metric={dashboard.totalUsuarios}
          />
          <DashboardKpiCard
            icon={Package}
            iconClassName="text-success"
            label="Módulos"
            metric={dashboard.totalModulos}
          />
        </div>
      </DashboardSection>

      <DashboardSection title="Seguridad 24h">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DashboardKpiCard
            icon={ShieldAlert}
            iconClassName="text-error"
            label="Logins fallidos (24 h)"
            metric={security.loginsFallidos}
          />
          <DashboardKpiCard
            icon={CheckCircle2}
            iconClassName="text-success"
            label="Logins exitosos (24 h)"
            metric={security.loginsExitosos}
          />
          <DashboardKpiCard
            icon={RefreshCw}
            iconClassName="text-warning"
            label="Sync fallidas (24 h)"
            metric={security.syncFallidas}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          <DashboardPanel title="Eventos por tipo">
            <AuthEventsBarChart
              segments={eventTypeSegments}
              loading={statsLoading}
              error={statsError}
            />
          </DashboardPanel>
          <DashboardPanel title="Top IPs">
            <TopIpsTable
              rows={security.estadisticas?.top_ips ?? []}
              loading={statsLoading}
              error={statsError}
            />
          </DashboardPanel>
          <DashboardPanel title="Top usuarios">
            <TopUsuariosTable
              rows={security.estadisticas?.top_usuarios ?? []}
              loading={statsLoading}
              error={statsError}
            />
          </DashboardPanel>
        </div>
      </DashboardSection>

      <DashboardSection title="Cartera">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <DashboardKpiCard
            icon={PauseCircle}
            iconClassName="text-warning"
            label="Clientes suspendidos"
            metric={portfolio.suspendidos}
          />
          <DashboardKpiCard
            icon={Sparkles}
            iconClassName="text-info"
            label="Clientes trial"
            metric={portfolio.trial}
          />
          <DashboardKpiCard
            icon={Ban}
            iconClassName="text-text-soft"
            label="Clientes cancelados"
            metric={portfolio.cancelados}
          />
          <DashboardKpiCard
            icon={AlertCircle}
            iconClassName="text-error"
            label="Clientes morosos"
            metric={portfolio.morosos}
          />
        </div>

        <div className="bg-surface rounded-lg shadow-sm border border-border-base p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <h3 className="text-base font-medium text-text-base">Distribución por plan</h3>
            {portfolio.isPartialSnapshot && !portfolio.snapshotError && (
              <p className="text-xs text-text-soft">
                Basado en {portfolio.aggregation?.totalEnSnapshot ?? 0} de{' '}
                {portfolio.aggregation?.totalReported ?? 0} clientes
              </p>
            )}
          </div>
          <ClientesPlanDonutChart
            segments={portfolio.planDistribution}
            loading={portfolio.snapshotLoading}
            error={portfolio.snapshotError}
          />
        </div>
      </DashboardSection>

      <DashboardSection title="Operación">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DashboardPanel
            title="Actividad reciente"
            action={
              <Link
                to="/super-admin/auditoria"
                className="text-sm text-brand-primary hover:text-brand-primary-hover transition-colors"
              >
                Ver todo
              </Link>
            }
          >
            {actividadReciente.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="h-6 w-6 animate-spin text-brand-primary" />
                <span className="ml-2 text-sm text-text-soft">Cargando actividad...</span>
              </div>
            ) : actividadReciente.isError ? (
              <div className="text-center py-4">
                <ShieldAlert className="mx-auto h-8 w-8 text-text-soft mb-2" />
                <p className="text-sm text-text-soft">
                  No se pudo cargar la actividad reciente
                </p>
              </div>
            ) : actividadReciente.logs.length > 0 ? (
              <div className="space-y-4">
                {actividadReciente.logs.map((log) => {
                  const eventDate = new Date(log.fecha_evento);
                  const tenantLabel =
                    log.cliente?.razon_social ||
                    log.cliente?.nombre_comercial ||
                    'Cliente no identificado';

                  return (
                    <div key={log.log_id} className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <Activity
                          className={`h-5 w-5 ${log.exito ? 'text-success' : 'text-error'}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-base truncate">
                          {tenantLabel}
                        </p>
                        <p className="text-sm text-text-soft truncate">
                          {log.evento}
                          {log.nombre_usuario_intento
                            ? ` · ${log.nombre_usuario_intento}`
                            : log.usuario?.nombre_usuario
                              ? ` · ${log.usuario.nombre_usuario}`
                              : ''}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-xs text-text-soft">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {Number.isNaN(eventDate.getTime())
                          ? '—'
                          : eventDate.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4">
                <Activity className="mx-auto h-8 w-8 text-text-soft mb-2" />
                <p className="text-sm text-text-soft">No hay actividad reciente</p>
              </div>
            )}
          </DashboardPanel>

          <DashboardPanel title="Sincronizaciones recientes">
            <SyncActivityFeed
              logs={operations.syncLogs}
              loading={operations.syncLoading}
              error={operations.syncError}
            />
          </DashboardPanel>

          <DashboardPanel
            title="Clientes recientes"
            action={
              <Link
                to="/super-admin/clientes"
                className="text-sm text-brand-primary hover:text-brand-primary-hover transition-colors"
              >
                Ver todos
              </Link>
            }
          >
            <RecentClientesList
              clientes={operations.recentClientes}
              loading={operations.recentClientesLoading}
              error={operations.recentClientesError}
              isPartial={operations.isPartialRecentClientes}
            />
          </DashboardPanel>

          <DashboardPanel title="Operadores Platform">
            <PlatformOperatorsPanel
              operators={operations.platformOperators}
              loading={operations.operatorsLoading}
              error={operations.operatorsError}
            />
          </DashboardPanel>
        </div>
      </DashboardSection>

      <div className="bg-surface rounded-lg shadow-sm border border-border-base p-4">
        <h3 className="text-lg font-medium text-text-base mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/super-admin/clientes"
            className="flex items-center justify-center p-4 border border-border-base rounded-lg hover:bg-overlay transition-colors"
          >
            <Building className="h-6 w-6 text-brand-primary mr-3" />
            <span className="text-sm font-medium text-text-base">Gestionar Clientes</span>
          </Link>
          <Link
            to="/super-admin/modulos"
            className="flex items-center justify-center p-4 border border-border-base rounded-lg hover:bg-overlay transition-colors"
          >
            <Package className="h-6 w-6 text-success mr-3" />
            <span className="text-sm font-medium text-text-base">Gestionar Módulos</span>
          </Link>
          <Link
            to="/super-admin/auditoria"
            className="flex items-center justify-center p-4 border border-border-base rounded-lg hover:bg-overlay transition-colors"
          >
            <Activity className="h-6 w-6 text-info mr-3" />
            <span className="text-sm font-medium text-text-base">Auditoría Global</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
