import { RouteObject, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

const SuperAdminDashboard = lazy(() => import('./dashboard/pages/SuperAdminDashboard'));
const ClientManagementPage = lazy(() => import('./clientes/pages/ClientManagementPage'));
const ClientDetailPage = lazy(() => import('./clientes/pages/ClientDetailPage'));
const ModuleManagementPage = lazy(() => import('./modulos/pages/ModuleManagementPage'));
const SectionManagementPage = lazy(() => import('./modulos/pages/SectionManagementPage'));
const MenuManagementPageSuperAdmin = lazy(() => import('./modulos/pages/MenuManagementPageSuperAdmin'));
const RoleTemplateManagementPage = lazy(() => import('./modulos/pages/RoleTemplateManagementPage'));
const HierarchicalViewPage = lazy(() => import('./modulos/pages/HierarchicalViewPage'));
const PaisesPage = lazy(() => import('./catalogos/pages/PaisesPage'));
const DepartamentosPage = lazy(() => import('./catalogos/pages/DepartamentosPage'));
const ProvinciasPage = lazy(() => import('./catalogos/pages/ProvinciasPage'));
const DistritosPage = lazy(() => import('./catalogos/pages/DistritosPage'));
const MonedasPage = lazy(() => import('./catalogos/pages/MonedasPage'));

export const superAdminRoutes: RouteObject = {
  path: 'super-admin',
  children: [
    { index: true, element: <Navigate to="dashboard" replace /> },
    {
      path: 'dashboard',
      element: (
        <Suspense fallback={<LoadingSpinner message="Cargando dashboard..." />}>
          <SuperAdminDashboard />
        </Suspense>
      ),
    },
    {
      path: 'clientes',
      element: (
        <Suspense fallback={<LoadingSpinner message="Cargando gestión de clientes..." />}>
          <ClientManagementPage />
        </Suspense>
      ),
    },
    {
      path: 'clientes/:id',
      element: (
        <Suspense fallback={<LoadingSpinner message="Cargando detalle de cliente..." />}>
          <ClientDetailPage />
        </Suspense>
      ),
    },
    {
      path: 'modulos',
      element: (
        <Suspense fallback={<LoadingSpinner message="Cargando gestión de módulos..." />}>
          <ModuleManagementPage />
        </Suspense>
      ),
    },
    {
      path: 'secciones',
      element: (
        <Suspense fallback={<LoadingSpinner message="Cargando gestión de secciones..." />}>
          <SectionManagementPage />
        </Suspense>
      ),
    },
    {
      path: 'menus',
      element: (
        <Suspense fallback={<LoadingSpinner message="Cargando gestión de menús..." />}>
          <MenuManagementPageSuperAdmin />
        </Suspense>
      ),
    },
    {
      path: 'plantillas-roles',
      element: (
        <Suspense fallback={<LoadingSpinner message="Cargando gestión de plantillas..." />}>
          <RoleTemplateManagementPage />
        </Suspense>
      ),
    },
    {
      path: 'vista-jerarquica',
      element: (
        <Suspense fallback={<LoadingSpinner message="Cargando vista jerárquica..." />}>
          <HierarchicalViewPage />
        </Suspense>
      ),
    },
    {
      path: 'catalogos/paises',
      element: (
        <Suspense fallback={<LoadingSpinner message="Cargando Países..." />}>
          <PaisesPage />
        </Suspense>
      ),
    },
    {
      path: 'catalogos/departamentos',
      element: (
        <Suspense fallback={<LoadingSpinner message="Cargando Departamentos..." />}>
          <DepartamentosPage />
        </Suspense>
      ),
    },
    {
      path: 'catalogos/provincias',
      element: (
        <Suspense fallback={<LoadingSpinner message="Cargando Provincias..." />}>
          <ProvinciasPage />
        </Suspense>
      ),
    },
    {
      path: 'catalogos/distritos',
      element: (
        <Suspense fallback={<LoadingSpinner message="Cargando Distritos..." />}>
          <DistritosPage />
        </Suspense>
      ),
    },
    {
      path: 'catalogos/monedas',
      element: (
        <Suspense fallback={<LoadingSpinner message="Cargando Monedas..." />}>
          <MonedasPage />
        </Suspense>
      ),
    },
    { path: '*', element: <Navigate to="/super-admin/dashboard" replace /> },
  ],
};

