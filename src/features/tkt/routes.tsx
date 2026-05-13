/**
 * Rutas del módulo TKT (Mesa de Ayuda / Ticketing).
 * Base path: /tkt (definido en app router).
 * Navegación en BD: /tkt/tickets
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

const TicketsPage = lazy(() => import('./pages/TicketsPage'));

export default function TktRouter() {
  return (
    <Routes>
      <Route index element={<Navigate to="tickets" replace />} />
      <Route
        path="tickets"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando Tickets..." />}>
            <TicketsPage />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="tickets" replace />} />
    </Routes>
  );
}
