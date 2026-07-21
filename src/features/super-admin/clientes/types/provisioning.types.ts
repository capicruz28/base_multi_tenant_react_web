/**
 * Tipos F4 — Dedicated Provisioning (Super Admin)
 * Alineados con DEDICATED_PROVISIONING_API_CONTRACT.md
 */

export type ProvisioningState = 'provisioning' | 'ready' | 'failed';

export type ProvisioningStepCode =
  | 'registry'
  | 'storage_allocation'
  | 'create_database'
  | 'apply_schema_erp'
  | 'apply_schema_rbac'
  | 'apply_catalogs'
  | 'seed_tenant'
  | 'register_metadata'
  | 'activate_routing'
  | 'mark_ready';

export type ProvisioningStepStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped';

export interface ProvisioningStepRead {
  code: ProvisioningStepCode;
  status: ProvisioningStepStatus;
  started_at: string | null;
  completed_at: string | null;
}

export interface DedicatedProvisioningStatusRead {
  cliente_id: string;
  provisioning_state: ProvisioningState;
  provisioning_run_id: string;
  current_step: ProvisioningStepCode | null;
  steps: ProvisioningStepRead[];
  started_at: string;
  updated_at: string;
  ready_at: string | null;
  failed_at: string | null;
  last_error_code: string | null;
  last_error_message: string | null;
  retry_allowed: boolean;
  abort_allowed: boolean;
}

/** Objeto aditivo en respuesta 201 POST /clientes/ (Dedicated F4). */
export interface ProvisioningInfoRead {
  status_url: string;
  estimated_duration_seconds?: number;
}

export interface ProvisioningRetryResponse {
  success: boolean;
  message: string;
  provisioning_run_id: string;
  provisioning_state: ProvisioningState;
}

export interface ProvisioningAbortResponse {
  success: boolean;
  message: string;
  provisioning_state: ProvisioningState;
  cleanup_checklist_url: string | null;
}
