import type {
  DedicatedProvisioningStatusRead,
  ProvisioningStepCode,
  ProvisioningStepRead,
  ProvisioningStepStatus,
} from '../../types/provisioning.types';
import { ProvisioningStepItem } from './ProvisioningStepItem';
import { PROVISIONING_STEP_ORDER } from './provisioning-step-labels';

function resolveStepStatus(
  code: ProvisioningStepCode,
  steps: ProvisioningStepRead[],
  currentStep: ProvisioningStepCode | null,
): ProvisioningStepStatus {
  const fromApi = steps.find((step) => step.code === code);
  if (fromApi) {
    return fromApi.status;
  }
  if (currentStep === code) {
    return 'running';
  }
  return 'pending';
}

export interface ProvisioningTimelineProps {
  status: DedicatedProvisioningStatusRead;
}

export function ProvisioningTimeline({ status }: ProvisioningTimelineProps) {
  const completedCount = PROVISIONING_STEP_ORDER.filter((code) => {
    const stepStatus = resolveStepStatus(code, status.steps, status.current_step);
    return stepStatus === 'completed' || stepStatus === 'skipped';
  }).length;

  const progressPercent = Math.round((completedCount / PROVISIONING_STEP_ORDER.length) * 100);

  return (
    <section
      className="bg-surface border border-border-base rounded-lg shadow-sm p-6"
      aria-label="Progreso del provisioning"
    >
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-base font-semibold text-text-base">Progreso del provisioning</h2>
        <span className="text-sm text-text-soft">{progressPercent}%</span>
      </div>

      <div className="h-2 w-full rounded-full bg-subtle mb-6 overflow-hidden">
        <div
          className="h-full bg-brand-primary transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      <ol className="space-y-2">
        {PROVISIONING_STEP_ORDER.map((code) => (
          <ProvisioningStepItem
            key={code}
            code={code}
            status={resolveStepStatus(code, status.steps, status.current_step)}
            isCurrent={status.current_step === code}
          />
        ))}
      </ol>
    </section>
  );
}
