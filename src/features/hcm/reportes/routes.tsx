/**
 * Rutas del módulo de Reportes HCM
 * 
 * Este módulo maneja reportes relacionados con Human Capital Management:
 * - Reportes de autorización
 * - Reportes de asistencia
 * - Reportes de planillas (futuro)
 * 
 * Exportación default para lazy loading del módulo completo
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

// Lazy loading de páginas del módulo
const ReporteAutorizacionPage = lazy(() => import('./pages/ReporteAutorizacionPage'));

/**
 * Router del módulo de Reportes HCM
 * Se usa con lazy loading en el router principal
 */
export default function ReportesHCMRouter() {
  return (
    <Routes>
      <Route
        path="reportedestajo"
        element={
          <Suspense fallback={<LoadingSpinner message="Cargando reporte..." />}>
            <ReporteAutorizacionPage />
          </Suspense>
        }
      />
      <Route path="" element={<Navigate to="reportedestajo" replace />} />
      <Route path="*" element={<Navigate to="reportedestajo" replace />} />
    </Routes>
  );
}

/**
 * Exportación nombrada para compatibilidad (deprecated)
 * @deprecated Usar export default y lazy loading en router principal
 */
export const reportesRoutes = [
  {
    path: 'reportedestajo',
    element: (
      <Suspense fallback={<LoadingSpinner message="Cargando reporte..." />}>
        <ReporteAutorizacionPage />
      </Suspense>
    ),
  },
];

