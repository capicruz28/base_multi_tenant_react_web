/**
 * Rutas del módulo HCM (Planillas y RRHH).
 * Base path: /hcm (definido en app router).
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

const EmpleadosPage = lazy(() => import('./pages/EmpleadosPage'));
const ContratosPage = lazy(() => import('./pages/ContratosPage'));
const ConceptosPlanillaPage = lazy(() => import('./pages/ConceptosPlanillaPage'));
const PlanillasPage = lazy(() => import('./pages/PlanillasPage'));
const AsistenciaPage = lazy(() => import('./pages/AsistenciaPage'));
const VacacionesPage = lazy(() => import('./pages/VacacionesPage'));
const PrestamosPage = lazy(() => import('./pages/PrestamosPage'));

export default function HcmRouter() {
  return (
    <Routes>
      <Route index element={<Navigate to="empleados" replace />} />
      <Route
        path="empleados"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Empleados..." />}>
            <EmpleadosPage />
          </Suspense>
        }
      />
      <Route
        path="contratos"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Contratos..." />}>
            <ContratosPage />
          </Suspense>
        }
      />
      <Route
        path="conceptos-planilla"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Conceptos de Planilla..." />}>
            <ConceptosPlanillaPage />
          </Suspense>
        }
      />
      <Route
        path="planillas"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Planillas..." />}>
            <PlanillasPage />
          </Suspense>
        }
      />
      <Route
        path="asistencia"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Asistencia..." />}>
            <AsistenciaPage />
          </Suspense>
        }
      />
      <Route
        path="vacaciones"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Vacaciones..." />}>
            <VacacionesPage />
          </Suspense>
        }
      />
      <Route
        path="prestamos"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Préstamos..." />}>
            <PrestamosPage />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="empleados" replace />} />
    </Routes>
  );
}
