/**
 * Rutas del módulo LOG (Logística y Distribución).
 * Base path: /log (definido en app router).
 * Rutas SPA según MENU_NAVEGACION.md y documentación backend.
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

const TransportistasPage = lazy(() => import('./pages/TransportistasPage'));
const VehiculosPage = lazy(() => import('./pages/VehiculosPage'));
const RutasPage = lazy(() => import('./pages/RutasPage'));
const GuiasRemisionPage = lazy(() => import('./pages/GuiasRemisionPage'));
const GuiaRemisionDetallePage = lazy(() => import('./pages/GuiaRemisionDetallePage'));
const DespachosPage = lazy(() => import('./pages/DespachosPage'));
const DespachoGuiaPage = lazy(() => import('./pages/DespachoGuiaPage'));

export default function LogRouter() {
  return (
    <Routes>
      <Route index element={<Navigate to="transportistas" replace />} />
      <Route
        path="transportistas"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Transportistas..." />}>
            <TransportistasPage />
          </Suspense>
        }
      />
      <Route
        path="vehiculos"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Vehículos..." />}>
            <VehiculosPage />
          </Suspense>
        }
      />
      <Route
        path="rutas"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Rutas..." />}>
            <RutasPage />
          </Suspense>
        }
      />
      <Route
        path="guias-remision"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Guías de Remisión..." />}>
            <GuiasRemisionPage />
          </Suspense>
        }
      />
      <Route
        path="guias-remision/:id/detalles"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Detalles..." />}>
            <GuiaRemisionDetallePage />
          </Suspense>
        }
      />
      <Route
        path="despachos"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Despachos..." />}>
            <DespachosPage />
          </Suspense>
        }
      />
      <Route
        path="despachos/:id/guias"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Guías del Despacho..." />}>
            <DespachoGuiaPage />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="transportistas" replace />} />
    </Routes>
  );
}
