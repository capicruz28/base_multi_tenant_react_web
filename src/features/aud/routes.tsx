/**
 * Rutas del módulo AUD (Auditoría y Trazabilidad).
 * Base path: /aud (definido en app router).
 * Navegación en BD: /aud/log, /aud/trazabilidad
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

const LogPage = lazy(() => import('./pages/LogPage'));
const TrazabilidadPage = lazy(() => import('./pages/TrazabilidadPage'));

export default function AudRouter() {
  return (
    <Routes>
      <Route index element={<Navigate to="log" replace />} />
      <Route
        path="log"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Log..." />}>
            <LogPage />
          </Suspense>
        }
      />
      <Route
        path="trazabilidad"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Trazabilidad..." />}>
            <TrazabilidadPage />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="log" replace />} />
    </Routes>
  );
}
