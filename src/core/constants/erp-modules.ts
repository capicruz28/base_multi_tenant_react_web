/**
 * Contrato de códigos de módulos ERP
 *
 * Fuente única de verdad para los 27 módulos definidos en:
 * - docs/CATALOGO_MODULOS.md
 * - docs/MENU_NAVEGACION.md
 * - docs/TABLAS_BD_ERP_COMPLETO.sql
 *
 * Uso:
 * - Router: path = `/${config.routePrefix}/*`
 * - PermissionGuard: module = config.permissionModule
 * - usePermissions().can(config.permissionModule, 'ver')
 *
 * IMPORTANTE: permissionModule debe coincidir con el nombre de módulo
 * que devuelve el backend en permisos por menú (mapeo menu_id → módulo).
 */

export interface ERPModuleConfig {
  /** Código del módulo en catálogo/BD (ORG, INV, etc.) */
  codigo: string;
  /** Prefijo de ruta en la URL (minúsculas). Ej: 'org', 'inv', 'inv-bill' */
  routePrefix: string;
  /** Valor para PermissionGuard y usePermissions().can() - debe coincidir con backend */
  permissionModule: string;
  /** Descripción breve (opcional) */
  descripcion?: string;
}

/**
 * Lista de los 27 módulos ERP.
 * Al añadir una ruta en app/router.tsx, usar el permissionModule y routePrefix de aquí.
 */
export const ERP_MODULES: ERPModuleConfig[] = [
  { codigo: 'ORG', routePrefix: 'org', permissionModule: 'org', descripcion: 'Organización' },
  { codigo: 'INV', routePrefix: 'inv', permissionModule: 'inv', descripcion: 'Inventarios' },
  { codigo: 'WMS', routePrefix: 'wms', permissionModule: 'wms', descripcion: 'Gestión de almacenes' },
  { codigo: 'QMS', routePrefix: 'qms', permissionModule: 'qms', descripcion: 'Control de calidad' },
  { codigo: 'PUR', routePrefix: 'pur', permissionModule: 'pur', descripcion: 'Compras' },
  { codigo: 'LOG', routePrefix: 'log', permissionModule: 'log', descripcion: 'Logística y distribución' },
  { codigo: 'MFG', routePrefix: 'mfg', permissionModule: 'mfg', descripcion: 'Producción y manufactura' },
  { codigo: 'MRP', routePrefix: 'mrp', permissionModule: 'mrp', descripcion: 'Planeamiento de materiales' },
  { codigo: 'MPS', routePrefix: 'mps', permissionModule: 'mps', descripcion: 'Plan maestro de producción' },
  { codigo: 'MNT', routePrefix: 'mnt', permissionModule: 'mnt', descripcion: 'Mantenimiento' },
  { codigo: 'SLS', routePrefix: 'sls', permissionModule: 'sls', descripcion: 'Ventas' },
  { codigo: 'CRM', routePrefix: 'crm', permissionModule: 'crm', descripcion: 'Gestión de clientes' },
  { codigo: 'PRC', routePrefix: 'prc', permissionModule: 'prc', descripcion: 'Precios y promociones' },
  { codigo: 'INV_BILL', routePrefix: 'inv-bill', permissionModule: 'inv-bill', descripcion: 'Facturación electrónica' },
  { codigo: 'POS', routePrefix: 'pos', permissionModule: 'pos', descripcion: 'Punto de venta' },
  { codigo: 'HCM', routePrefix: 'hcm', permissionModule: 'hcm', descripcion: 'Planillas y RRHH' },
  { codigo: 'FIN', routePrefix: 'fin', permissionModule: 'fin', descripcion: 'Contabilidad' },
  { codigo: 'TAX', routePrefix: 'tax', permissionModule: 'tax', descripcion: 'Libros electrónicos' },
  { codigo: 'BDG', routePrefix: 'bdg', permissionModule: 'bdg', descripcion: 'Presupuestos' },
  { codigo: 'CST', routePrefix: 'cst', permissionModule: 'cst', descripcion: 'Costeo de productos' },
  { codigo: 'PM', routePrefix: 'pm', permissionModule: 'pm', descripcion: 'Gestión de proyectos' },
  { codigo: 'SVC', routePrefix: 'svc', permissionModule: 'svc', descripcion: 'Órdenes de servicio' },
  { codigo: 'TKT', routePrefix: 'tkt', permissionModule: 'tkt', descripcion: 'Mesa de ayuda' },
  { codigo: 'BI', routePrefix: 'bi', permissionModule: 'bi', descripcion: 'Reportes y analytics' },
  { codigo: 'DMS', routePrefix: 'dms', permissionModule: 'dms', descripcion: 'Gestión documental' },
  { codigo: 'WFL', routePrefix: 'wfl', permissionModule: 'wfl', descripcion: 'Flujos de trabajo' },
  { codigo: 'AUD', routePrefix: 'aud', permissionModule: 'aud', descripcion: 'Auditoría' },
];

/** Módulos que ya existen en el router con nombres legacy (autorizacion, reportes están bajo HCM) */
export const LEGACY_MODULE_ALIASES: Record<string, string> = {
  autorizacion: 'hcm', // sub-módulo de HCM
  reportes: 'hcm',    // sub-módulo de HCM
};

/**
 * Obtiene la config de un módulo por código (ORG, INV, ...)
 */
export function getERPModuleByCodigo(codigo: string): ERPModuleConfig | undefined {
  return ERP_MODULES.find((m) => m.codigo === codigo);
}

/**
 * Obtiene la config por permissionModule (valor usado en PermissionGuard)
 */
export function getERPModuleByPermission(permissionModule: string): ERPModuleConfig | undefined {
  return ERP_MODULES.find((m) => m.permissionModule === permissionModule);
}
