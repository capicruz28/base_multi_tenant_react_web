import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useDebounce } from '@/core/utils/debounce';
import { ERP_LIST_SEARCH_DEBOUNCE_MS } from '@/core/list/erp-list.constants';
import { iamSearchInputClass } from '@/features/admin/components/iam/iam-form-classes';

export interface ErpSearchInputProps {
  /** Valor controlado del input (inmediato). */
  value: string;
  onChange: (value: string) => void;
  /** Callback con valor debounced — usar para queryKey/API. */
  onDebouncedChange?: (debouncedValue: string) => void;
  debounceMs?: number;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  'aria-label'?: string;
}

/**
 * Búsqueda toolbar con debounce integrado (PERF-02).
 * Estilo alineado con IamSearchInput / SR-01.
 */
export function ErpSearchInput({
  value,
  onChange,
  onDebouncedChange,
  debounceMs = ERP_LIST_SEARCH_DEBOUNCE_MS,
  placeholder = 'Buscar…',
  disabled = false,
  id,
  className = '',
  'aria-label': ariaLabel = 'Buscar',
}: ErpSearchInputProps) {
  const debouncedValue = useDebounce(value, debounceMs);

  useEffect(() => {
    onDebouncedChange?.(debouncedValue.trim());
  }, [debouncedValue, onDebouncedChange]);

  return (
    <div className={`relative w-full ${className}`.trim()}>
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-soft pointer-events-none"
        aria-hidden
      />
      <input
        type="search"
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
        className={iamSearchInputClass}
      />
    </div>
  );
}
