/**
 * Rutas Mi Cuenta — árbol anidado bajo `/app/cuenta/*`.
 * Registrado en `app-route-tree.tsx` vía spread de `accountRoutes`.
 */
import { lazy, Suspense, type ReactElement, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';

import LoadingSpinner from '@/shared/components/LoadingSpinner';
import AccountCenterLayout from '@/features/account/layout/AccountCenterLayout';

const AccountProfilePage = lazy(() => import('@/features/account/pages/AccountProfilePage'));
const AccountSecurityPage = lazy(() => import('@/features/account/pages/AccountSecurityPage'));
const AccountPreferencesPage = lazy(() => import('@/features/account/pages/AccountPreferencesPage'));
const MySessionsPage = lazy(() => import('@/features/auth/pages/MySessionsPage'));

function withSuspense(element: ReactNode, message: string): ReactElement {
  return <Suspense fallback={<LoadingSpinner message={message} />}>{element}</Suspense>;
}

export const accountRoutes: RouteObject[] = [
  {
    path: 'cuenta',
    element: <AccountCenterLayout />,
    children: [
      { index: true, element: <Navigate to="informacion" replace /> },
      {
        path: 'informacion',
        element: withSuspense(<AccountProfilePage />, 'Cargando información personal...'),
      },
      {
        path: 'seguridad',
        element: withSuspense(<AccountSecurityPage />, 'Cargando seguridad...'),
      },
      {
        path: 'sesiones',
        element: withSuspense(<MySessionsPage />, 'Cargando sesiones...'),
      },
      {
        path: 'preferencias',
        element: withSuspense(<AccountPreferencesPage />, 'Cargando preferencias...'),
      },
    ],
  },
];
