/**
 * Rutas del módulo CFG (Administrador de secuencias de código).
 * Base path: /app/cfg (definido en app-route-tree).
 */

import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

const SecuenciasPage = lazy(() => import('./pages/SecuenciasPage'));

export default function CfgRouter() {
  return (
    <Routes>
      <Route index element={<Navigate to="secuencias" replace />} />
      <Route
        path="secuencias"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Secuencias de código..." />}>
            <SecuenciasPage />
          </Suspense>
        }
      />
    </Routes>
  );
}
