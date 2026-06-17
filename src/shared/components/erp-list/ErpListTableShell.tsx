import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { InvTableSkeleton } from '@/features/inv/components/InvTableSkeleton';
import { IamTableEmptyState } from '@/features/admin/components/iam/IamTableEmptyState';

export interface ErpListTableShellProps {
  colSpan: number;
  loading: boolean;
  error: Error | null | string;
  isEmpty: boolean;
  hasSearch?: boolean;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  emptyActionDisabled?: boolean;
  skeletonRows?: number;
  children: ReactNode;
  errorMessage?: string;
}

function resolveErrorMessage(error: Error | null | string, fallback?: string): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error && error.message) return error.message;
  return fallback ?? 'No se pudo cargar el listado.';
}

/**
 * Shell tabla: skeleton (SK-01) + error + empty (ES-01) + children (markup tabla).
 */
export function ErpListTableShell({
  colSpan,
  loading,
  error,
  isEmpty,
  hasSearch = false,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  emptyActionDisabled = false,
  skeletonRows,
  children,
  errorMessage,
}: ErpListTableShellProps) {
  if (loading) {
    return <InvTableSkeleton columns={colSpan} rows={skeletonRows} />;
  }

  if (error) {
    return (
      <p className="text-sm text-error py-4" role="alert">
        {resolveErrorMessage(error, errorMessage)}
      </p>
    );
  }

  if (isEmpty) {
    return (
      <div className="overflow-x-auto rounded-lg border border-border-base shadow">
        <table className="min-w-full divide-y divide-border-base">
          <tbody className="bg-surface">
            <IamTableEmptyState
              colSpan={colSpan}
              icon={emptyIcon}
              title={hasSearch ? 'Sin resultados para la búsqueda' : emptyTitle}
              description={
                hasSearch
                  ? 'Prueba con otros términos o limpia los filtros.'
                  : emptyDescription
              }
              actionLabel={hasSearch ? undefined : emptyActionLabel}
              onAction={hasSearch ? undefined : onEmptyAction}
              actionDisabled={emptyActionDisabled}
            />
          </tbody>
        </table>
      </div>
    );
  }

  return <>{children}</>;
}
