import { describe, expect, it } from 'vitest';
import type { UserWithRoles } from '@/features/admin/types/usuario.types';
import {
  buildResetConfirmMessage,
  canShowAdminPasswordReset,
  formatPasswordResetCredentialsBlock,
  isAdminPasswordSelfResetError,
  isAdminPasswordSsoError,
  isLocalAuthUser,
  redactPasswordResetResponseForLog,
  shouldInvalidateUsersListAfterResetError,
} from '@/features/admin/utils/iam-user-password-reset.utils';
import axios from 'axios';

function buildUser(overrides: Partial<UserWithRoles> = {}): UserWithRoles {
  return {
    usuario_id: 'user-target',
    cliente_id: 'client-1',
    nombre_usuario: 'jperez',
    correo: 'jperez@example.com',
    es_activo: true,
    correo_confirmado: true,
    fecha_creacion: '2026-01-01T00:00:00Z',
    roles: [],
    ...overrides,
  };
}

const baseCtx = {
  currentUsuarioId: 'admin-1',
  hasResetPermission: true,
  pageActionsLocked: false,
};

describe('iam-user-password-reset.utils', () => {
  describe('isLocalAuthUser', () => {
    it('trata ausente como local', () => {
      expect(isLocalAuthUser(buildUser())).toBe(true);
    });

    it('rechaza proveedor azure', () => {
      expect(isLocalAuthUser(buildUser({ proveedor_autenticacion: 'azure' }))).toBe(false);
    });

    it('acepta local explícito', () => {
      expect(isLocalAuthUser(buildUser({ proveedor_autenticacion: 'local' }))).toBe(true);
    });
  });

  describe('canShowAdminPasswordReset', () => {
    it('oculta sin permiso', () => {
      expect(
        canShowAdminPasswordReset(buildUser(), { ...baseCtx, hasResetPermission: false }),
      ).toBe(false);
    });

    it('oculta auto-reset', () => {
      expect(
        canShowAdminPasswordReset(buildUser({ usuario_id: 'admin-1' }), baseCtx),
      ).toBe(false);
    });

    it('oculta SSO', () => {
      expect(
        canShowAdminPasswordReset(buildUser({ proveedor_autenticacion: 'google' }), baseCtx),
      ).toBe(false);
    });

    it('oculta con pageActionsLocked', () => {
      expect(
        canShowAdminPasswordReset(buildUser(), { ...baseCtx, pageActionsLocked: true }),
      ).toBe(false);
    });

    it('muestra usuario local ajeno con permiso', () => {
      expect(canShowAdminPasswordReset(buildUser(), baseCtx)).toBe(true);
    });

    it('muestra usuario inactivo local', () => {
      expect(canShowAdminPasswordReset(buildUser({ es_activo: false }), baseCtx)).toBe(true);
    });
  });

  describe('buildResetConfirmMessage', () => {
    it('incluye párrafo inactivo cuando aplica', () => {
      const msg = buildResetConfirmMessage('Juan Pérez', true);
      expect(msg).toContain("¿Restablecer la contraseña de 'Juan Pérez'?");
      expect(msg).toContain('Este usuario está inactivo.');
    });

    it('no incluye párrafo inactivo para activo', () => {
      const msg = buildResetConfirmMessage('Juan Pérez', false);
      expect(msg).not.toContain('Este usuario está inactivo.');
    });
  });

  describe('formatPasswordResetCredentialsBlock', () => {
    it('formatea bloque con nota inactivo', () => {
      const block = formatPasswordResetCredentialsBlock(
        'Juan Pérez',
        { nombre_usuario: 'jperez', contrasena: 'Temp#123', requiere_cambio: true },
        true,
      );
      expect(block).toContain('Usuario afectado: Juan Pérez');
      expect(block).toContain('Contraseña temporal: Temp#123');
      expect(block).toContain('debe reactivarse antes de iniciar sesión');
    });
  });

  describe('error helpers', () => {
    it('detecta auto-reset 400', () => {
      const err = new axios.AxiosError(
        'bad',
        'ERR',
        undefined,
        undefined,
        {
          status: 400,
          data: {
            detail:
              'No puede restablecer su propia contraseña por esta vía. Use el cambio de contraseña o solicítelo a otro administrador',
          },
          statusText: 'Bad Request',
          headers: {},
          config: {} as never,
        },
      );
      expect(isAdminPasswordSelfResetError(err)).toBe(true);
      expect(isAdminPasswordSsoError(err)).toBe(false);
    });

    it('detecta SSO 400 e invalidación listado', () => {
      const err = new axios.AxiosError(
        'bad',
        'ERR',
        undefined,
        undefined,
        {
          status: 400,
          data: { detail: 'El restablecimiento de contraseña no está disponible para usuarios SSO externos' },
          statusText: 'Bad Request',
          headers: {},
          config: {} as never,
        },
      );
      expect(isAdminPasswordSsoError(err)).toBe(true);
      expect(shouldInvalidateUsersListAfterResetError(err)).toBe(true);
    });

    it('invalida listado en 404', () => {
      const err = new axios.AxiosError(
        'not found',
        'ERR',
        undefined,
        undefined,
        {
          status: 404,
          data: { detail: 'Usuario no encontrado en este cliente' },
          statusText: 'Not Found',
          headers: {},
          config: {} as never,
        },
      );
      expect(shouldInvalidateUsersListAfterResetError(err)).toBe(true);
    });
  });

  describe('redactPasswordResetResponseForLog', () => {
    it('no incluye contraseña', () => {
      const redacted = redactPasswordResetResponseForLog({
        success: true,
        message: 'ok',
        usuario_id: 'u-1',
        sesiones_revocadas: 2,
        credenciales_temporales: {
          nombre_usuario: 'jperez',
          contrasena: 'secret',
          requiere_cambio: true,
        },
      });
      expect(redacted).toEqual({
        redacted: true,
        usuario_id: 'u-1',
        sesiones_revocadas: 2,
        success: true,
      });
      expect(JSON.stringify(redacted)).not.toContain('secret');
    });
  });
});
