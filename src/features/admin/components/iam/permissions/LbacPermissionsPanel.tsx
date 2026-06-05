import { useMemo } from 'react';
import { AlertCircle, Folder, Loader, Package } from 'lucide-react';
import { Checkbox } from '@/shared/components/ui/checkbox';
import type { PermissionState } from '../../../types/permission.types';
import type { SidebarMenuItem } from '../../../types/menu.types';
import { getIcon } from '@/shared/lib/icon-utils';
import { IamSearchInput } from '../IamSearchInput';
import { filterHierarchicalByMenuSearch } from './role-permissions-menu.utils';
import type { HierarchicalStructure } from './role-permissions.types';

export interface LbacPermissionsPanelProps {
  hierarchicalStructure: HierarchicalStructure[];
  permissions: PermissionState;
  loading: boolean;
  structureError: string | null;
  permissionsError: string | null;
  disabled: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onViewPermissionChange: (menuId: string, checked: boolean) => void;
}

function renderMenuNode(
  node: SidebarMenuItem,
  level: number,
  permissions: PermissionState,
  disabled: boolean,
  onViewPermissionChange: (menuId: string, checked: boolean) => void,
): JSX.Element {
  const nodePermissions = permissions[node.menu_id] || {
    ver: false,
    crear: false,
    editar: false,
    eliminar: false,
  };
  const indentClass = level > 0 ? 'pl-3 border-l border-border-base ml-2' : '';

  return (
    <div key={node.menu_id} className={`py-1 ${indentClass}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-sm text-text-base">{node.nombre}</span>
        <Checkbox
          id={`perm-${node.menu_id}-ver`}
          checked={nodePermissions.ver}
          onCheckedChange={(checked) => onViewPermissionChange(node.menu_id, checked === true)}
          disabled={disabled}
          aria-label={`Ver pantalla ${node.nombre}`}
        />
      </div>
      {node.children.length > 0 ? (
        <div className="mt-1 space-y-0.5">
          {node.children.map((child) =>
            renderMenuNode(child, level + 1, permissions, disabled, onViewPermissionChange),
          )}
        </div>
      ) : null}
    </div>
  );
}

export function LbacPermissionsPanel({
  hierarchicalStructure,
  permissions,
  loading,
  structureError,
  permissionsError,
  disabled,
  searchTerm,
  onSearchChange,
  onViewPermissionChange,
}: LbacPermissionsPanelProps) {
  const filteredStructure = useMemo(
    () => filterHierarchicalByMenuSearch(hierarchicalStructure, searchTerm),
    [hierarchicalStructure, searchTerm],
  );

  const panelDisabled = disabled || Boolean(structureError) || Boolean(permissionsError);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader className="animate-spin h-8 w-8 text-brand-primary" />
        <p className="ml-3 text-text-soft">Cargando pantallas del menú…</p>
      </div>
    );
  }

  if (structureError) {
    return (
      <div className="rounded-md border border-error/30 bg-error/10 p-4 text-sm text-error flex gap-2">
        <AlertCircle className="h-5 w-5 shrink-0" aria-hidden />
        <p>{structureError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-info/30 bg-info/10 px-3 py-2 text-xs text-text-soft">
        <strong className="text-text-base">Solo visibilidad.</strong> Aquí define si el perfil{' '}
        <strong>ve</strong> cada pantalla en el menú. Las operaciones (crear, editar, eliminar) se
        configuran en la pestaña <strong>Acciones</strong>. Los permisos de crear en pantalla no se
        editan desde esta vista.
      </div>

      {permissionsError ? (
        <div className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-text-base flex gap-2">
          <AlertCircle className="h-5 w-5 shrink-0 text-warning" aria-hidden />
          <p>{permissionsError}</p>
        </div>
      ) : null}

      <IamSearchInput
        value={searchTerm}
        onChange={onSearchChange}
        placeholder="Buscar pantalla por nombre…"
        disabled={panelDisabled}
        aria-label="Buscar pantallas"
      />

      {hierarchicalStructure.length === 0 ? (
        <p className="text-center text-text-soft py-8 text-sm">
          No se encontró estructura de menú para este tenant.
        </p>
      ) : filteredStructure.length === 0 ? (
        <p className="text-center text-text-soft py-6 text-sm">
          No hay pantallas que coincidan con la búsqueda.
        </p>
      ) : (
        <div className="max-h-[50vh] overflow-y-auto space-y-4 pr-1">
          {filteredStructure.map((modulo) => (
            <div key={modulo.modulo_id} className="border border-border-base rounded-lg p-4 bg-subtle/30">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border-base">
                <div className="flex-shrink-0" style={{ color: modulo.modulo_color || '#1976D2' }}>
                  {getIcon(modulo.modulo_icono, Package, { size: 22 })}
                </div>
                <h3 className="text-base font-bold text-text-base">{modulo.modulo_nombre}</h3>
              </div>
              <div className="space-y-3 pl-1">
                {modulo.secciones.map((seccion) => (
                  <div key={seccion.seccion_id} className="border-l-2 border-border-base pl-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-shrink-0 text-text-soft">
                        {getIcon(seccion.seccion_icono, Folder, { size: 18 })}
                      </div>
                      <h4 className="text-sm font-semibold text-text-soft">{seccion.seccion_nombre}</h4>
                    </div>
                    <div className="space-y-0.5">
                      {seccion.menus.map((menu) =>
                        renderMenuNode(
                          menu,
                          0,
                          permissions,
                          panelDisabled,
                          onViewPermissionChange,
                        ),
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
