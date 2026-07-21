import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '@/core/api/api';
import { clienteService } from '../cliente.service';
import type { Cliente } from '../../types/cliente.types';

vi.mock('@/core/api/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

const sharedCliente: Cliente = {
  cliente_id: '11111111-1111-1111-1111-111111111111',
  codigo_cliente: 'SHARED01',
  subdominio: 'shared-tenant',
  razon_social: 'Shared Tenant',
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
  contacto_email: 'admin@shared.com',
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
};

const dedicatedCliente: Cliente = {
  ...sharedCliente,
  cliente_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  codigo_cliente: 'ACME001',
  subdominio: 'acme',
  razon_social: 'ACME Corp',
  tipo_instalacion: 'dedicated',
  provisioning_state: 'provisioning',
  provisioning_run_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
};

const credenciales = {
  nombre_usuario: 'admin',
  contrasena: 'xK9#mP2$vL7nQ4',
  requiere_cambio: true,
};

describe('clienteService.provisionCliente — envelope F4', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('preserva parse Shared sin campos provisioning', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: {
        success: true,
        message: 'Cliente creado exitosamente',
        data: sharedCliente,
        credenciales_iniciales: credenciales,
      },
    });

    const result = await clienteService.provisionCliente({
      codigo_cliente: 'SHARED01',
      subdominio: 'shared-tenant',
      razon_social: 'Shared Tenant',
      tipo_instalacion: 'shared',
      modo_autenticacion: 'local',
      plan_suscripcion: 'trial',
      estado_suscripcion: 'activo',
      contacto_email: 'admin@shared.com',
    });

    expect(result.cliente).toEqual(sharedCliente);
    expect(result.credenciales).toEqual(credenciales);
    expect(result.provisioning).toBeUndefined();
    expect(result.provisioningState).toBeUndefined();
    expect(result.provisioningRunId).toBeUndefined();
  });

  it('parsea envelope Dedicated F4 aditivo en 201', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: {
        success: true,
        message: 'Cliente creado exitosamente. Guarde las credenciales.',
        data: dedicatedCliente,
        credenciales_iniciales: credenciales,
        provisioning: {
          status_url: '/api/v1/clientes/a1b2c3d4-e5f6-7890-abcd-ef1234567890/provisioning-status/',
          estimated_duration_seconds: 900,
        },
      },
    });

    const result = await clienteService.provisionCliente({
      codigo_cliente: 'ACME001',
      subdominio: 'acme',
      razon_social: 'ACME Corp',
      tipo_instalacion: 'dedicated',
      modo_autenticacion: 'local',
      plan_suscripcion: 'profesional',
      estado_suscripcion: 'activo',
      contacto_email: 'admin@acme.com',
    });

    expect(result.provisioningState).toBe('provisioning');
    expect(result.provisioningRunId).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
    expect(result.provisioning).toEqual({
      status_url: '/api/v1/clientes/a1b2c3d4-e5f6-7890-abcd-ef1234567890/provisioning-status/',
      estimated_duration_seconds: 900,
    });
    expect(result.credenciales.contrasena).toBe('xK9#mP2$vL7nQ4');
  });
});
