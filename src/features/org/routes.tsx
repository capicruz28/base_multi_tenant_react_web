/**
 * Rutas del módulo ORG (Organización).
 * Base path: /org (definido en app router).
 * Rutas SPA según MENU_NAVEGACION.md y documentación backend.
 */
import './codigo/register-org-codigo-manifest';
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '@/shared/components/LoadingSpinner';
import { OrgTenantRouteGuard } from './components/guards/OrgTenantRouteGuard';
import { OrgCompanyRouteGuard } from './components/guards/OrgCompanyRouteGuard';

const EmpresaPage = lazy(() => import('./pages/EmpresaPage'));
const SucursalesPage = lazy(() => import('./pages/SucursalesPage'));
const DepartamentosPage = lazy(() => import('./pages/DepartamentosPage'));
const CargosPage = lazy(() => import('./pages/CargosPage'));
const CentrosCostoPage = lazy(() => import('./pages/CentrosCostoPage'));
const ParametrosPage = lazy(() => import('./pages/ParametrosPage'));

export default function OrgRouter() {
  return (
    <Routes>
      <Route index element={<Navigate to="empresa" replace />} />
      <Route
        path="empresa"
        element={
          <OrgTenantRouteGuard>
            <Suspense fallback={<LoadingSpinner message="Cargando Mi Empresa..." />}>
              <EmpresaPage />
            </Suspense>
          </OrgTenantRouteGuard>
        }
      />
      <Route
        path="sucursales"
        element={
          <OrgCompanyRouteGuard>
            <Suspense fallback={<LoadingSpinner message="Cargando Sucursales..." />}>
              <SucursalesPage />
            </Suspense>
          </OrgCompanyRouteGuard>
        }
      />
      <Route
        path="departamentos"
        element={
          <OrgCompanyRouteGuard>
            <Suspense fallback={<LoadingSpinner message="Cargando Departamentos..." />}>
              <DepartamentosPage />
            </Suspense>
          </OrgCompanyRouteGuard>
        }
      />
      <Route
        path="cargos"
        element={
          <OrgCompanyRouteGuard>
            <Suspense fallback={<LoadingSpinner message="Cargando Cargos..." />}>
              <CargosPage />
            </Suspense>
          </OrgCompanyRouteGuard>
        }
      />
      <Route
        path="centros-costo"
        element={
          <OrgCompanyRouteGuard>
            <Suspense fallback={<LoadingSpinner message="Cargando Centros de costo..." />}>
              <CentrosCostoPage />
            </Suspense>
          </OrgCompanyRouteGuard>
        }
      />
      <Route
        path="parametros"
        element={
          <OrgCompanyRouteGuard scope="hybrid">
            <Suspense fallback={<LoadingSpinner message="Cargando Parámetros..." />}>
              <ParametrosPage />
            </Suspense>
          </OrgCompanyRouteGuard>
        }
      />
      <Route path="*" element={<Navigate to="empresa" replace />} />
    </Routes>
  );
}
