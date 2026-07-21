import type { ProvisioningStepCode } from '../../types/provisioning.types';

/** Orden canónico saga S1→S10 — contrato UI §5. */
export const PROVISIONING_STEP_ORDER: ProvisioningStepCode[] = [
  'registry',
  'storage_allocation',
  'create_database',
  'apply_schema_erp',
  'apply_schema_rbac',
  'apply_catalogs',
  'seed_tenant',
  'register_metadata',
  'activate_routing',
  'mark_ready',
];

const STEP_LABELS: Record<ProvisioningStepCode, string> = {
  registry: 'Registro tenant',
  storage_allocation: 'Asignación almacén',
  create_database: 'Creación base de datos',
  apply_schema_erp: 'Esquema ERP',
  apply_schema_rbac: 'Esquema RBAC dedicated',
  apply_catalogs: 'Catálogos',
  seed_tenant: 'Datos iniciales tenant',
  register_metadata: 'Registro conexión',
  activate_routing: 'Activación routing',
  mark_ready: 'Tenant Ready',
};

export function getProvisioningStepLabel(code: ProvisioningStepCode): string {
  return STEP_LABELS[code];
}
