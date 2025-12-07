/**
 * Rutas del módulo de Autorización
 * 
 * Este módulo maneja:
 * - Autorización de horas
 * - Finalización de tareo
 * 
 * Exportación default para lazy loading del módulo completo
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

// Lazy loading de páginas del módulo
const AutorizacionPage = lazy(() => import('./pages/AutorizacionPage'));
const FinalizarTareoPage = lazy(() => import('./pages/FinalizarTareoPage'));

/**
 * Router del módulo de Autorización
 * Se usa con lazy loading en el router principal
 */
export default function AutorizacionRouter() {
  return (
    <Routes>
      <Route
        path=""
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando autorización..." />}>
            <AutorizacionPage />
          </Suspense>
        }
      />
      <Route
        path="finalizartareo"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando finalizar tareo..." />}>
            <FinalizarTareoPage />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="" replace />} />
    </Routes>
  );
}

/**
 * Exportación nombrada para compatibilidad (deprecated)
 * @deprecated Usar export default y lazy loading en router principal
 */
export const autorizacionRoutes = [
  {
    path: 'autorizacion',
    element: (
      <Suspense fallback={<LoadingSpinner message="Cargando autorización..." />}>
        <AutorizacionPage />
      </Suspense>
    ),
  },
  {
    path: 'finalizartareo',
    element: (
      <Suspense fallback={<LoadingSpinner message="Cargando finalizar tareo..." />}>
        <FinalizarTareoPage />
      </Suspense>
    ),
  },
];

