import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { useDebouncedSearch } from '@/core/list';
import { useUsersList } from '@/features/admin/hooks/useUsersList';

export interface ActiveSessionsUserFilterProps {
  value: string | undefined;
  onChange: (usuarioId: string | undefined) => void;
  onSelectedUserLabelChange?: (label: string | null) => void;
  disabled?: boolean;
}

export function formatUserOptionLabel(user: {
  nombre_usuario: string;
  nombre?: string | null;
  apellido?: string | null;
}): string {
  const full = `${user.nombre ?? ''} ${user.apellido ?? ''}`.trim();
  return full ? `${user.nombre_usuario} — ${full}` : user.nombre_usuario;
}

const comboboxInputClass =
  'w-full rounded-md border border-border-base bg-surface py-2 pl-3 pr-8 text-sm text-text-base shadow-sm focus:border-brand-primary focus:outline-none focus:ring-brand-primary disabled:cursor-not-allowed disabled:opacity-50';

/** Filtro admin por `usuario_id` — combobox único (consolidación toolbar UX). */
export function ActiveSessionsUserFilter({
  value,
  onChange,
  onSelectedUserLabelChange,
  disabled = false,
}: ActiveSessionsUserFilterProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const userSearch = useDebouncedSearch({ debounceMs: 350 });
  const { clear: clearUserSearch } = userSearch;

  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');

  const usersList = useUsersList({
    debouncedSearch: userSearch.debouncedValue || undefined,
    activeFilter: 'active',
    enabled: !disabled,
    initialLimit: 50,
  });

  useEffect(() => {
    if (value === undefined) {
      setSelectedLabel('');
      clearUserSearch();
      onSelectedUserLabelChange?.(null);
    }
  }, [value, clearUserSearch, onSelectedUserLabelChange]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        if (value === undefined) {
          clearUserSearch();
        }
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open, value, clearUserSearch]);

  const handleSelect = (usuarioId: string | undefined, label: string) => {
    onChange(usuarioId);
    setSelectedLabel(label);
    onSelectedUserLabelChange?.(usuarioId ? label : null);
    setOpen(false);
    userSearch.clear();
  };

  const inputValue = open || userSearch.inputValue.length > 0 ? userSearch.inputValue : selectedLabel;

  return (
    <div
      ref={containerRef}
      className="relative w-52 min-w-[12rem] max-w-xs shrink-0"
    >
      <label htmlFor={listboxId} className="sr-only">
        Filtrar por usuario
      </label>
      <div className="relative">
        <input
          id={listboxId}
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${listboxId}-listbox`}
          aria-autocomplete="list"
          value={inputValue}
          onChange={(event) => {
            userSearch.setInputValue(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Filtrar por usuario…"
          disabled={disabled}
          className={comboboxInputClass}
          autoComplete="off"
        />
        <ChevronDown
          className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-text-soft"
          aria-hidden
        />
      </div>

      {open && !disabled ? (
        <ul
          id={`${listboxId}-listbox`}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border-base bg-surface py-1 shadow-sm"
        >
          <li role="presentation">
            <button
              type="button"
              role="option"
              aria-selected={value === undefined}
              className="w-full px-3 py-2 text-left text-sm text-text-base hover:bg-overlay"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleSelect(undefined, '')}
            >
              Todos los usuarios
            </button>
          </li>
          {usersList.isLoading ? (
            <li className="px-3 py-2 text-sm text-text-soft">Cargando usuarios…</li>
          ) : null}
          {usersList.items.map((user) => {
            const label = formatUserOptionLabel(user);
            return (
              <li key={user.usuario_id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={value === user.usuario_id}
                  className="w-full px-3 py-2 text-left text-sm text-text-base hover:bg-overlay"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelect(user.usuario_id, label)}
                >
                  {label}
                </button>
              </li>
            );
          })}
          {!usersList.isLoading && usersList.items.length === 0 ? (
            <li className="px-3 py-2 text-sm text-text-soft">Sin usuarios coincidentes</li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
