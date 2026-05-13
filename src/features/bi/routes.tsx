/**
 * Rutas del módulo BI (Reportes y Analytics).
 * Base path: /bi (definido en app router).
 * Navegación en BD: /bi/reportes, /bi/dashboards
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

const ReportesPage = lazy(() => import('./pages/ReportesPage'));
const DashboardsPage = lazy(() => import('./pages/DashboardsPage'));

export default function BiRouter() {
  return (
    <Routes>
      <Route index element={<Navigate to="reportes" replace />} />
      <Route
        path="reportes"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Reportes..." />}>
            <ReportesPage />
          </Suspense>
        }
      />
      <Route
        path="dashboards"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Dashboards..." />}>
            <DashboardsPage />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="reportes" replace />} />
    </Routes>
  );
}
