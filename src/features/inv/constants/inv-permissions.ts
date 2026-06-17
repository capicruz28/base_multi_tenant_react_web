/**

 * Códigos RBAC negocio del módulo INV (RC1 §8.1 transaccional, §8.2 lifecycle).

 * Consumir vía `usePermission().hasPermission(INV_PERMISSIONS.…)`.

 * Catálogos Plantilla A siguen usando `usePermissions().can('inv', …)` (LBAC menú).

 */

export const INV_PERMISSIONS = {

  MOVIMIENTO_CREAR: 'inv.movimiento.crear',

  MOVIMIENTO_ACTUALIZAR: 'inv.movimiento.actualizar',

  MOVIMIENTO_AUTORIZAR: 'inv.movimiento.autorizar',

  MOVIMIENTO_PROCESAR: 'inv.movimiento.procesar',

  MOVIMIENTO_ANULAR: 'inv.movimiento.anular',

  MOVIMIENTO_ESTORNAR: 'inv.movimiento.estornar',

  INVENTARIO_FISICO_CREAR: 'inv.inventario_fisico.crear',

  INVENTARIO_FISICO_ACTUALIZAR: 'inv.inventario_fisico.actualizar',

  INVENTARIO_FISICO_FINALIZAR: 'inv.inventario_fisico.finalizar',

  INVENTARIO_FISICO_APROBAR: 'inv.inventario_fisico.aprobar',

  INVENTARIO_FISICO_ANULAR: 'inv.inventario_fisico.anular',

} as const;

