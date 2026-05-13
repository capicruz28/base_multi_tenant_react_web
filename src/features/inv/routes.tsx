/**
 * Rutas del módulo INV (Inventarios).
 * Base path: /inv (definido en app router).
 * Rutas SPA según MENU_NAVEGACION.md y documentación backend.
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

const CategoriasPage = lazy(() => import('./pages/CategoriasPage'));
const UnidadesMedidaPage = lazy(() => import('./pages/UnidadesMedidaPage'));
const ProductosPage = lazy(() => import('./pages/ProductosPage'));
const AlmacenesPage = lazy(() => import('./pages/AlmacenesPage'));
const StockPage = lazy(() => import('./pages/StockPage'));
const TiposMovimientoPage = lazy(() => import('./pages/TiposMovimientoPage'));
const MovimientosPage = lazy(() => import('./pages/MovimientosPage'));
const InventarioFisicoPage = lazy(() => import('./pages/InventarioFisicoPage'));
const KardexPage = lazy(() => import('./pages/KardexPage'));

export default function InvRouter() {
  return (
    <Routes>
      <Route index element={<Navigate to="productos" replace />} />
      <Route
        path="categorias"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Categorías..." />}>
            <CategoriasPage />
          </Suspense>
        }
      />
      <Route
        path="unidades-medida"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Unidades de Medida..." />}>
            <UnidadesMedidaPage />
          </Suspense>
        }
      />
      <Route
        path="productos"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Productos..." />}>
            <ProductosPage />
          </Suspense>
        }
      />
      <Route
        path="almacenes"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Almacenes..." />}>
            <AlmacenesPage />
          </Suspense>
        }
      />
      <Route
        path="stock"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Stock..." />}>
            <StockPage />
          </Suspense>
        }
      />
      <Route
        path="tipos-movimiento"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Tipos de Movimiento..." />}>
            <TiposMovimientoPage />
          </Suspense>
        }
      />
      <Route
        path="movimientos"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Movimientos..." />}>
            <MovimientosPage />
          </Suspense>
        }
      />
      <Route
        path="inventario-fisico"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Inventario Físico..." />}>
            <InventarioFisicoPage />
          </Suspense>
        }
      />
      <Route
        path="kardex"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Kardex de Inventario..." />}>
            <KardexPage />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="productos" replace />} />
    </Routes>
  );
}
