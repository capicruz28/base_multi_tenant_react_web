/**
 * Rutas del módulo PM (Gestión de Proyectos).
 * Base path: /pm (definido en app router).
 * Navegación en BD: /pm/proyectos, /pm/seguimiento
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

const ProyectosPage = lazy(() => import('./pages/ProyectosPage'));
const SeguimientoPage = lazy(() => import('./pages/SeguimientoPage'));

export default function PmRouter() {
  return (
    <Routes>
      <Route index element={<Navigate to="proyectos" replace />} />
      <Route
        path="proyectos"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Proyectos..." />}>
            <ProyectosPage />
          </Suspense>
        }
      />
      <Route
        path="seguimiento"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Seguimiento..." />}>
            <SeguimientoPage />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="proyectos" replace />} />
    </Routes>
  );
}
