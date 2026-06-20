import { IamSearchInput } from '@/features/admin/components/iam';
import {
  usePlatformCatalogFkOptions,
  type PlatformCatalogFkOptionEntityId,
} from '../hooks/usePlatformCatalogFkOptions';
import type { PlatformCatalogFkScope } from '../types/platform-catalog.types';

const selectClass =
  'w-full px-3 py-2 border border-border-base rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-surface dark:bg-subtle dark:text-text-base text-sm disabled:opacity-50 disabled:cursor-not-allowed';

export interface PlatformCatalogFkSelectProps {
  entityId: PlatformCatalogFkOptionEntityId;
  value: string | null;
  onChange: (value: string | null) => void;
  scope?: PlatformCatalogFkScope;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
}

/**
 * FA-001 WP-05 — Combobox FK async (Scope Freeze §9.1).
 * Consume únicamente usePlatformCatalogFkOptions().
 */
export function PlatformCatalogFkSelect({
  entityId,
  value,
  onChange,
  scope = {},
  placeholder = '—',
  disabled = false,
  allowClear = true,
}: PlatformCatalogFkSelectProps) {
  const { options, isLoading, search } = usePlatformCatalogFkOptions(entityId, scope);

  const isScopeBlocked =
    (entityId === 'departamento' && !scope.paisId) ||
    (entityId === 'provincia' && !scope.departamentoId);

  const selectDisabled = disabled || isLoading || isScopeBlocked;

  return (
    <div className="flex flex-col gap-1 w-full min-w-[12rem] max-w-xs shrink-0">
      <IamSearchInput
        value={search.inputValue}
        onChange={search.setInputValue}
        placeholder="Buscar..."
        disabled={selectDisabled}
        aria-label={`Buscar ${entityId}`}
        className="w-full"
      />
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? e.target.value : null)}
        disabled={selectDisabled}
        className={selectClass}
        aria-label={placeholder}
      >
        {allowClear ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.subLabel ? `${option.label} (${option.subLabel})` : option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
