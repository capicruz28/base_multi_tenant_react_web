/**
 * Rutas del módulo PUR (Compras).
 * Base path: /pur (definido en app router).
 * Rutas SPA según MENU_NAVEGACION.md y documentación backend.
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

const ProveedoresPage = lazy(() => import('./pages/ProveedoresPage'));
const ContactosPage = lazy(() => import('./pages/ContactosPage'));
const ProductosProveedorPage = lazy(() => import('./pages/ProductosProveedorPage'));
const SolicitudesPage = lazy(() => import('./pages/SolicitudesPage'));
const CotizacionesPage = lazy(() => import('./pages/CotizacionesPage'));
const OrdenesCompraPage = lazy(() => import('./pages/OrdenesCompraPage'));
const RecepcionesPage = lazy(() => import('./pages/RecepcionesPage'));

export default function PurRouter() {
  return (
    <Routes>
      <Route index element={<Navigate to="proveedores" replace />} />
      <Route
        path="proveedores"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Proveedores..." />}>
            <ProveedoresPage />
          </Suspense>
        }
      />
      <Route
        path="contactos"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Contactos..." />}>
            <ContactosPage />
          </Suspense>
        }
      />
      <Route
        path="productos-proveedor"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Productos por Proveedor..." />}>
            <ProductosProveedorPage />
          </Suspense>
        }
      />
      <Route
        path="solicitudes"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Solicitudes de Compra..." />}>
            <SolicitudesPage />
          </Suspense>
        }
      />
      <Route
        path="cotizaciones"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Cotizaciones..." />}>
            <CotizacionesPage />
          </Suspense>
        }
      />
      <Route
        path="ordenes-compra"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Órdenes de Compra..." />}>
            <OrdenesCompraPage />
          </Suspense>
        }
      />
      <Route
        path="recepciones"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Recepciones..." />}>
            <RecepcionesPage />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="proveedores" replace />} />
    </Routes>
  );
}
