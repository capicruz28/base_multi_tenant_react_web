import type { SessionTerminationSeverity } from '@/core/auth/session/session-termination-reason';

const SEVERITY_CLASSES: Readonly<Record<SessionTerminationSeverity, string>> = {
	error: 'text-error bg-error/10 border-error/30',
	warning: 'text-warning bg-warning/10 border-warning/30',
	info: 'text-info bg-info/10 border-info/30',
};

export interface LoginSessionTerminationBannerProps {
	message: string;
	severity: SessionTerminationSeverity;
}

export function LoginSessionTerminationBanner({
	message,
	severity,
}: LoginSessionTerminationBannerProps) {
	return (
		<div
			role="alert"
			className={`rounded-md border px-4 py-3 text-sm ${SEVERITY_CLASSES[severity]}`}
		>
			{message}
		</div>
	);
}
