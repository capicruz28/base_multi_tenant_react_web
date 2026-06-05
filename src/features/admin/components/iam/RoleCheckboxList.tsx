import { useMemo, useState } from 'react';
import { Checkbox } from '@/shared/components/ui/checkbox';
import type { Rol } from '../../types/rol.types';
import { IamSearchInput } from './IamSearchInput';

export interface RoleCheckboxListProps {
  roles: Rol[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

function resolveRoleSubtitle(role: Rol): string {
  if (role.descripcion?.trim()) return role.descripcion.trim();
  if (role.codigo_rol?.trim()) return role.codigo_rol.trim();
  return 'Sin descripción';
}

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

function roleMatchesSearch(role: Rol, query: string): boolean {
  if (!query) return true;
  const haystack = [role.nombre, role.descripcion, role.codigo_rol]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
}

/**
 * Selección de perfiles (roles) con checkboxes, búsqueda y descripción.
 */
export function RoleCheckboxList({
  roles,
  selectedIds,
  onChange,
  disabled = false,
  searchPlaceholder = 'Buscar perfil…',
  emptyMessage = 'No hay perfiles disponibles.',
}: RoleCheckboxListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const query = normalizeSearch(searchTerm);

  const filteredRoles = useMemo(
    () => roles.filter((role) => roleMatchesSearch(role, query)),
    [roles, query],
  );

  const selectedCount = selectedIds.length;

  const toggleRole = (rolId: string, checked: boolean) => {
    if (disabled) return;
    if (checked) {
      if (!selectedIds.includes(rolId)) {
        onChange([...selectedIds, rolId]);
      }
      return;
    }
    onChange(selectedIds.filter((id) => id !== rolId));
  };

  return (
    <div className="space-y-2">
      <IamSearchInput
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder={searchPlaceholder}
        disabled={disabled || roles.length === 0}
        aria-label="Buscar perfil"
      />

      <div
        className="max-h-48 overflow-y-auto border border-border-base rounded-md p-2 bg-surface space-y-1"
        role="group"
        aria-label="Perfiles disponibles"
      >
        {roles.length === 0 ? (
          <p className="text-sm text-text-soft text-center py-4">{emptyMessage}</p>
        ) : filteredRoles.length === 0 ? (
          <p className="text-sm text-text-soft text-center py-4">
            No se encontraron perfiles que coincidan con la búsqueda.
          </p>
        ) : (
          filteredRoles.map((role) => {
            const checked = selectedIds.includes(role.rol_id);
            const inputId = `iam-role-${role.rol_id}`;
            return (
              <div
                key={role.rol_id}
                className="flex items-start gap-3 rounded-md px-2 py-2 hover:bg-overlay/50 transition-colors"
              >
                <Checkbox
                  id={inputId}
                  checked={checked}
                  onCheckedChange={(value) => toggleRole(role.rol_id, value === true)}
                  disabled={disabled}
                  aria-label={`Perfil ${role.nombre}`}
                  className="mt-0.5"
                />
                <label htmlFor={inputId} className="flex-1 cursor-pointer min-w-0">
                  <span className="block text-sm font-medium text-text-base">{role.nombre}</span>
                  <span className="block text-sm text-text-soft line-clamp-2">
                    {resolveRoleSubtitle(role)}
                  </span>
                </label>
              </div>
            );
          })
        )}
      </div>

      <p className="text-xs text-text-soft" aria-live="polite">
        {selectedCount === 0
          ? 'Ningún perfil seleccionado'
          : selectedCount === 1
            ? '1 perfil seleccionado'
            : `${selectedCount} perfiles seleccionados`}
      </p>
    </div>
  );
}
