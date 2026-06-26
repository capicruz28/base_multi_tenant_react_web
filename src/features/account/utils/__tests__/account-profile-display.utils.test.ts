import { describe, expect, it } from 'vitest';

import type { ClienteInfo, UserData } from '@/features/auth/types/auth.types';
import { buildAccountProfileViewModel } from '@/features/account/utils/account-profile-display.utils';

const baseUser: UserData = {
  usuario_id: '00000000-0000-0000-0000-000000000001',
  cliente_id: '00000000-0000-0000-0000-000000000002',
  nombre_usuario: 'jperez',
  correo: 'juan@example.com',
  nombre: 'Juan',
  apellido: 'Pérez',
  es_activo: true,
  roles: ['Vendedor', 'Supervisor'],
};

const baseCliente: ClienteInfo = {
  cliente_id: '00000000-0000-0000-0000-000000000002',
  razon_social: 'Acme Corp',
  nombre_comercial: 'Acme',
  subdominio: 'acme',
  tipo_instalacion: 'cloud',
  estado_suscripcion: 'activa',
};

describe('buildAccountProfileViewModel', () => {
  it('construye vista desde AuthContext sin UUID visibles', () => {
    const profile = buildAccountProfileViewModel({
      user: baseUser,
      clienteInfo: baseCliente,
      accessLevel: 2,
      empresaActivaId: '00000000-0000-0000-0000-000000000010',
      empresasElegibles: [
        {
          empresa_id: '00000000-0000-0000-0000-000000000010',
          razon_social: 'Empresa Demo SAC',
          nombre_comercial: 'Demo',
        },
      ],
    });

    expect(profile).toMatchObject({
      fullName: 'Juan Pérez',
      username: 'jperez',
      email: 'juan@example.com',
      clientName: 'Acme Corp',
      tenantName: 'Acme',
      activeCompanyName: 'Demo',
      primaryRole: 'Vendedor',
      roles: ['Vendedor', 'Supervisor'],
      accessLevel: 2,
    });
    expect(JSON.stringify(profile)).not.toMatch(/00000000-0000-0000/);
  });

  it('oculta campos ausentes — sin empresa activa resuelta', () => {
    const profile = buildAccountProfileViewModel({
      user: baseUser,
      clienteInfo: null,
      accessLevel: 1,
      empresaActivaId: '00000000-0000-0000-0000-000000000099',
      empresasElegibles: [],
    });

    expect(profile?.activeCompanyName).toBeNull();
    expect(profile?.companyCode).toBeNull();
    expect(profile?.clientName).toBeNull();
  });

  it('lee codigo_empresa solo si viene en empresas_disponibles del user', () => {
    const userWithCodigo = {
      ...baseUser,
      empresas_disponibles: [
        {
          empresa_id: '00000000-0000-0000-0000-000000000010',
          razon_social: 'Empresa Demo SAC',
          codigo_empresa: 'EMP-01',
        },
      ],
    } as UserData;

    const profile = buildAccountProfileViewModel({
      user: userWithCodigo,
      clienteInfo: baseCliente,
      accessLevel: 2,
      empresaActivaId: '00000000-0000-0000-0000-000000000010',
      empresasElegibles: [
        {
          empresa_id: '00000000-0000-0000-0000-000000000010',
          razon_social: 'Empresa Demo SAC',
        },
      ],
    });

    expect(profile?.companyCode).toBe('EMP-01');
  });

  it('retorna null si no hay user', () => {
    expect(
      buildAccountProfileViewModel({
        user: null,
        clienteInfo: null,
        accessLevel: 0,
        empresaActivaId: null,
        empresasElegibles: [],
      }),
    ).toBeNull();
  });
});
