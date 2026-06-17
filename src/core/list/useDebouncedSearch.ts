import { useCallback, useState } from 'react';
import { useDebounce } from '@/core/utils/debounce';
import { ERP_LIST_SEARCH_DEBOUNCE_MS } from './erp-list.constants';

export interface UseDebouncedSearchOptions {
  debounceMs?: number;
  initialValue?: string;
}

/**
 * Estado búsqueda con valor inmediato (input) y valor debounced (queryKey/API).
 */
export function useDebouncedSearch(options?: UseDebouncedSearchOptions) {
  const debounceMs = options?.debounceMs ?? ERP_LIST_SEARCH_DEBOUNCE_MS;
  const [inputValue, setInputValue] = useState(options?.initialValue ?? '');
  const debouncedValue = useDebounce(inputValue, debounceMs);

  const clear = useCallback(() => {
    setInputValue('');
  }, []);

  const hasSearch = debouncedValue.trim().length > 0;

  return {
    inputValue,
    setInputValue,
    debouncedValue: debouncedValue.trim(),
    hasSearch,
    clear,
  };
}
