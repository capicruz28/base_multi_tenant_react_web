import { RouteObject } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

const Home = lazy(() => import('./pages/Home'));

export const homeRoutes: RouteObject[] = [
  {
    path: 'home',
    element: (
      <Suspense fallback={<LoadingSpinner message="Cargando inicio..." />}>
        <Home />
      </Suspense>
    ),
  },
];

