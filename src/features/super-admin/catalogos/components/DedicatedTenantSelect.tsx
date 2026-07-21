import { useMemo } from 'react';
import Select, { type FilterOptionOption, type StylesConfig } from 'react-select';
import type { Cliente } from '@/features/super-admin/clientes/types/cliente.types';
import {
  formatDedicatedTenantOptionLabel,
  matchesDedicatedTenantSearch,
} from '../utils/dedicated-tenant-select.utils';

export interface DedicatedTenantOption {
  value: string;
  label: string;
  cliente: Cliente;
}

export interface DedicatedTenantSelectProps {
  clientes: Cliente[];
  value: string;
  onChange: (clienteId: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
}

const dedicatedTenantSelectStyles: StylesConfig<DedicatedTenantOption, false> = {
  control: (provided, state) => ({
    ...provided,
    minHeight: '2.5rem',
    backgroundColor: 'var(--bg-surface)',
    borderColor: state.isFocused ? 'var(--color-info)' : 'var(--border-default)',
    boxShadow: state.isFocused ? '0 0 0 2px color-mix(in srgb, var(--color-info) 25%, transparent)' : 'none',
    '&:hover': {
      borderColor: state.isFocused ? 'var(--color-info)' : 'var(--border-default)',
    },
    color: 'var(--text-primary)',
  }),
  input: (provided) => ({
    ...provided,
    color: 'var(--text-primary)',
  }),
  singleValue: (provided) => ({
    ...provided,
    color: 'var(--text-primary)',
  }),
  placeholder: (provided) => ({
    ...provided,
    color: 'var(--text-muted)',
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-default)',
    zIndex: 50,
  }),
  menuList: (provided) => ({
    ...provided,
    maxHeight: '240px',
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? 'color-mix(in srgb, var(--color-info) 18%, var(--bg-surface))'
      : state.isFocused
        ? 'var(--bg-overlay)'
        : 'var(--bg-surface)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
  }),
  noOptionsMessage: (provided) => ({
    ...provided,
    color: 'var(--text-secondary)',
  }),
  loadingMessage: (provided) => ({
    ...provided,
    color: 'var(--text-secondary)',
  }),
};

function filterDedicatedTenantOption(
  option: FilterOptionOption<DedicatedTenantOption>,
  inputValue: string,
): boolean {
  return matchesDedicatedTenantSearch(option.data.cliente, inputValue);
}

/**
 * Autocomplete searchable para tenants Dedicated (react-select).
 */
export function DedicatedTenantSelect({
  clientes,
  value,
  onChange,
  isLoading = false,
  disabled = false,
  placeholder = 'Buscar tenant Dedicated...',
  id,
}: DedicatedTenantSelectProps) {
  const options = useMemo<DedicatedTenantOption[]>(
    () =>
      clientes.map((cliente) => ({
        value: cliente.cliente_id,
        label: formatDedicatedTenantOptionLabel(cliente),
        cliente,
      })),
    [clientes],
  );

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  );

  return (
    <Select<DedicatedTenantOption, false>
      inputId={id}
      options={options}
      value={selectedOption}
      onChange={(option) => onChange(option?.value ?? '')}
      placeholder={placeholder}
      isClearable
      isSearchable
      isLoading={isLoading}
      isDisabled={disabled || isLoading}
      filterOption={filterDedicatedTenantOption}
      styles={dedicatedTenantSelectStyles}
      classNamePrefix="dedicated-tenant-select"
      menuPlacement="auto"
      noOptionsMessage={() => 'No se encontraron tenants Dedicated'}
      loadingMessage={() => 'Cargando clientes…'}
    />
  );
}
