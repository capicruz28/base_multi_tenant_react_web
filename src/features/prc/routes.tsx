/**
 * Rutas del módulo PRC (Precios y Promociones).
 * Base path: /prc (definido en app router).
 * Rutas SPA según MENU_NAVEGACION.md y documentación backend.
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

const ListasPrecioPage = lazy(() => import('./pages/ListasPrecioPage'));
const ListaPrecioDetallePage = lazy(() => import('./pages/ListaPrecioDetallePage'));
const PromocionesPage = lazy(() => import('./pages/PromocionesPage'));

export default function PrcRouter() {
  return (
    <Routes>
      <Route index element={<Navigate to="listas-precio" replace />} />
      <Route
        path="listas-precio"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Listas de Precio..." />}>
            <ListasPrecioPage />
          </Suspense>
        }
      />
      <Route
        path="listas-precio/:id/detalles"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Detalles..." />}>
            <ListaPrecioDetallePage />
          </Suspense>
        }
      />
      <Route
        path="promociones"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Promociones..." />}>
            <PromocionesPage />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="listas-precio" replace />} />
    </Routes>
  );
}
