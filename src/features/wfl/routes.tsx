/**
 * Rutas del módulo WFL (Flujos de Trabajo).
 * Base path: /wfl (definido en app router).
 * Navegación en BD: /wfl/workflows, /wfl/seguimiento
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

const WorkflowsPage = lazy(() => import('./pages/WorkflowsPage'));
const SeguimientoPage = lazy(() => import('./pages/SeguimientoPage'));

export default function WflRouter() {
  return (
    <Routes>
      <Route index element={<Navigate to="workflows" replace />} />
      <Route
        path="workflows"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Flujos de Trabajo..." />}>
            <WorkflowsPage />
          </Suspense>
        }
      />
      <Route
        path="seguimiento"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Seguimiento..." />}>
            <SeguimientoPage />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="workflows" replace />} />
    </Routes>
  );
}
