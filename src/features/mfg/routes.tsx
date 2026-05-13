/**
 * Rutas del módulo MFG (Manufactura y Producción).
 * Base path: /mfg (definido en app router).
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

const CentrosTrabajoPage = lazy(() => import('./pages/CentrosTrabajoPage'));
const OperacionesPage = lazy(() => import('./pages/OperacionesPage'));
const ListasMaterialesPage = lazy(() => import('./pages/ListasMaterialesPage'));
const RutasFabricacionPage = lazy(() => import('./pages/RutasFabricacionPage'));
const OrdenesProduccionPage = lazy(() => import('./pages/OrdenesProduccionPage'));
const ConsumoMaterialesPage = lazy(() => import('./pages/ConsumoMaterialesPage'));
const OperacionesOPPage = lazy(() => import('./pages/OperacionesOPPage'));

export default function MfgRouter() {
  return (
    <Routes>
      <Route index element={<Navigate to="centros-trabajo" replace />} />
      <Route
        path="centros-trabajo"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Centros de Trabajo..." />}>
            <CentrosTrabajoPage />
          </Suspense>
        }
      />
      <Route
        path="operaciones"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Operaciones..." />}>
            <OperacionesPage />
          </Suspense>
        }
      />
      <Route
        path="listas-materiales"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Listas de Materiales..." />}>
            <ListasMaterialesPage />
          </Suspense>
        }
      />
      <Route
        path="rutas-fabricacion"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Rutas de Fabricación..." />}>
            <RutasFabricacionPage />
          </Suspense>
        }
      />
      <Route
        path="ordenes-produccion"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Órdenes de Producción..." />}>
            <OrdenesProduccionPage />
          </Suspense>
        }
      />
      <Route
        path="consumo-materiales"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Consumo de Materiales..." />}>
            <ConsumoMaterialesPage />
          </Suspense>
        }
      />
      <Route
        path="operaciones-op"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Operaciones de OP..." />}>
            <OperacionesOPPage />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="centros-trabajo" replace />} />
    </Routes>
  );
}
