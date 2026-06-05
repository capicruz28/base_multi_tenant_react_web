import type { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { LegacyErpRedirect } from '@/app/router/LegacyErpRedirect';
import { ERP_ROUTE_SEGMENTS } from '@/core/routing/post-login-path';

/** Rutas legacy sin `/app` → redirigen al árbol `/app/*` (sin auth; el guard de `/app` aplica después). */
export const legacyErpRedirectRoutes: RouteObject[] = [
  { path: '/home', element: <Navigate to="/app/home" replace /> },
  ...ERP_ROUTE_SEGMENTS.flatMap((segment) => [
    { path: `/${segment}`, element: <LegacyErpRedirect /> },
    { path: `/${segment}/*`, element: <LegacyErpRedirect /> },
  ]),
  { path: '/finalizartareo', element: <Navigate to="/app/autorizacion/finalizartareo" replace /> },
  { path: '/reportedestajo', element: <Navigate to="/app/reportes/reportedestajo" replace /> },
];
