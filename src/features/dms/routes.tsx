/**
 * Rutas del módulo DMS (Gestión Documental).
 * Base path: /dms (definido en app router).
 * Navegación en BD: /dms/documentos, /dms/busqueda
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

const DocumentosPage = lazy(() => import('./pages/DocumentosPage'));
const BusquedaPage = lazy(() => import('./pages/BusquedaPage'));

export default function DmsRouter() {
  return (
    <Routes>
      <Route index element={<Navigate to="documentos" replace />} />
      <Route
        path="documentos"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Documentos..." />}>
            <DocumentosPage />
          </Suspense>
        }
      />
      <Route
        path="busqueda"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Búsqueda..." />}>
            <BusquedaPage />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="documentos" replace />} />
    </Routes>
  );
}
