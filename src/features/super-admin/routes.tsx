import { RouteObject, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

const SuperAdminDashboard = lazy(() => import('./dashboard/pages/SuperAdminDashboard'));
const ClientManagementPage = lazy(() => import('./clientes/pages/ClientManagementPage'));
const ClientDetailPage = lazy(() => import('./clientes/pages/ClientDetailPage'));
const ModuleManagementPage = lazy(() => import('./modulos/pages/ModuleManagementPage'));

export const superAdminRoutes: RouteObject = {
  path: 'super-admin',
  children: [
    { index: true, element: <Navigate to="dashboard" replace /> },
    {
      path: 'dashboard',
      element: (
        <Suspense fallback={<LoadingSpinner message="Cargando dashboard..." />}>
          <SuperAdminDashboard />
        </Suspense>
      ),
    },
    {
      path: 'clientes',
      element: (
        <Suspense fallback={<LoadingSpinner message="Cargando gestión de clientes..." />}>
          <ClientManagementPage />
        </Suspense>
      ),
    },
    {
      path: 'clientes/:id',
      element: (
        <Suspense fallback={<LoadingSpinner message="Cargando detalle de cliente..." />}>
          <ClientDetailPage />
        </Suspense>
      ),
    },
    {
      path: 'modulos',
      element: (
        <Suspense fallback={<LoadingSpinner message="Cargando gestión de módulos..." />}>
          <ModuleManagementPage />
        </Suspense>
      ),
    },
    { path: '*', element: <Navigate to="/super-admin/dashboard" replace /> },
  ],
};

