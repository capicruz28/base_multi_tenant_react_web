/**
 * Rutas del módulo MRP (Planeamiento de Materiales).
 * Base path: /mrp (definido en app router).
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

const PlanMaestroPage = lazy(() => import('./pages/PlanMaestroPage'));
const NecesidadesBrutasPage = lazy(() => import('./pages/NecesidadesBrutasPage'));
const ExplosionMaterialesPage = lazy(() => import('./pages/ExplosionMaterialesPage'));
const OrdenesSugeridasPage = lazy(() => import('./pages/OrdenesSugeridasPage'));

export default function MrpRouter() {
  return (
    <Routes>
      <Route index element={<Navigate to="plan-maestro" replace />} />
      <Route
        path="plan-maestro"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Plan Maestro..." />}>
            <PlanMaestroPage />
          </Suspense>
        }
      />
      <Route
        path="necesidades-brutas"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Necesidades Brutas..." />}>
            <NecesidadesBrutasPage />
          </Suspense>
        }
      />
      <Route
        path="explosion-materiales"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Explosión de Materiales..." />}>
            <ExplosionMaterialesPage />
          </Suspense>
        }
      />
      <Route
        path="ordenes-sugeridas"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Órdenes Sugeridas..." />}>
            <OrdenesSugeridasPage />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="plan-maestro" replace />} />
    </Routes>
  );
}
