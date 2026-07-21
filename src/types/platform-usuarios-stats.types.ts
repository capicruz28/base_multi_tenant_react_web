/**
 * F13-M3 — GET /superadmin/usuarios/stats
 * @see F13_M3_FRONTEND_CONTRACT.md §3.1 PlatformUsuariosStatsResponse
 */
export interface PlatformUsuariosStatsResponse {
  total_usuarios: number;
  usuarios_activos: number;
  usuarios_inactivos: number;
  usuarios_bloqueados: number;
}

export interface PlatformUsuariosStatsParams {
  cliente_id?: string;
  search?: string;
  proveedor_autenticacion?: string;
}
