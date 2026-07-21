/**
 * Banner de secuencia bloqueada (config_locked).
 */

export interface CfgLockedBannerProps {
  className?: string;
}

export function CfgLockedBanner({ className = '' }: CfgLockedBannerProps) {
  return (
    <div
      role="status"
      className={`rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning ${className}`.trim()}
    >
      Esta secuencia está bloqueada y no se puede modificar.
    </div>
  );
}
