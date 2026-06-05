import { createBrowserRouter } from 'react-router-dom';
import ProtectedRoute from '@/shared/components/ProtectedRoute';
import AppLayout from '@/shared/components/layout/AppLayout';
import AdminLayout from '@/shared/components/layout/AdminLayout';
import SuperAdminLayout from '@/shared/components/layout/SuperAdminLayout';
import SmartRedirect from '@/shared/components/SmartRedirect';
import UnauthorizedPage from '@/pages/UnauthorizedPage';

import { authRoutes } from '@/features/auth/routes';
import { adminRoutes } from '@/features/admin/routes';
import { superAdminRoutes } from '@/features/super-admin/routes';
import { legacyErpRedirectRoutes } from '@/app/router/legacy-redirect-routes';
import { appRouteChildren } from '@/app/router/app-route-tree';

export const router = createBrowserRouter([
  ...authRoutes,
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
  },

  // Compatibilidad: rutas ERP legacy sin prefijo /app
  ...legacyErpRedirectRoutes,

  // Raíz: redirección por tipo de usuario (sin layout)
  {
    element: <ProtectedRoute />,
    children: [{ path: '/', element: <SmartRedirect /> }],
  },

  // Panel ERP operativo — solo usuarios operativos
  {
    element: <ProtectedRoute requireOperationalUser />,
    children: [
      {
        path: '/app',
        element: <AppLayout />,
        children: appRouteChildren,
      },
    ],
  },

  // Panel admin del tenant (user_type; el menú viene de /auth/menu)
  {
    element: <ProtectedRoute requireTenantAdmin />,
    children: [
      {
        path: '/admin',
        element: <AdminLayout />,
        children: adminRoutes.children || [],
      },
    ],
  },

  // Panel super admin CAXIS
  {
    element: <ProtectedRoute requireSuperAdmin />,
    children: [
      {
        path: '/super-admin',
        element: <SuperAdminLayout />,
        children: superAdminRoutes.children || [],
      },
    ],
  },
]);
