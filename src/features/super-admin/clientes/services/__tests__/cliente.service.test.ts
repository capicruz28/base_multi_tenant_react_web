import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '@/core/api/api';
import {
  clienteService,
  CLIENTES_INACTIVE_FETCH_LIMIT,
} from '@/features/super-admin/clientes/services/cliente.service';
import type { Cliente } from '@/features/super-admin/clientes/types/cliente.types';

vi.mock('@/core/api/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

function makeCliente(id: string, es_activo: boolean): Cliente {
  return {
    cliente_id: id,
    codigo_cliente: `C-${id}`,
    subdominio: `sub-${id}`,
    razon_social: `Razon ${id}`,
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
    estado_suscripcion: 'trial',
    fecha_inicio_suscripcion: null,
    fecha_fin_trial: null,
    contacto_nombre: null,
    contacto_email: 'a@b.com',
    contacto_telefono: null,
    es_activo,
    es_demo: false,
    metadata_json: null,
    api_key_sincronizacion: null,
    sincronizacion_habilitada: false,
    ultima_sincronizacion: null,
    fecha_creacion: '2024-01-01',
    fecha_actualizacion: null,
    fecha_ultimo_acceso: null,
  };
}

describe('clienteService.getClientes', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
  });

  it('envía solo_activos=true para filtro Activos', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        clientes: [],
        total_clientes: 0,
        pagina_actual: 1,
        total_paginas: 1,
        items_por_pagina: 10,
      },
    });

    await clienteService.getClientes(1, 10, { activeFilter: 'active' });

    expect(api.get).toHaveBeenCalledWith('/clientes/?skip=0&limit=10&solo_activos=true');
  });

  it('envía solo_activos=false para filtro Todos', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        clientes: [],
        total_clientes: 0,
        pagina_actual: 1,
        total_paginas: 1,
        items_por_pagina: 10,
      },
    });

    await clienteService.getClientes(2, 10, { activeFilter: 'all' });

    expect(api.get).toHaveBeenCalledWith('/clientes/?skip=10&limit=10&solo_activos=false');
  });

  it('filtra inactivos y pagina localmente para filtro Inactivos', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        clientes: [
          makeCliente('1', true),
          makeCliente('2', false),
          makeCliente('3', false),
          makeCliente('4', false),
          makeCliente('5', true),
        ],
        total_clientes: 5,
        pagina_actual: 1,
        total_paginas: 1,
        items_por_pagina: 10,
      },
    });

    const page1 = await clienteService.getClientes(1, 2, { activeFilter: 'inactive' });
    expect(api.get).toHaveBeenCalledWith(
      `/clientes/?skip=0&limit=${CLIENTES_INACTIVE_FETCH_LIMIT}&solo_activos=false`,
    );
    expect(page1.clientes.map((c) => c.cliente_id)).toEqual(['2', '3']);
    expect(page1.total_clientes).toBe(3);
    expect(page1.total_paginas).toBe(2);

    const page2 = await clienteService.getClientes(2, 2, { activeFilter: 'inactive' });
    expect(page2.clientes.map((c) => c.cliente_id)).toEqual(['4']);
    expect(page2.pagina_actual).toBe(2);
  });
});
