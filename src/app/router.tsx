import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ProtectedRoute from '@/shared/components/ProtectedRoute';
import { PermissionGuard } from '@/app/router/guards/PermissionGuard';
import NewLayout from '@/shared/components/layout/NewLayout';
import SmartRedirect from '@/shared/components/SmartRedirect';
import LoadingSpinner from '@/shared/components/LoadingSpinner';
import UnauthorizedPage from '@/pages/UnauthorizedPage';

// ✅ FASE 4: Lazy loading de módulos completos
// Rutas públicas (no lazy, se cargan siempre)
import { authRoutes } from '@/features/auth/routes';

// Rutas de administración (no lazy, se usan frecuentemente)
import { adminRoutes } from '@/features/admin/routes';
import { superAdminRoutes } from '@/features/super-admin/routes';
import { homeRoutes } from '@/features/home/routes';

// ✅ FASE 4: Módulos de negocio con lazy loading completo
const AutorizacionRouter = lazy(() => import('@/features/hcm/asistencia/autorizacion/routes'));
const ReportesHCMRouter = lazy(() => import('@/features/hcm/reportes/routes'));

// ✅ FUTURO: Módulos adicionales (ejemplo)
// const PlanillasRouter = lazy(() => import('@/features/hcm/planillas/routes'));
// const LogisticaRouter = lazy(() => import('@/features/scm/logistica/routes'));

export const router = createBrowserRouter(
  [
    // Rutas públicas
    ...authRoutes,
    {
      path: '/unauthorized',
      element: <UnauthorizedPage />,
    },

    // Rutas protegidas (usuario normal)
    {
      element: <ProtectedRoute />,
      children: [
        {
          path: '/',
          element: <NewLayout />,
          children: [
            { index: true, element: <SmartRedirect /> },
            ...homeRoutes,
            // ✅ FASE 4: Módulo de Autorización con lazy loading y PermissionGuard
            {
              path: 'autorizacion/*',
              element: (
                <PermissionGuard module="autorizacion" action="ver">
                  <Suspense fallback={<LoadingSpinner message="Cargando módulo de autorización..." />}>
                    <AutorizacionRouter />
                  </Suspense>
                </PermissionGuard>
              ),
            },
            // Ruta directa para compatibilidad (redirige al módulo)
            {
              path: 'finalizartareo',
              element: <Navigate to="/autorizacion/finalizartareo" replace />,
            },
            // ✅ FASE 4: Módulo de Reportes HCM con lazy loading y PermissionGuard
            {
              path: 'reportes/*',
              element: (
                <PermissionGuard module="reportes" action="ver">
                  <Suspense fallback={<LoadingSpinner message="Cargando módulo de reportes..." />}>
                    <ReportesHCMRouter />
                  </Suspense>
                </PermissionGuard>
              ),
            },
            // Ruta directa para compatibilidad (redirige al módulo)
            {
              path: 'reportedestajo',
              element: <Navigate to="/reportes/reportedestajo" replace />,
            },
            // ✅ FUTURO: Ejemplo de cómo se agregarían nuevos módulos
            // {
            //   path: 'planillas/*',
            //   element: (
            //     <PermissionGuard module="planillas" action="ver">
            //       <Suspense fallback={<LoadingSpinner message="Cargando módulo de planillas..." />}>
            //         <PlanillasRouter />
            //       </Suspense>
            //     </PermissionGuard>
            //   ),
            // },
            { path: '*', element: <SmartRedirect /> },
          ],
        },
      ],
    },

    // Rutas de administración (tenant admin)
    {
      element: <ProtectedRoute requiredLevel={4} />,
      children: [
        {
          path: '/admin',
          element: <NewLayout />,
          children: adminRoutes.children || [],
        },
      ],
    },

    // Rutas de super admin
    {
      element: <ProtectedRoute requireSuperAdmin={true} />,
      children: [
        {
          path: '/super-admin',
          element: <NewLayout />,
          children: superAdminRoutes.children || [],
        },
      ],
    },
  ],
  {
    // ✅ React Router v7 Future Flags - Elimina warnings de deprecación
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);

