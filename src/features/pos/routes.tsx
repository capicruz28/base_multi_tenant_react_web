/**
 * Rutas del módulo POS (Punto de Venta).
 * Base path: /pos (definido en app router).
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

const PuntosVentaPage = lazy(() => import('./pages/PuntosVentaPage'));
const TurnosCajaPage = lazy(() => import('./pages/TurnosCajaPage'));
const VentasPage = lazy(() => import('./pages/VentasPage'));

export default function PosRouter() {
  return (
    <Routes>
      <Route index element={<Navigate to="puntos-venta" replace />} />
      <Route
        path="puntos-venta"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Puntos de Venta..." />}>
            <PuntosVentaPage />
          </Suspense>
        }
      />
      <Route
        path="turnos-caja"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Turnos de Caja..." />}>
            <TurnosCajaPage />
          </Suspense>
        }
      />
      <Route
        path="ventas"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Ventas..." />}>
            <VentasPage />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="puntos-venta" replace />} />
    </Routes>
  );
}
