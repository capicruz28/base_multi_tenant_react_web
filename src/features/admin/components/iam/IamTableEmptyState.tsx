import type { LucideIcon } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

export interface IamTableEmptyStateProps {
  colSpan: number;
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
}

/**
 * Empty state tabular alineado con patrón ORG (icono + texto + CTA opcional).
 */
export function IamTableEmptyState({
  colSpan,
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionDisabled = false,
}: IamTableEmptyStateProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center">
        <Icon className="h-12 w-12 mx-auto mb-3 text-text-soft opacity-70" aria-hidden />
        <p className="text-sm font-medium text-text-soft mb-1">{title}</p>
        {description ? (
          <p className="text-xs text-text-faint mb-2 max-w-md mx-auto">{description}</p>
        ) : null}
        {actionLabel && onAction ? (
          <Button
            type="button"
            size="sm"
            onClick={onAction}
            disabled={actionDisabled}
            className="mt-2 bg-brand-primary hover:bg-brand-primary-hover text-white"
          >
            {actionLabel}
          </Button>
        ) : null}
      </td>
    </tr>
  );
}
