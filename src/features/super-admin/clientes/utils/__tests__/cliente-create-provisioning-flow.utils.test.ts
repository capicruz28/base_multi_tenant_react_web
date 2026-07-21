import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ClienteCreateResult } from '../../types/cliente.types';
import {
  buildProvisioningLocationState,
  getCredentialsRevealVariant,
  shouldNavigateToDedicatedProvisioning,
} from '../cliente-create-provisioning-flow.utils';

function makeResult(overrides?: Partial<ClienteCreateResult>): ClienteCreateResult {
  return {
    cliente: {
      cliente_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      codigo_cliente: 'ACME001',
      subdominio: 'acme',
      razon_social: 'ACME Corp',
      nombre_comercial: null,
      ruc: null,
      tipo_instalacion: 'shared',
      servidor_api_local: null,
      modo_autenticacion: 'local',
      logo_url: null,
      favicon_url: null,
      color_primario: '#000',
      color_secundario: '#111',
      tema_personalizado: null,
      plan_suscripcion: 'trial',
      estado_suscripcion: 'activo',
      fecha_inicio_suscripcion: null,
      fecha_fin_trial: null,
      contacto_nombre: null,
      contacto_email: 'admin@acme.com',
      contacto_telefono: null,
      es_activo: true,
      es_demo: false,
      metadata_json: null,
      api_key_sincronizacion: null,
      sincronizacion_habilitada: false,
      ultima_sincronizacion: null,
      fecha_creacion: '2026-06-25T20:00:00Z',
      fecha_actualizacion: null,
      fecha_ultimo_acceso: null,
    },
    credenciales: {
      nombre_usuario: 'admin',
      contrasena: 'secret',
      requiere_cambio: true,
    },
    message: 'Cliente creado exitosamente',
    ...overrides,
  };
}

describe('cliente-create-provisioning-flow.utils', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('shared con flag on no navega a provisioning', () => {
    vi.stubEnv('VITE_DEDICATED_PROVISIONING_V2', 'true');
    const result = makeResult();
    expect(shouldNavigateToDedicatedProvisioning(result)).toBe(false);
    expect(getCredentialsRevealVariant(result)).toBe('shared');
  });

  it('dedicated con flag off se comporta como shared', () => {
    vi.stubEnv('VITE_DEDICATED_PROVISIONING_V2', 'false');
    const result = makeResult({
      cliente: { ...makeResult().cliente, tipo_instalacion: 'dedicated' },
      provisioningState: 'provisioning',
      provisioning: {
        status_url: '/api/v1/clientes/a1b2c3d4-e5f6-7890-abcd-ef1234567890/provisioning-status/',
      },
    });
    expect(shouldNavigateToDedicatedProvisioning(result)).toBe(false);
    expect(getCredentialsRevealVariant(result)).toBe('shared');
  });

  it('dedicated con flag on y provisioning_state navega', () => {
    vi.stubEnv('VITE_DEDICATED_PROVISIONING_V2', 'true');
    const result = makeResult({
      cliente: { ...makeResult().cliente, tipo_instalacion: 'dedicated' },
      provisioningState: 'provisioning',
      provisioning: {
        status_url: '/api/v1/clientes/a1b2c3d4-e5f6-7890-abcd-ef1234567890/provisioning-status/',
        estimated_duration_seconds: 900,
      },
    });
    expect(shouldNavigateToDedicatedProvisioning(result)).toBe(true);
    expect(getCredentialsRevealVariant(result)).toBe('dedicated-provisioning');
    expect(buildProvisioningLocationState(result)).toEqual({
      credenciales: result.credenciales,
      clienteLabel: 'ACME Corp',
      statusUrl: result.provisioning?.status_url,
      provisioning_state: 'provisioning',
    });
  });
});
