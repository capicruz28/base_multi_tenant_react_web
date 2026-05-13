/**
 * Rutas del módulo QMS (Quality Management System).
 * Base path: /qms (definido en app router).
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

const ParametrosCalidadPage = lazy(() => import('./pages/ParametrosCalidadPage'));
const PlanesInspeccionPage = lazy(() => import('./pages/PlanesInspeccionPage'));
const InspeccionesPage = lazy(() => import('./pages/InspeccionesPage'));
const NoConformidadesPage = lazy(() => import('./pages/NoConformidadesPage'));

export default function QmsRouter() {
  return (
    <Routes>
      <Route index element={<Navigate to="parametros-calidad" replace />} />
      <Route
        path="parametros-calidad"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Parámetros de Calidad..." />}>
            <ParametrosCalidadPage />
          </Suspense>
        }
      />
      <Route
        path="planes-inspeccion"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Planes de Inspección..." />}>
            <PlanesInspeccionPage />
          </Suspense>
        }
      />
      <Route
        path="inspecciones"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Inspecciones..." />}>
            <InspeccionesPage />
          </Suspense>
        }
      />
      <Route
        path="no-conformidades"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando No Conformidades..." />}>
            <NoConformidadesPage />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="parametros-calidad" replace />} />
    </Routes>
  );
}
