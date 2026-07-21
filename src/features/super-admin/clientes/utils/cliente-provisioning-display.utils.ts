import { shouldUseDedicatedProvisioningFlow } from '../config/dedicated-provisioning.config';
import type { Cliente } from '../types/cliente.types';
import type { ClientProvisioningLocationState } from '../types/provisioning-page.types';
import type { ProvisioningState } from '../types/provisioning.types';

type ClienteProvisioningContext = Pick<
  Cliente,
  'tipo_instalacion' | 'provisioning_state' | 'nombre_comercial' | 'razon_social' | 'cliente_id'
>;

/** Superficies PR-D (badge, acción) — solo Dedicated con flag F4 activo. */
export function shouldShowDedicatedProvisioningSurfaces(
  cliente: Pick<Cliente, 'tipo_instalacion'>,
): boolean {
  return shouldUseDedicatedProvisioningFlow(cliente.tipo_instalacion);
}

/** Estado para badge — null si no aplica F4 o el backend no expone estado. */
export function getDedicatedProvisioningStateForDisplay(
  cliente: Pick<Cliente, 'tipo_instalacion' | 'provisioning_state'>,
): ProvisioningState | null {
  if (!shouldShowDedicatedProvisioningSurfaces(cliente)) {
    return null;
  }
  return cliente.provisioning_state ?? null;
}

/**
 * RN-UI-05 — Dedicated F4: login tenant solo cuando provisioning_state=ready.
 * Shared, legacy o flag off: comportamiento previo (siempre permitido).
 */
export function canEnterClientErp(
  cliente: Pick<Cliente, 'tipo_instalacion' | 'provisioning_state'>,
): boolean {
  if (!shouldUseDedicatedProvisioningFlow(cliente.tipo_instalacion)) {
    return true;
  }

  const state = cliente.provisioning_state;
  if (state === undefined || state === null) {
    return true;
  }

  return state === 'ready';
}

export function getClientErpEntryDisabledReason(
  cliente: Pick<Cliente, 'tipo_instalacion' | 'provisioning_state'>,
  options?: { isImpersonation?: boolean },
): string | undefined {
  if (options?.isImpersonation) {
    return 'Salga del modo soporte actual antes de entrar a otro cliente';
  }

  if (!shouldUseDedicatedProvisioningFlow(cliente.tipo_instalacion)) {
    return undefined;
  }

  const state = cliente.provisioning_state;
  if (state === 'provisioning') {
    return 'El tenant dedicated aún se está provisionando. Espere hasta que el estado sea operativo.';
  }
  if (state === 'failed') {
    return 'El provisioning falló. Use «Ver provisioning» para revisar o reintentar.';
  }

  return undefined;
}

export function buildClientProvisioningPath(clienteId: string): string {
  return `/super-admin/clientes/${clienteId}/provisioning`;
}

/** State mínimo para navegación desde listado/detalle — sin re-fetch de credenciales. */
export function buildClientProvisioningNavigationState(
  cliente: Pick<Cliente, 'nombre_comercial' | 'razon_social' | 'provisioning_state'>,
): ClientProvisioningLocationState {
  return {
    clienteLabel: cliente.nombre_comercial || cliente.razon_social,
    provisioning_state: cliente.provisioning_state ?? undefined,
  };
}

export function navigateToClientProvisioning(
  cliente: ClienteProvisioningContext,
  navigate: (path: string, options?: { state?: ClientProvisioningLocationState }) => void,
): void {
  navigate(buildClientProvisioningPath(cliente.cliente_id), {
    state: buildClientProvisioningNavigationState(cliente),
  });
}
