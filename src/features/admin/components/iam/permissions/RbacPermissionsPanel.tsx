import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ChevronDown, Loader } from 'lucide-react';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Button } from '@/shared/components/ui/button';
import type { PermisoCatalogoItem } from '../../../types/permisos-negocio.types';
import { groupFilteredPermisoCatalog } from '../../../utils/permiso-catalog-groups';
import { IamSearchInput } from '../IamSearchInput';
import { getPermisoIdFromCatalogItem } from './permiso-id.utils';

export interface RbacPermissionsPanelProps {
  catalogo: PermisoCatalogoItem[];
  selectedPermisoIds: string[];
  loading: boolean;
  error: string | null;
  disabled: boolean;
  onTogglePermiso: (permisoId: string) => void;
  onSetPermisoIds: (ids: string[]) => void;
}

export function RbacPermissionsPanel({
  catalogo,
  selectedPermisoIds,
  loading,
  error,
  disabled,
  onTogglePermiso,
  onSetPermisoIds,
}: RbacPermissionsPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const groups = useMemo(
    () => groupFilteredPermisoCatalog(catalogo, searchTerm),
    [catalogo, searchTerm],
  );

  const hasSearch = searchTerm.trim().length > 0;

  useEffect(() => {
    if (!hasSearch) return;
    setCollapsedGroups({});
  }, [hasSearch, searchTerm]);

  const toggleGroupCollapsed = (key: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isGroupCollapsed = (key: string) => {
    if (hasSearch) return false;
    return collapsedGroups[key] ?? false;
  };

  const countSelectedInGroup = (items: PermisoCatalogoItem[]) => {
    const ids = items.map(getPermisoIdFromCatalogItem).filter(Boolean);
    return ids.filter((id) => selectedPermisoIds.includes(id)).length;
  };

  const selectAllInGroup = (items: PermisoCatalogoItem[]) => {
    const ids = items.map(getPermisoIdFromCatalogItem).filter(Boolean);
    onSetPermisoIds([...new Set([...selectedPermisoIds, ...ids])]);
  };

  const clearAllInGroup = (items: PermisoCatalogoItem[]) => {
    const remove = new Set(items.map(getPermisoIdFromCatalogItem).filter(Boolean));
    onSetPermisoIds(selectedPermisoIds.filter((id) => !remove.has(id)));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader className="animate-spin h-8 w-8 text-brand-primary" />
        <p className="ml-3 text-text-soft">Cargando acciones disponibles…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-error/30 bg-error/10 p-4 text-sm text-error">
        <div className="flex gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" aria-hidden />
          <div>
            <p>{error}</p>
            <p className="mt-2 text-xs text-text-soft">
              Si necesita editar acciones de este perfil, solicite a soporte los permisos de administración
              de roles en su cuenta.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (catalogo.length === 0) {
    return (
      <p className="text-center text-text-soft py-8 text-sm">No hay acciones disponibles en el catálogo.</p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-text-soft">
        Defina qué operaciones puede ejecutar este perfil en el sistema (API). Agrupadas por recurso o módulo.
      </p>
      <IamSearchInput
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Buscar acción por nombre o código…"
        disabled={disabled}
        aria-label="Buscar acciones"
      />
      {groups.length === 0 ? (
        <p className="text-center text-text-soft py-6 text-sm">
          No hay acciones que coincidan con la búsqueda.
        </p>
      ) : (
        <div className="max-h-[50vh] overflow-y-auto border border-border-base rounded-lg divide-y divide-border-base bg-subtle/30">
          {groups.map((group) => {
            const collapsed = isGroupCollapsed(group.key);
            const selectedCount = countSelectedInGroup(group.items);
            return (
              <div key={group.key} className="bg-surface">
                <div className="flex items-center gap-2 px-3 py-2 bg-subtle/50">
                  <button
                    type="button"
                    onClick={() => toggleGroupCollapsed(group.key)}
                    className="flex flex-1 items-center gap-2 text-left min-w-0"
                    aria-expanded={!collapsed}
                  >
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-text-soft transition-transform ${collapsed ? '' : 'rotate-180'}`}
                      aria-hidden
                    />
                    <span className="text-sm font-semibold text-text-base truncate">{group.label}</span>
                    <span className="text-xs text-text-soft shrink-0">
                      {selectedCount}/{group.items.length}
                    </span>
                  </button>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      disabled={disabled}
                      onClick={() => selectAllInGroup(group.items)}
                    >
                      Todas
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      disabled={disabled}
                      onClick={() => clearAllInGroup(group.items)}
                    >
                      Ninguna
                    </Button>
                  </div>
                </div>
                {!collapsed ? (
                  <div className="px-3 pb-2 space-y-1">
                    {group.items.map((perm) => {
                      const pid = getPermisoIdFromCatalogItem(perm);
                      return (
                        <div key={pid || perm.codigo} className="flex items-start gap-3 py-1.5 pl-1">
                          <Checkbox
                            id={`negocio-${pid}`}
                            checked={!!pid && selectedPermisoIds.includes(pid)}
                            onCheckedChange={() => pid && onTogglePermiso(pid)}
                            disabled={disabled || !pid}
                            aria-label={perm.nombre ?? perm.codigo}
                            className="mt-0.5"
                          />
                          <label htmlFor={`negocio-${pid}`} className="text-sm text-text-base cursor-pointer flex-1">
                            <span className="font-medium">{perm.nombre ?? perm.codigo}</span>
                            {perm.codigo && perm.nombre !== perm.codigo ? (
                              <span className="block text-xs text-text-soft font-mono mt-0.5">{perm.codigo}</span>
                            ) : null}
                            {perm.descripcion ? (
                              <span className="block text-xs text-text-faint mt-0.5">{perm.descripcion}</span>
                            ) : null}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
