import { describe, it, expect } from 'vitest';
import type { Cliente } from '@/features/super-admin/clientes/types/cliente.types';
import {
  formatDedicatedTenantOptionLabel,
  matchesDedicatedTenantSearch,
  resolveDedicatedTenantDatabaseName,
} from '../dedicated-tenant-select.utils';

const baseCliente: Cliente = {
  cliente_id: '11111111-1111-1111-1111-111111111111',
  codigo_cliente: 'CLI001',
  subdominio: 'acme',
  razon_social: 'Acme Dedicated SAC',
  nombre_comercial: 'Acme Corp',
  ruc: null,
  tipo_instalacion: 'dedicated',
  servidor_api_local: null,
  modo_autenticacion: 'local',
  logo_url: null,
  favicon_url: null,
  color_primario: '#000000',
  color_secundario: '#ffffff',
  tema_personalizado: null,
  plan_suscripcion: 'profesional',
  estado_suscripcion: 'activo',
  fecha_inicio_suscripcion: null,
  fecha_fin_trial: null,
  contacto_nombre: null,
  contacto_email: 'admin@acme.test',
  contacto_telefono: null,
  es_activo: true,
  es_demo: false,
  metadata_json: null,
  api_key_sincronizacion: null,
  sincronizacion_habilitada: false,
  ultima_sincronizacion: null,
  fecha_creacion: '2026-01-01T00:00:00Z',
  fecha_actualizacion: null,
  fecha_ultimo_acceso: null,
};

describe('dedicated-tenant-select.utils', () => {
  it('formatDedicatedTenantOptionLabel usa razon_social y codigo_cliente', () => {
    expect(formatDedicatedTenantOptionLabel(baseCliente)).toBe('Acme Dedicated SAC (CLI001)');
  });

  it('matchesDedicatedTenantSearch busca por razon_social, nombre_comercial y codigo_cliente', () => {
    expect(matchesDedicatedTenantSearch(baseCliente, 'acme dedicated')).toBe(true);
    expect(matchesDedicatedTenantSearch(baseCliente, 'acme corp')).toBe(true);
    expect(matchesDedicatedTenantSearch(baseCliente, 'cli001')).toBe(true);
    expect(matchesDedicatedTenantSearch(baseCliente, 'inexistente')).toBe(false);
  });

  it('resolveDedicatedTenantDatabaseName prioriza conexión principal activa', () => {
    expect(
      resolveDedicatedTenantDatabaseName([
        {
          nombre_bd: 'db_secundaria',
          es_conexion_principal: false,
          es_activo: true,
        },
        {
          nombre_bd: 'db_principal',
          es_conexion_principal: true,
          es_activo: true,
        },
      ]),
    ).toBe('db_principal');
  });
});
