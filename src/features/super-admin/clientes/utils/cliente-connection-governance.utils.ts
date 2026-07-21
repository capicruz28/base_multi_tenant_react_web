import { shouldUseDedicatedProvisioningFlow } from '../config/dedicated-provisioning.config';
import type { Cliente } from '../types/cliente.types';
import type { Conexion } from '../types/conexion.types';
import type { ProvisioningState } from '../types/provisioning.types';

export type ConnectionCreateMode = 'standard' | 'repair';

export const DEDICATED_PROVISIONING_CONNECTION_BANNER =
  'El provisioning F4 crea automáticamente la conexión principal del tenant dedicated durante la saga. No utilice creación manual en el onboarding estándar.';

export const DEDICATED_CONNECTION_REPAIR_WARNING =
  'Este flujo no forma parte del onboarding estándar Dedicated. Utilícelo únicamente para reparación, recuperación o escenarios administrativos.';

export const DEDICATED_CONNECTION_PROVISIONING_EMPTY_HINT =
  'La conexión principal se registrará automáticamente cuando el provisioning avance.';

type ConexionPrincipalRef = Pick<Conexion, 'es_conexion_principal' | 'es_activo'>;

/** Gobernanza F4 en pestaña conexiones — Dedicated + flag activo. */
export function usesDedicatedConnectionF4Governance(
  tipoInstalacion: Cliente['tipo_instalacion'],
): boolean {
  return shouldUseDedicatedProvisioningFlow(tipoInstalacion);
}

/** Acción estándar «Nueva conexión» — Shared, legacy o flag off. */
export function shouldShowStandardCreateConnectionAction(
  tipoInstalacion: Cliente['tipo_instalacion'],
): boolean {
  return !usesDedicatedConnectionF4Governance(tipoInstalacion);
}

export function shouldShowDedicatedProvisioningConnectionBanner(
  tipoInstalacion: Cliente['tipo_instalacion'],
): boolean {
  return usesDedicatedConnectionF4Governance(tipoInstalacion);
}

function hasActivePrincipalConnection(conexiones: ConexionPrincipalRef[]): boolean {
  return conexiones.some((c) => c.es_conexion_principal && c.es_activo);
}

/**
 * Repair ops §8.5 — solo Dedicated F4 cuando no hay conexión principal activa
 * y el tenant no está en provisioning (saga en curso).
 */
export function shouldShowDedicatedConnectionRepairAction(
  tipoInstalacion: Cliente['tipo_instalacion'],
  provisioningState: ProvisioningState | null | undefined,
  conexiones: ConexionPrincipalRef[],
): boolean {
  if (!usesDedicatedConnectionF4Governance(tipoInstalacion)) {
    return false;
  }

  if (provisioningState === 'provisioning') {
    return false;
  }

  return !hasActivePrincipalConnection(conexiones);
}

export function resolveConnectionCreateMode(
  tipoInstalacion: Cliente['tipo_instalacion'],
): ConnectionCreateMode {
  return usesDedicatedConnectionF4Governance(tipoInstalacion) ? 'repair' : 'standard';
}
