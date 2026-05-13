import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ProtectedRoute from '@/shared/components/ProtectedRoute';
import { PermissionGuard } from '@/app/router/guards/PermissionGuard';
import NewLayout from '@/shared/components/layout/NewLayout';
import SmartRedirect from '@/shared/components/SmartRedirect';
import LoadingSpinner from '@/shared/components/LoadingSpinner';
import UnauthorizedPage from '@/pages/UnauthorizedPage';

// ✅ FASE 4: Lazy loading de módulos completos
// Rutas públicas (no lazy, se cargan siempre)
import { authRoutes } from '@/features/auth/routes';

// Rutas de administración (no lazy, se usan frecuentemente)
import { adminRoutes } from '@/features/admin/routes';
import { superAdminRoutes } from '@/features/super-admin/routes';
import { homeRoutes } from '@/features/home/routes';

// ✅ FASE 4: Módulos de negocio con lazy loading completo
const AutorizacionRouter = lazy(() => import('@/features/hcm/asistencia/autorizacion/routes'));
const ReportesHCMRouter = lazy(() => import('@/features/hcm/reportes/routes'));

// ✅ Módulo ORG (Organización) — ERP
const OrgRouter = lazy(() => import('@/features/org/routes'));

// ✅ Módulo INV (Inventarios) — ERP
const InvRouter = lazy(() => import('@/features/inv/routes'));

// ✅ Módulo PUR (Compras) — ERP
const PurRouter = lazy(() => import('@/features/pur/routes'));

// ✅ Módulo SLS (Ventas) — ERP
const SlsRouter = lazy(() => import('@/features/sls/routes'));

// ✅ Módulo INV_BILL (Facturación Electrónica) — ERP
const InvBillRouter = lazy(() => import('@/features/inv-bill/routes'));

// ✅ Módulo PRC (Precios y Promociones) — ERP
const PrcRouter = lazy(() => import('@/features/prc/routes'));

// ✅ Módulo FIN (Finanzas y Contabilidad) — ERP
const FinRouter = lazy(() => import('@/features/fin/routes'));

// ✅ Módulo LOG (Logística y Distribución) — ERP
const LogRouter = lazy(() => import('@/features/log/routes'));

// ✅ Módulo WMS (Warehouse Management System) — ERP
const WmsRouter = lazy(() => import('@/features/wms/routes'));

// ✅ Módulo QMS (Quality Management System) — ERP
const QmsRouter = lazy(() => import('@/features/qms/routes'));

// ✅ Módulo CRM (Customer Relationship Management) — ERP
const CrmRouter = lazy(() => import('@/features/crm/routes'));

// ✅ Módulo POS (Punto de Venta) — ERP
const PosRouter = lazy(() => import('@/features/pos/routes'));

// ✅ Módulo HCM (Planillas y RRHH) — Empleados, Contratos, Conceptos, Planillas, Asistencia, Vacaciones, Préstamos
const HcmRouter = lazy(() => import('@/features/hcm/routes'));

// ✅ Módulo MFG (Manufactura y Producción) — Centros de Trabajo, Operaciones, BOM, Rutas, Órdenes de Producción
const MfgRouter = lazy(() => import('@/features/mfg/routes'));

// ✅ Módulo MRP (Planeamiento de Materiales) — Plan Maestro, Necesidades Brutas, Explosión, Órdenes Sugeridas
const MrpRouter = lazy(() => import('@/features/mrp/routes'));

// ✅ Módulo MPS (Plan Maestro de Producción) — Pronóstico Demanda, Plan Producción, Detalle
const MpsRouter = lazy(() => import('@/features/mps/routes'));

// ✅ Módulo MNT (Mantenimiento de Activos) — Activos, Planes, OT, Historial
const MntRouter = lazy(() => import('@/features/mnt/routes'));

// ✅ Módulo CST (Costeo de Productos) — Tipos Centro Costo, Producto Costo, Análisis Variaciones
const CstRouter = lazy(() => import('@/features/cst/routes'));

// ✅ Módulo TAX (Libros Electrónicos) — PLE SUNAT
const TaxRouter = lazy(() => import('@/features/tax/routes'));

// ✅ Módulo BDG (Presupuestos) — Presupuestos, Ejecución
const BdgRouter = lazy(() => import('@/features/bdg/routes'));

// ✅ Módulo PM (Gestión de Proyectos) — Proyectos, Seguimiento
const PmRouter = lazy(() => import('@/features/pm/routes'));

// ✅ Módulo SVC (Órdenes de Servicio) — Órdenes, Envío Talleres, Stock Terceros
const SvcRouter = lazy(() => import('@/features/svc/routes'));

// ✅ Módulo TKT (Mesa de Ayuda) — Tickets
const TktRouter = lazy(() => import('@/features/tkt/routes'));

// ✅ Módulo DMS (Gestión Documental) — Documentos, Búsqueda
const DmsRouter = lazy(() => import('@/features/dms/routes'));

// ✅ Módulo WFL (Flujos de Trabajo) — Workflows, Seguimiento
const WflRouter = lazy(() => import('@/features/wfl/routes'));

// ✅ Módulo BI (Reportes y Analytics) — Reportes, Dashboards
const BiRouter = lazy(() => import('@/features/bi/routes'));

// ✅ Módulo AUD (Auditoría y Trazabilidad) — Log, Trazabilidad
const AudRouter = lazy(() => import('@/features/aud/routes'));

export const router = createBrowserRouter(
  [
    // Rutas públicas
    ...authRoutes,
    {
      path: '/unauthorized',
      element: <UnauthorizedPage />,
    },

    // Rutas protegidas (usuario normal)
    {
      element: <ProtectedRoute />,
      children: [
        {
          path: '/',
          element: <NewLayout />,
          children: [
            { index: true, element: <SmartRedirect /> },
            ...homeRoutes,
            // ✅ FASE 4: Módulo de Autorización con lazy loading y PermissionGuard
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
            // Ruta directa para compatibilidad (redirige al módulo)
            {
              path: 'finalizartareo',
              element: <Navigate to="/autorizacion/finalizartareo" replace />,
            },
            // ✅ FASE 4: Módulo de Reportes HCM con lazy loading y PermissionGuard
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
            // Ruta directa para compatibilidad (redirige al módulo)
            {
              path: 'reportedestajo',
              element: <Navigate to="/reportes/reportedestajo" replace />,
            },
            // ✅ Módulo ORG (Organización) — Mi Empresa, Sucursales, Departamentos, Cargos, Centros de costo, Parámetros
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
            // ✅ Módulo INV (Inventarios) — Productos, Categorías, Unidades de Medida, Almacenes, Stock, Movimientos
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
            // ✅ Módulo PUR (Compras) — Proveedores, Contactos, Productos por Proveedor, Solicitudes, Cotizaciones, Órdenes de Compra, Recepciones
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
            // ✅ Módulo SLS (Ventas) — Clientes, Contactos, Direcciones, Cotizaciones, Pedidos
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
            // ✅ Módulo INV_BILL (Facturación Electrónica) — Series, Comprobantes
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
            // ✅ Módulo PRC (Precios y Promociones) — Listas de Precio, Promociones
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
            // ✅ Módulo LOG (Logística y Distribución) — Transportistas, Vehículos, Rutas, Guías de Remisión, Despachos
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
            // ✅ Módulo FIN (Finanzas y Contabilidad) — Plan de Cuentas, Periodos Contables, Asientos Contables
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
            // ✅ Módulo WMS (Gestión de Almacenes) — Zonas, Ubicaciones, Stock por Ubicación, Tareas
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
            // ✅ Módulo QMS (Control de Calidad) — Parámetros, Planes de Inspección, Inspecciones, No Conformidades
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
            // ✅ Módulo CRM (Gestión de Clientes) — Campañas, Leads, Oportunidades, Actividades
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
            // ✅ Módulo POS (Punto de Venta) — Puntos de Venta, Turnos de Caja, Ventas
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
            // ✅ Módulo HCM (Planillas y RRHH) — Empleados, Contratos, Conceptos, Planillas, Asistencia, Vacaciones, Préstamos
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
            // ✅ Módulo MFG (Manufactura y Producción) — Centros de Trabajo, Operaciones, BOM, Rutas, Órdenes de Producción
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
            // ✅ Módulo MRP (Planeamiento de Materiales) — Plan Maestro, Necesidades Brutas, Explosión, Órdenes Sugeridas
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
            // ✅ Módulo MPS (Plan Maestro de Producción) — Pronóstico Demanda, Plan Producción, Detalle
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
            // ✅ Módulo MNT (Mantenimiento de Activos) — Activos, Planes, OT, Historial
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
            { path: '*', element: <SmartRedirect /> },
          ],
        },
      ],
    },

    // Rutas de administración (tenant admin)
    {
      element: <ProtectedRoute requiredLevel={4} />,
      children: [
        {
          path: '/admin',
          element: <NewLayout />,
          children: adminRoutes.children || [],
        },
      ],
    },

    // Rutas de super admin
    {
      element: <ProtectedRoute requireSuperAdmin={true} />,
      children: [
        {
          path: '/super-admin',
          element: <NewLayout />,
          children: superAdminRoutes.children || [],
        },
      ],
    },
  ]
);

