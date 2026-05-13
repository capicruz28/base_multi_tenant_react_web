/**
 * Rutas del módulo BDG (Presupuestos).
 * Base path: /bdg (definido en app router).
 * Navegación en BD: /bdg/presupuestos, /bdg/ejecucion
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

const PresupuestosPage = lazy(() => import('./pages/PresupuestosPage'));
const EjecucionPage = lazy(() => import('./pages/EjecucionPage'));

export default function BdgRouter() {
  return (
    <Routes>
      <Route index element={<Navigate to="presupuestos" replace />} />
      <Route
        path="presupuestos"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Presupuestos..." />}>
            <PresupuestosPage />
          </Suspense>
        }
      />
      <Route
        path="ejecucion"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Ejecución Presupuestal..." />}>
            <EjecucionPage />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="presupuestos" replace />} />
    </Routes>
  );
}
