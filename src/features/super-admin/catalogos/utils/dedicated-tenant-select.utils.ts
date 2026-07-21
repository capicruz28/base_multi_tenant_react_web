import type { Cliente } from '@/features/super-admin/clientes/types/cliente.types';

export function formatDedicatedTenantOptionLabel(cliente: Cliente): string {
  return `${cliente.razon_social} (${cliente.codigo_cliente})`;
}

export function matchesDedicatedTenantSearch(cliente: Cliente, search: string): boolean {
  const normalized = search.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  if (cliente.razon_social.toLowerCase().includes(normalized)) {
    return true;
  }

  if (cliente.codigo_cliente.toLowerCase().includes(normalized)) {
    return true;
  }

  const nombreComercial = cliente.nombre_comercial?.trim();
  if (nombreComercial && nombreComercial.toLowerCase().includes(normalized)) {
    return true;
  }

  return false;
}

export function resolveDedicatedTenantDatabaseName(
  conexiones: { nombre_bd: string; es_conexion_principal: boolean; es_activo: boolean }[],
): string {
  const principal = conexiones.find(
    (conexion) => conexion.es_conexion_principal && conexion.es_activo,
  );
  if (principal?.nombre_bd) {
    return principal.nombre_bd;
  }

  const firstActive = conexiones.find((conexion) => conexion.es_activo);
  if (firstActive?.nombre_bd) {
    return firstActive.nombre_bd;
  }

  return '—';
}
