/**
 * Rutas del módulo SLS (Ventas).
 * Base path: /sls (definido en app router).
 * Rutas SPA según MENU_NAVEGACION.md y documentación backend.
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

const ClientesPage = lazy(() => import('./pages/ClientesPage'));
const ContactosPage = lazy(() => import('./pages/ContactosPage'));
const DireccionesPage = lazy(() => import('./pages/DireccionesPage'));
const CotizacionesPage = lazy(() => import('./pages/CotizacionesPage'));
const PedidosPage = lazy(() => import('./pages/PedidosPage'));

export default function SlsRouter() {
  return (
    <Routes>
      <Route index element={<Navigate to="clientes" replace />} />
      <Route
        path="clientes"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Clientes..." />}>
            <ClientesPage />
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
        path="direcciones"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Direcciones..." />}>
            <DireccionesPage />
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
        path="pedidos"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Pedidos..." />}>
            <PedidosPage />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="clientes" replace />} />
    </Routes>
  );
}
