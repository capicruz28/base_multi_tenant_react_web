/**
 * Rutas del módulo TAX (Libros Electrónicos / PLE SUNAT).
 * Base path: /tax (definido en app router).
 * Navegación en BD: /tax/ple
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

const PlePage = lazy(() => import('./pages/PlePage'));
const LibroElectronicoDetailPage = lazy(() => import('./pages/LibroElectronicoDetailPage'));

export default function TaxRouter() {
  return (
    <Routes>
      <Route index element={<Navigate to="ple" replace />} />
      <Route
        path="ple"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando PLE SUNAT..." />}>
            <PlePage />
          </Suspense>
        }
      />
      <Route
        path="ple/:libro_id"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando detalle..." />}>
            <LibroElectronicoDetailPage />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="ple" replace />} />
    </Routes>
  );
}
