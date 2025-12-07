import { RouteObject, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

const UserManagementPage = lazy(() => import('./pages/UserManagementPage'));
const RoleManagementPage = lazy(() => import('./pages/RoleManagementPage'));
const AreaManagementPage = lazy(() => import('./pages/AreaManagementPage'));
const MenuManagementPage = lazy(() => import('./pages/MenuManagementPage'));
const ActiveSessionsPage = lazy(() => import('./pages/ActiveSessionsPage'));

export const adminRoutes: RouteObject = {
  path: 'admin',
  children: [
    { index: true, element: <Navigate to="usuarios" replace /> },
    {
      path: 'usuarios',
      element: (
        <Suspense fallback={<LoadingSpinner message="Cargando gestión de usuarios..." />}>
          <UserManagementPage />
        </Suspense>
      ),
    },
    {
      path: 'roles',
      element: (
        <Suspense fallback={<LoadingSpinner message="Cargando gestión de roles..." />}>
          <RoleManagementPage />
        </Suspense>
      ),
    },
    {
      path: 'areas',
      element: (
        <Suspense fallback={<LoadingSpinner message="Cargando gestión de áreas..." />}>
          <AreaManagementPage />
        </Suspense>
      ),
    },
    {
      path: 'menus',
      element: (
        <Suspense fallback={<LoadingSpinner message="Cargando gestión de menús..." />}>
          <MenuManagementPage />
        </Suspense>
      ),
    },
    {
      path: 'sesiones',
      element: (
        <Suspense fallback={<LoadingSpinner message="Cargando sesiones activas..." />}>
          <ActiveSessionsPage />
        </Suspense>
      ),
    },
    { path: '*', element: <Navigate to="/admin/usuarios" replace /> },
  ],
};

