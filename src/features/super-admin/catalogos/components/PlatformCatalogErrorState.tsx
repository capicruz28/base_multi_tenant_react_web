import { Button } from '@/shared/components/ui/button';

export interface PlatformCatalogErrorStateProps {
  message: string;
  onRetry: () => void;
  disabled?: boolean;
}

/**
 * FA-001 WP-05 — Error inline de listado (Scope Freeze §9.1).
 * Sin toast; la página compone mensaje vía getErrorMessage.
 */
export function PlatformCatalogErrorState({
  message,
  onRetry,
  disabled = false,
}: PlatformCatalogErrorStateProps) {
  return (
    <div className="rounded-lg border border-border-base bg-surface p-6">
      <p className="text-error bg-error/10 p-4 rounded-lg mb-4">{message}</p>
      <Button
        type="button"
        variant="outline"
        onClick={onRetry}
        disabled={disabled}
        className="border-border-base text-text-base hover:bg-overlay"
      >
        Reintentar
      </Button>
    </div>
  );
}
