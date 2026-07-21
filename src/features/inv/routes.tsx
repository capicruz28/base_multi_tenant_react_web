/**
 * Rutas del módulo INV (Inventarios).
 * Base path: /inv (definido en app router).
 * Rutas SPA según MENU_NAVEGACION.md y documentación backend.
 */
import './codigo/register-inv-codigo-manifest';
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, type ComponentType } from 'react';
import LoadingSpinner from '@/shared/components/LoadingSpinner';
import { InvCompanyRouteGuard } from './components/guards/InvCompanyRouteGuard';

const CategoriasPage = lazy(() => import('./pages/CategoriasPage'));
const UnidadesMedidaPage = lazy(() => import('./pages/UnidadesMedidaPage'));
const ProductosPage = lazy(() => import('./pages/ProductosPage'));
const AlmacenesPage = lazy(() => import('./pages/AlmacenesPage'));
const StockPage = lazy(() => import('./pages/StockPage'));
const TiposMovimientoPage = lazy(() => import('./pages/TiposMovimientoPage'));
const MovimientosPage = lazy(() => import('./pages/MovimientosPage'));
const MovimientoFormPage = lazy(() => import('./pages/MovimientoFormPage'));
const InventarioFisicoPage = lazy(() => import('./pages/InventarioFisicoPage'));
const InventarioFisicoFormPage = lazy(() => import('./pages/InventarioFisicoFormPage'));
const KardexPage = lazy(() => import('./pages/KardexPage'));

function invSuspense(message: string, Page: ComponentType) {
  return (
    <Suspense fallback={<LoadingSpinner message={message} />}>
      <Page />
    </Suspense>
  );
}

export default function InvRouter() {
  return (
    <InvCompanyRouteGuard>
      <Routes>
        <Route index element={<Navigate to="productos" replace />} />
        <Route path="categorias" element={invSuspense('Cargando Categorías...', CategoriasPage)} />
        <Route path="unidades-medida" element={invSuspense('Cargando Unidades de Medida...', UnidadesMedidaPage)} />
        <Route path="productos" element={invSuspense('Cargando Productos...', ProductosPage)} />
        <Route path="almacenes" element={invSuspense('Cargando Almacenes...', AlmacenesPage)} />
        <Route path="stock" element={invSuspense('Cargando Stock...', StockPage)} />
        <Route path="tipos-movimiento" element={invSuspense('Cargando Tipos de Movimiento...', TiposMovimientoPage)} />
        <Route path="movimientos" element={invSuspense('Cargando Movimientos...', MovimientosPage)} />
        <Route path="movimientos/nuevo" element={invSuspense('Cargando formulario...', MovimientoFormPage)} />
        <Route
          path="movimientos/:movimientoId/editar"
          element={invSuspense('Cargando formulario...', MovimientoFormPage)}
        />
        <Route path="inventario-fisico" element={invSuspense('Cargando Inventario Físico...', InventarioFisicoPage)} />
        <Route
          path="inventario-fisico/nuevo"
          element={invSuspense('Cargando formulario...', InventarioFisicoFormPage)}
        />
        <Route
          path="inventario-fisico/:inventarioFisicoId/editar"
          element={invSuspense('Cargando formulario...', InventarioFisicoFormPage)}
        />
        <Route path="kardex" element={invSuspense('Cargando Kardex de Inventario...', KardexPage)} />
        <Route path="*" element={<Navigate to="productos" replace />} />
      </Routes>
    </InvCompanyRouteGuard>
  );
}
