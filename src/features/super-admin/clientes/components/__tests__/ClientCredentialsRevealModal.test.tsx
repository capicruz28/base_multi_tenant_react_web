import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import ClientCredentialsRevealModal from '../ClientCredentialsRevealModal';
import type { ClienteCreateResult } from '../../types/cliente.types';

const baseResult: ClienteCreateResult = {
  cliente: {
    cliente_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    codigo_cliente: 'ACME001',
    subdominio: 'acme',
    razon_social: 'ACME Corp',
    nombre_comercial: null,
    ruc: null,
    tipo_instalacion: 'dedicated',
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
};

vi.mock('@/shared/utils/copy-to-clipboard', () => ({
  copyTextToClipboard: vi.fn().mockResolvedValue(undefined),
}));

describe('ClientCredentialsRevealModal', () => {
  it('variant shared no muestra advertencia de login bloqueado', () => {
    render(
      <ClientCredentialsRevealModal
        isOpen
        result={baseResult}
        variant="shared"
        onComplete={vi.fn()}
      />,
    );

    expect(
      screen.queryByText(/acceso al ERP permanecerá bloqueado/i),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /finalizar/i })).toBeInTheDocument();
  });

  it('variant dedicated-provisioning muestra advertencia y CTA de provisioning', () => {
    render(
      <ClientCredentialsRevealModal
        isOpen
        result={baseResult}
        variant="dedicated-provisioning"
        onComplete={vi.fn()}
      />,
    );

    expect(screen.getByText(/acceso al ERP permanecerá bloqueado/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continuar al provisioning/i })).toBeInTheDocument();
  });
});
