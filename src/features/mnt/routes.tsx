/**
 * Rutas del módulo MNT (Mantenimiento de Activos).
 * Base path: /mnt (definido en app router).
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

const ActivosPage = lazy(() => import('./pages/ActivosPage'));
const PlanesMantenimientoPage = lazy(() => import('./pages/PlanesMantenimientoPage'));
const OrdenesTrabajoPage = lazy(() => import('./pages/OrdenesTrabajoPage'));
const HistorialMantenimientoPage = lazy(() => import('./pages/HistorialMantenimientoPage'));

export default function MntRouter() {
  return (
    <Routes>
      <Route index element={<Navigate to="activos" replace />} />
      <Route
        path="activos"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Activos..." />}>
            <ActivosPage />
          </Suspense>
        }
      />
      <Route
        path="planes-mantenimiento"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Planes de Mantenimiento..." />}>
            <PlanesMantenimientoPage />
          </Suspense>
        }
      />
      <Route
        path="ordenes-trabajo"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Órdenes de Trabajo..." />}>
            <OrdenesTrabajoPage />
          </Suspense>
        }
      />
      <Route
        path="historial-mantenimiento"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Historial..." />}>
            <HistorialMantenimientoPage />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="activos" replace />} />
    </Routes>
  );
}
