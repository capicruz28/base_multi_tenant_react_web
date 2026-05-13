/**
 * Rutas del módulo SVC (Órdenes de Servicio).
 * Base path: /svc (definido en app router).
 * Navegación en BD: /svc/ordenes-servicio, /svc/envio-talleres, /svc/stock-terceros
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

const OrdenesServicioPage = lazy(() => import('./pages/OrdenesServicioPage'));
const EnvioTalleresPage = lazy(() => import('./pages/EnvioTalleresPage'));
const StockTercerosPage = lazy(() => import('./pages/StockTercerosPage'));

export default function SvcRouter() {
  return (
    <Routes>
      <Route index element={<Navigate to="ordenes-servicio" replace />} />
      <Route
        path="ordenes-servicio"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Órdenes de Servicio..." />}>
            <OrdenesServicioPage />
          </Suspense>
        }
      />
      <Route
        path="envio-talleres"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Envío a Talleres..." />}>
            <EnvioTalleresPage />
          </Suspense>
        }
      />
      <Route
        path="stock-terceros"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Stock en Terceros..." />}>
            <StockTercerosPage />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="ordenes-servicio" replace />} />
    </Routes>
  );
}
