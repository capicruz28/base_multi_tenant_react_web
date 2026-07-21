import { describe, expect, it } from 'vitest';

import type { Cliente } from '../../types/cliente.types';
import { parseProvisioningCreateEnvelope } from '../parse-provisioning-create-envelope.utils';

function makeCliente(overrides?: Partial<Cliente>): Cliente {
  return {
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
    ...overrides,
  };
}

describe('parseProvisioningCreateEnvelope', () => {
  it('retorna vacío para respuesta Shared sin campos F4', () => {
    const cliente = makeCliente({ tipo_instalacion: 'shared' });
    expect(parseProvisioningCreateEnvelope(cliente, undefined)).toEqual({});
  });

  it('parsea campos Dedicated F4 del 201', () => {
    const cliente = makeCliente({
      tipo_instalacion: 'dedicated',
      provisioning_state: 'provisioning',
      provisioning_run_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    });
    const rawProvisioning = {
      status_url: '/api/v1/clientes/a1b2c3d4-e5f6-7890-abcd-ef1234567890/provisioning-status/',
      estimated_duration_seconds: 900,
    };

    expect(parseProvisioningCreateEnvelope(cliente, rawProvisioning)).toEqual({
      provisioningState: 'provisioning',
      provisioningRunId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      provisioning: {
        status_url:
          '/api/v1/clientes/a1b2c3d4-e5f6-7890-abcd-ef1234567890/provisioning-status/',
        estimated_duration_seconds: 900,
      },
    });
  });
});
