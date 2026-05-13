/**
 * Rutas del módulo CRM (Customer Relationship Management).
 * Base path: /crm (definido en app router).
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

const CampanasPage = lazy(() => import('./pages/CampanasPage'));
const LeadsPage = lazy(() => import('./pages/LeadsPage'));
const OportunidadesPage = lazy(() => import('./pages/OportunidadesPage'));
const ActividadesPage = lazy(() => import('./pages/ActividadesPage'));

export default function CrmRouter() {
  return (
    <Routes>
      <Route index element={<Navigate to="campanas" replace />} />
      <Route
        path="campanas"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Campañas..." />}>
            <CampanasPage />
          </Suspense>
        }
      />
      <Route
        path="leads"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Leads..." />}>
            <LeadsPage />
          </Suspense>
        }
      />
      <Route
        path="oportunidades"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Oportunidades..." />}>
            <OportunidadesPage />
          </Suspense>
        }
      />
      <Route
        path="actividades"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Actividades..." />}>
            <ActividadesPage />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="campanas" replace />} />
    </Routes>
  );
}
