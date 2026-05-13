/**
 * Rutas del módulo ORG (Organización).
 * Base path: /org (definido en app router).
 * Rutas SPA según MENU_NAVEGACION.md y documentación backend.
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

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
          <Suspense fallback={<LoadingSpinner message="Cargando Mi Empresa..." />}>
            <EmpresaPage />
          </Suspense>
        }
      />
      <Route
        path="sucursales"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Sucursales..." />}>
            <SucursalesPage />
          </Suspense>
        }
      />
      <Route
        path="departamentos"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Departamentos..." />}>
            <DepartamentosPage />
          </Suspense>
        }
      />
      <Route
        path="cargos"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Cargos..." />}>
            <CargosPage />
          </Suspense>
        }
      />
      <Route
        path="centros-costo"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Centros de costo..." />}>
            <CentrosCostoPage />
          </Suspense>
        }
      />
      <Route
        path="parametros"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Parámetros..." />}>
            <ParametrosPage />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="empresa" replace />} />
    </Routes>
  );
}
