import type { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import SeleccionarEmpresaPage from '@/features/auth/pages/SeleccionarEmpresaPage';
import OnboardingEmpresaPage from '@/features/auth/pages/OnboardingEmpresaPage';
import { lazy, Suspense } from 'react';
import { PermissionGuard } from '@/app/router/guards/PermissionGuard';
import LoadingSpinner from '@/shared/components/LoadingSpinner';
import { homeRoutes } from '@/features/home/routes';

const AutorizacionRouter = lazy(() => import('@/features/hcm/asistencia/autorizacion/routes'));
const ReportesHCMRouter = lazy(() => import('@/features/hcm/reportes/routes'));
const OrgRouter = lazy(() => import('@/features/org/routes'));
const InvRouter = lazy(() => import('@/features/inv/routes'));
const PurRouter = lazy(() => import('@/features/pur/routes'));
const SlsRouter = lazy(() => import('@/features/sls/routes'));
const InvBillRouter = lazy(() => import('@/features/inv-bill/routes'));
const PrcRouter = lazy(() => import('@/features/prc/routes'));
const FinRouter = lazy(() => import('@/features/fin/routes'));
const LogRouter = lazy(() => import('@/features/log/routes'));
const WmsRouter = lazy(() => import('@/features/wms/routes'));
const QmsRouter = lazy(() => import('@/features/qms/routes'));
const CrmRouter = lazy(() => import('@/features/crm/routes'));
const PosRouter = lazy(() => import('@/features/pos/routes'));
const HcmRouter = lazy(() => import('@/features/hcm/routes'));
const MfgRouter = lazy(() => import('@/features/mfg/routes'));
const MrpRouter = lazy(() => import('@/features/mrp/routes'));
const MpsRouter = lazy(() => import('@/features/mps/routes'));
const MntRouter = lazy(() => import('@/features/mnt/routes'));
const CstRouter = lazy(() => import('@/features/cst/routes'));
const TaxRouter = lazy(() => import('@/features/tax/routes'));
const BdgRouter = lazy(() => import('@/features/bdg/routes'));
const PmRouter = lazy(() => import('@/features/pm/routes'));
const SvcRouter = lazy(() => import('@/features/svc/routes'));
const TktRouter = lazy(() => import('@/features/tkt/routes'));
const DmsRouter = lazy(() => import('@/features/dms/routes'));
const WflRouter = lazy(() => import('@/features/wfl/routes'));
const BiRouter = lazy(() => import('@/features/bi/routes'));
const AudRouter = lazy(() => import('@/features/aud/routes'));

/** Rutas hijas del panel ERP bajo `/app` (layout aplicado en router.tsx). */
export const appRouteChildren: RouteObject[] = [
  { index: true, element: <Navigate to="/app/home" replace /> },
  { path: 'seleccionar-empresa', element: <SeleccionarEmpresaPage /> },
  { path: 'onboarding', element: <OnboardingEmpresaPage /> },
  ...homeRoutes,
  {
    path: 'autorizacion/*',
    element: (
      <PermissionGuard module="autorizacion" action="ver">
        <Suspense fallback={<LoadingSpinner message="Cargando módulo de autorización..." />}>
          <AutorizacionRouter />
        </Suspense>
      </PermissionGuard>
    ),
  },
  {
    path: 'reportes/*',
    element: (
      <PermissionGuard module="reportes" action="ver">
        <Suspense fallback={<LoadingSpinner message="Cargando módulo de reportes..." />}>
          <ReportesHCMRouter />
        </Suspense>
      </PermissionGuard>
    ),
  },
  {
    path: 'org/*',
    element: (
      <PermissionGuard module="org" action="ver">
        <Suspense fallback={<LoadingSpinner message="Cargando módulo Organización..." />}>
          <OrgRouter />
        </Suspense>
      </PermissionGuard>
    ),
  },
  {
    path: 'inv/*',
    element: (
      <PermissionGuard module="inv" action="ver">
        <Suspense fallback={<LoadingSpinner message="Cargando módulo Inventarios..." />}>
          <InvRouter />
        </Suspense>
      </PermissionGuard>
    ),
  },
  {
    path: 'pur/*',
    element: (
      <PermissionGuard module="pur" action="ver">
        <Suspense fallback={<LoadingSpinner message="Cargando módulo Compras..." />}>
          <PurRouter />
        </Suspense>
      </PermissionGuard>
    ),
  },
  {
    path: 'sls/*',
    element: (
      <PermissionGuard module="sls" action="ver">
        <Suspense fallback={<LoadingSpinner message="Cargando módulo Ventas..." />}>
          <SlsRouter />
        </Suspense>
      </PermissionGuard>
    ),
  },
  {
    path: 'facturacion/*',
    element: (
      <PermissionGuard module="inv-bill" action="ver">
        <Suspense fallback={<LoadingSpinner message="Cargando módulo Facturación..." />}>
          <InvBillRouter />
        </Suspense>
      </PermissionGuard>
    ),
  },
  {
    path: 'prc/*',
    element: (
      <PermissionGuard module="prc" action="ver">
        <Suspense fallback={<LoadingSpinner message="Cargando módulo Precios y Promociones..." />}>
          <PrcRouter />
        </Suspense>
      </PermissionGuard>
    ),
  },
  {
    path: 'log/*',
    element: (
      <PermissionGuard module="log" action="ver">
        <Suspense fallback={<LoadingSpinner message="Cargando módulo Logística..." />}>
          <LogRouter />
        </Suspense>
      </PermissionGuard>
    ),
  },
  {
    path: 'fin/*',
    element: (
      <PermissionGuard module="fin" action="ver">
        <Suspense fallback={<LoadingSpinner message="Cargando módulo Finanzas..." />}>
          <FinRouter />
        </Suspense>
      </PermissionGuard>
    ),
  },
  {
    path: 'wms/*',
    element: (
      <PermissionGuard module="wms" action="ver">
        <Suspense fallback={<LoadingSpinner message="Cargando módulo WMS..." />}>
          <WmsRouter />
        </Suspense>
      </PermissionGuard>
    ),
  },
  {
    path: 'qms/*',
    element: (
      <PermissionGuard module="qms" action="ver">
        <Suspense fallback={<LoadingSpinner message="Cargando módulo QMS..." />}>
          <QmsRouter />
        </Suspense>
      </PermissionGuard>
    ),
  },
  {
    path: 'crm/*',
    element: (
      <PermissionGuard module="crm" action="ver">
        <Suspense fallback={<LoadingSpinner message="Cargando módulo CRM..." />}>
          <CrmRouter />
        </Suspense>
      </PermissionGuard>
    ),
  },
  {
    path: 'pos/*',
    element: (
      <PermissionGuard module="pos" action="ver">
        <Suspense fallback={<LoadingSpinner message="Cargando módulo POS..." />}>
          <PosRouter />
        </Suspense>
      </PermissionGuard>
    ),
  },
  {
    path: 'hcm/*',
    element: (
      <PermissionGuard module="hcm" action="ver">
        <Suspense fallback={<LoadingSpinner message="Cargando módulo HCM..." />}>
          <HcmRouter />
        </Suspense>
      </PermissionGuard>
    ),
  },
  {
    path: 'mfg/*',
    element: (
      <PermissionGuard module="mfg" action="ver">
        <Suspense fallback={<LoadingSpinner message="Cargando módulo MFG..." />}>
          <MfgRouter />
        </Suspense>
      </PermissionGuard>
    ),
  },
  {
    path: 'mrp/*',
    element: (
      <PermissionGuard module="mrp" action="ver">
        <Suspense fallback={<LoadingSpinner message="Cargando módulo MRP..." />}>
          <MrpRouter />
        </Suspense>
      </PermissionGuard>
    ),
  },
  {
    path: 'mps/*',
    element: (
      <PermissionGuard module="mps" action="ver">
        <Suspense fallback={<LoadingSpinner message="Cargando módulo MPS..." />}>
          <MpsRouter />
        </Suspense>
      </PermissionGuard>
    ),
  },
  {
    path: 'mnt/*',
    element: (
      <PermissionGuard module="mnt" action="ver">
        <Suspense fallback={<LoadingSpinner message="Cargando módulo Mantenimiento..." />}>
          <MntRouter />
        </Suspense>
      </PermissionGuard>
    ),
  },
  {
    path: 'cst/*',
    element: (
      <PermissionGuard module="cst" action="ver">
        <Suspense fallback={<LoadingSpinner message="Cargando módulo Costeo..." />}>
          <CstRouter />
        </Suspense>
      </PermissionGuard>
    ),
  },
  {
    path: 'tax/*',
    element: (
      <PermissionGuard module="tax" action="ver">
        <Suspense fallback={<LoadingSpinner message="Cargando módulo Libros Electrónicos..." />}>
          <TaxRouter />
        </Suspense>
      </PermissionGuard>
    ),
  },
  {
    path: 'bdg/*',
    element: (
      <PermissionGuard module="bdg" action="ver">
        <Suspense fallback={<LoadingSpinner message="Cargando módulo Presupuestos..." />}>
          <BdgRouter />
        </Suspense>
      </PermissionGuard>
    ),
  },
  {
    path: 'pm/*',
    element: (
      <PermissionGuard module="pm" action="ver">
        <Suspense fallback={<LoadingSpinner message="Cargando módulo Proyectos..." />}>
          <PmRouter />
        </Suspense>
      </PermissionGuard>
    ),
  },
  {
    path: 'svc/*',
    element: (
      <PermissionGuard module="svc" action="ver">
        <Suspense fallback={<LoadingSpinner message="Cargando módulo Órdenes de Servicio..." />}>
          <SvcRouter />
        </Suspense>
      </PermissionGuard>
    ),
  },
  {
    path: 'tkt/*',
    element: (
      <PermissionGuard module="tkt" action="ver">
        <Suspense fallback={<LoadingSpinner message="Cargando módulo Mesa de Ayuda..." />}>
          <TktRouter />
        </Suspense>
      </PermissionGuard>
    ),
  },
  {
    path: 'dms/*',
    element: (
      <PermissionGuard module="dms" action="ver">
        <Suspense fallback={<LoadingSpinner message="Cargando módulo DMS..." />}>
          <DmsRouter />
        </Suspense>
      </PermissionGuard>
    ),
  },
  {
    path: 'wfl/*',
    element: (
      <PermissionGuard module="wfl" action="ver">
        <Suspense fallback={<LoadingSpinner message="Cargando módulo WFL..." />}>
          <WflRouter />
        </Suspense>
      </PermissionGuard>
    ),
  },
  {
    path: 'bi/*',
    element: (
      <PermissionGuard module="bi" action="ver">
        <Suspense fallback={<LoadingSpinner message="Cargando módulo BI..." />}>
          <BiRouter />
        </Suspense>
      </PermissionGuard>
    ),
  },
  {
    path: 'aud/*',
    element: (
      <PermissionGuard module="aud" action="ver">
        <Suspense fallback={<LoadingSpinner message="Cargando módulo AUD..." />}>
          <AudRouter />
        </Suspense>
      </PermissionGuard>
    ),
  },
  { path: '*', element: <Navigate to="/app/home" replace /> },
];
