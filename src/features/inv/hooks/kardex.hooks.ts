import { useTenantQuery } from '@/core/hooks/useTenantQuery';
import { kardexService } from '../services/inv.service';
import type { KardexLineaRead } from '../types/inv.types';

const qk = {
  list: (empresaId?: string, productoId?: string, almacenId?: string, fechaDesde?: string, fechaHasta?: string) =>
    [
      'inv',
      'kardex',
      'list',
      empresaId ?? '',
      productoId ?? '',
      almacenId ?? '',
      fechaDesde ?? '',
      fechaHasta ?? '',
    ] as const,
};

export function useKardex(options?: {
  empresa_id?: string;
  producto_id?: string;
  almacen_id?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  enabled?: boolean;
}) {
  const enabled = options?.enabled ?? true;

  return useTenantQuery<KardexLineaRead[], Error>({
    queryKey: qk.list(options?.empresa_id, options?.producto_id, options?.almacen_id, options?.fecha_desde, options?.fecha_hasta),
    queryFn: () =>
      kardexService.list({
        empresa_id: options?.empresa_id,
        producto_id: options?.producto_id,
        almacen_id: options?.almacen_id,
        fecha_desde: options?.fecha_desde,
        fecha_hasta: options?.fecha_hasta,
      }),
    enabled,
  });
}

