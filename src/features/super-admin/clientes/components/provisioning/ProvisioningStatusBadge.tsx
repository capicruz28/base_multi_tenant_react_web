import type { ProvisioningState } from '../../types/provisioning.types';

export interface ProvisioningStatusBadgeProps {
  state: ProvisioningState | null | undefined;
}

const STATE_STYLES: Record<ProvisioningState, string> = {
  provisioning: 'bg-info/10 text-info',
  ready: 'bg-success/10 text-success',
  failed: 'bg-error/10 text-error',
};

const STATE_LABELS: Record<ProvisioningState, string> = {
  provisioning: 'Provisionando',
  ready: 'Operativo',
  failed: 'Fallido',
};

export function ProvisioningStatusBadge({ state }: ProvisioningStatusBadgeProps) {
  if (!state) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATE_STYLES[state]}`}
    >
      {STATE_LABELS[state]}
    </span>
  );
}
