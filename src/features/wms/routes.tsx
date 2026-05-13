/**
 * Rutas del módulo WMS (Warehouse Management System).
 * Base path: /wms (definido en app router).
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

const ZonasPage = lazy(() => import('./pages/ZonasPage'));
const UbicacionesPage = lazy(() => import('./pages/UbicacionesPage'));
const StockUbicacionPage = lazy(() => import('./pages/StockUbicacionPage'));
const TareasPage = lazy(() => import('./pages/TareasPage'));

export default function WmsRouter() {
  return (
    <Routes>
      <Route index element={<Navigate to="zonas" replace />} />
      <Route
        path="zonas"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Zonas..." />}>
            <ZonasPage />
          </Suspense>
        }
      />
      <Route
        path="ubicaciones"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Ubicaciones..." />}>
            <UbicacionesPage />
          </Suspense>
        }
      />
      <Route
        path="stock-ubicacion"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Stock por Ubicación..." />}>
            <StockUbicacionPage />
          </Suspense>
        }
      />
      <Route
        path="tareas"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Tareas..." />}>
            <TareasPage />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="zonas" replace />} />
    </Routes>
  );
}
