import axios from 'axios';
import type { AdminPasswordResetResponse, UserWithRoles } from '../types/usuario.types';

export interface AdminPasswordResetVisibilityContext {
  currentUsuarioId: string | null;
  hasResetPermission: boolean;
  pageActionsLocked: boolean;
}

export function isLocalAuthUser(user: UserWithRoles): boolean {
  const provider = user.proveedor_autenticacion?.trim().toLowerCase();
  if (!provider) return true;
  return provider === 'local';
}

export function canShowAdminPasswordReset(
  user: UserWithRoles,
  ctx: AdminPasswordResetVisibilityContext,
): boolean {
  if (!ctx.hasResetPermission) return false;
  if (!ctx.currentUsuarioId) return false;
  if (user.usuario_id === ctx.currentUsuarioId) return false;
  if (ctx.pageActionsLocked) return false;
  if (!isLocalAuthUser(user)) return false;
  return true;
}

export function buildResetConfirmMessage(displayName: string, isInactive: boolean): string {
  const base = `¿Restablecer la contraseña de '${displayName}'?

El sistema generará una contraseña temporal nueva. Todas las sesiones activas de este usuario se cerrarán.

La contraseña temporal solo se mostrará una vez después de confirmar. No podrá recuperarla desde el sistema.

El usuario deberá cambiar la contraseña en su próximo acceso.`;

  if (isInactive) {
    return `${base}

Este usuario está inactivo. Tras el restablecimiento deberá reactivarlo antes de que pueda iniciar sesión.`;
  }

  return base;
}

export function formatPasswordResetCredentialsBlock(
  targetDisplayName: string,
  credenciales: AdminPasswordResetResponse['credenciales_temporales'],
  isInactiveUser: boolean,
): string {
  const lines = [
    `Usuario afectado: ${targetDisplayName}`,
    `Usuario: ${credenciales.nombre_usuario}`,
    `Contraseña temporal: ${credenciales.contrasena}`,
    'Nota: El usuario deberá cambiar la contraseña en su primer acceso.',
  ];

  if (isInactiveUser) {
    lines.push('Nota: El usuario está inactivo; debe reactivarse antes de iniciar sesión.');
  }

  return lines.join('\n');
}

function readErrorDetail(err: unknown): string {
  if (!axios.isAxiosError(err)) return '';
  const data = err.response?.data;
  if (typeof data === 'object' && data !== null && 'detail' in data) {
    const detail = (data as { detail: unknown }).detail;
    if (typeof detail === 'string') return detail;
  }
  return '';
}

export function isAdminPasswordSelfResetError(err: unknown): boolean {
  if (!axios.isAxiosError(err)) return false;
  if (err.response?.status !== 400) return false;
  const detail = readErrorDetail(err);
  return detail.includes('propia contraseña');
}

export function isAdminPasswordSsoError(err: unknown): boolean {
  if (!axios.isAxiosError(err)) return false;
  if (err.response?.status !== 400) return false;
  const detail = readErrorDetail(err);
  return detail.toLowerCase().includes('sso');
}

export function shouldInvalidateUsersListAfterResetError(err: unknown): boolean {
  if (!axios.isAxiosError(err)) return false;
  const status = err.response?.status;
  if (status === 404) return true;
  if (status === 400 && isAdminPasswordSsoError(err)) return true;
  return false;
}

export function redactPasswordResetResponseForLog(
  response: AdminPasswordResetResponse,
): Record<string, unknown> {
  return {
    redacted: true,
    usuario_id: response.usuario_id,
    sesiones_revocadas: response.sesiones_revocadas,
    success: response.success,
  };
}
