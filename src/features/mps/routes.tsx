/**
 * Rutas del módulo MPS (Plan Maestro de Producción).
 * Base path: /mps (definido en app router).
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

const PronosticoDemandaPage = lazy(() => import('./pages/PronosticoDemandaPage'));
const PlanProduccionPage = lazy(() => import('./pages/PlanProduccionPage'));
const PlanProduccionDetallePage = lazy(() => import('./pages/PlanProduccionDetallePage'));

export default function MpsRouter() {
  return (
    <Routes>
      <Route index element={<Navigate to="plan-produccion" replace />} />
      <Route
        path="pronostico-demanda"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Pronóstico de Demanda..." />}>
            <PronosticoDemandaPage />
          </Suspense>
        }
      />
      <Route
        path="plan-produccion"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Plan de Producción..." />}>
            <PlanProduccionPage />
          </Suspense>
        }
      />
      <Route
        path="plan-produccion-detalle"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Detalle del Plan..." />}>
            <PlanProduccionDetallePage />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="plan-produccion" replace />} />
    </Routes>
  );
}
