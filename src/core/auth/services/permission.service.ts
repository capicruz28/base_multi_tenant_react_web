/**
 * Servicio de permisos (core/auth).
 *
 * Migración completada: los permisos del usuario se obtienen desde GET /auth/menu
 * en AuthContext. Este módulo ya no exporta getUserPermissions().
 *
 * Para verificación en UI se usa usePermissions() y permissions del AuthContext.
 */
