/**
 * Rutas del módulo FIN (Finanzas y Contabilidad).
 * Base path: /fin (definido en app router).
 * Rutas SPA según MENU_NAVEGACION.md y documentación backend.
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

const PlanCuentasPage = lazy(() => import('./pages/PlanCuentasPage'));
const PeriodosPage = lazy(() => import('./pages/PeriodosPage'));
const AsientosPage = lazy(() => import('./pages/AsientosPage'));
const AsientoDetallePage = lazy(() => import('./pages/AsientoDetallePage'));

export default function FinRouter() {
  return (
    <Routes>
      <Route index element={<Navigate to="plan-cuentas" replace />} />
      <Route
        path="plan-cuentas"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Plan de Cuentas..." />}>
            <PlanCuentasPage />
          </Suspense>
        }
      />
      <Route
        path="periodos"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Periodos..." />}>
            <PeriodosPage />
          </Suspense>
        }
      />
      <Route
        path="asientos"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Asientos..." />}>
            <AsientosPage />
          </Suspense>
        }
      />
      <Route
        path="asientos/:id/detalles"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Detalles..." />}>
            <AsientoDetallePage />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="plan-cuentas" replace />} />
    </Routes>
  );
}
