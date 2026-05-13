/**
 * Rutas del módulo INV_BILL (Facturación Electrónica).
 * Base path: /facturacion (definido en app router).
 * Rutas SPA según MENU_NAVEGACION.md y documentación backend.
 * Las rutas deben coincidir con las rutas en la BD: /facturacion/series, /facturacion/comprobantes, /facturacion/registro-ventas
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

const SeriesPage = lazy(() => import('./pages/SeriesPage'));
const ComprobantesPage = lazy(() => import('./pages/ComprobantesPage'));
const RegistroVentasPage = lazy(() => import('./pages/RegistroVentasPage'));

export default function InvBillRouter() {
  return (
    <Routes>
      <Route index element={<Navigate to="comprobantes" replace />} />
      <Route
        path="series"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Series..." />}>
            <SeriesPage />
          </Suspense>
        }
      />
      <Route
        path="comprobantes"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Comprobantes..." />}>
            <ComprobantesPage />
          </Suspense>
        }
      />
      <Route
        path="registro-ventas"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Registro de Ventas..." />}>
            <RegistroVentasPage />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="comprobantes" replace />} />
    </Routes>
  );
}
