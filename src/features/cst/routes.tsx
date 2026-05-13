/**
 * Rutas del módulo CST (Costeo de Productos).
 * Base path: /cst (definido en app router).
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

const TiposCentroCostoPage = lazy(() => import('./pages/TiposCentroCostoPage'));
const ProductoCostoPage = lazy(() => import('./pages/ProductoCostoPage'));
const AnalisisVariacionesPage = lazy(() => import('./pages/AnalisisVariacionesPage'));

export default function CstRouter() {
  return (
    <Routes>
      <Route index element={<Navigate to="tipos-cc" replace />} />
      <Route
        path="tipos-cc"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Tipos de Centro de Costo..." />}>
            <TiposCentroCostoPage />
          </Suspense>
        }
      />
      <Route
        path="costo-productos"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Costo de Productos..." />}>
            <ProductoCostoPage />
          </Suspense>
        }
      />
      <Route
        path="variaciones"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Análisis de Variaciones..." />}>
            <AnalisisVariacionesPage />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="tipos-cc" replace />} />
    </Routes>
  );
}
