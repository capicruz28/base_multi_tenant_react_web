import { CheckCircle, Circle, Loader, MinusCircle, XCircle } from 'lucide-react';

import type { ProvisioningStepCode, ProvisioningStepStatus } from '../../types/provisioning.types';
import { getProvisioningStepLabel } from './provisioning-step-labels';

export interface ProvisioningStepItemProps {
  code: ProvisioningStepCode;
  status: ProvisioningStepStatus;
  isCurrent: boolean;
}

function StepIcon({ status }: { status: ProvisioningStepStatus }) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-5 w-5 text-success shrink-0" aria-hidden />;
    case 'running':
      return <Loader className="h-5 w-5 text-brand-primary animate-spin shrink-0" aria-hidden />;
    case 'failed':
      return <XCircle className="h-5 w-5 text-error shrink-0" aria-hidden />;
    case 'skipped':
      return <MinusCircle className="h-5 w-5 text-text-faint shrink-0" aria-hidden />;
    default:
      return <Circle className="h-5 w-5 text-text-faint shrink-0" aria-hidden />;
  }
}

export function ProvisioningStepItem({ code, status, isCurrent }: ProvisioningStepItemProps) {
  return (
    <li
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${
        isCurrent
          ? 'border-brand-primary bg-brand-primary/5'
          : 'border-border-base bg-surface'
      }`}
    >
      <StepIcon status={status} />
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-medium ${
            isCurrent ? 'text-brand-primary' : 'text-text-base'
          }`}
        >
          {getProvisioningStepLabel(code)}
        </p>
        <p className="text-xs text-text-soft capitalize mt-0.5">{status}</p>
      </div>
    </li>
  );
}
