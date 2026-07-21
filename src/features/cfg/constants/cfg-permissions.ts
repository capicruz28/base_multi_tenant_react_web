/**
 * Códigos RBAC negocio del módulo CFG.
 * Consumir vía usePermission().hasPermission(CFG_PERMISSIONS.…).
 */

export const CFG_PERMISSIONS = {
  SECUENCIAS_CONSULTAR: 'cfg.secuencias.consultar',
  SECUENCIAS_ACTUALIZAR: 'cfg.secuencias.actualizar',
} as const;

export type CfgPermissionCode =
  (typeof CFG_PERMISSIONS)[keyof typeof CFG_PERMISSIONS];
