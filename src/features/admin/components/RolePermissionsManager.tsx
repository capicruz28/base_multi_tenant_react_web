// src/features/admin/components/RolePermissionsManager.tsx
import axios from 'axios';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { Loader } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';

import { menuService } from '../services/menu.service';
import { permissionService } from '../services/permission.service';
import {
  getPermisosCatalogo,
  getPermisosNegocioByRol,
  updatePermisosNegocioByRol,
} from '../services/permisos-negocio.service';

import { useAuth } from '@/shared/context/AuthContext';
import type { PermissionState } from '../types/permission.types';
import type { PermisoCatalogoItem, PermisoAsignadoItem } from '../types/permisos-negocio.types';

import { IamSegmentTabs } from './iam/IamSegmentTabs';
import { RbacPermissionsPanel } from './iam/permissions/RbacPermissionsPanel';
import { LbacPermissionsPanel } from './iam/permissions/LbacPermissionsPanel';
import type { HierarchicalStructure, RolePermissionsTab } from './iam/permissions/role-permissions.types';
import { authModulosToHierarchical, countMenusWithVer } from './iam/permissions/role-permissions-menu.utils';
import {
  areMenuPermissionsEqual,
  areNegocioIdsEqual,
  clonePermissionState,
  diffMenuPermissions,
} from './iam/permissions/role-permissions-diff.utils';
import { getPermisoIdsFromAssignedList } from './iam/permissions/permiso-id.utils';
import { scheduleModalStackValidation } from '../utils/iam-modal-stack-validation';

interface RolePermissionsManagerProps {
  isOpen: boolean;
  rolId: string;
  rolName: string;
  onClose: () => void;
  onPermissionsUpdate?: () => void;
}

const PERMISSION_TABS = [
  { id: 'acciones' as const, label: 'Acciones' },
  { id: 'pantallas' as const, label: 'Pantallas' },
];

const RolePermissionsManager: React.FC<RolePermissionsManagerProps> = ({
  isOpen,
  rolId,
  rolName,
  onClose,
  onPermissionsUpdate,
}) => {
  const { clienteInfo, auth } = useAuth();
  const clienteId = clienteInfo?.cliente_id || auth.user?.cliente_id || null;

  const [activeTab, setActiveTab] = useState<RolePermissionsTab>('acciones');

  const [hierarchicalStructure, setHierarchicalStructure] = useState<HierarchicalStructure[]>([]);
  const [permissions, setPermissions] = useState<PermissionState>({});
  const [initialPermissions, setInitialPermissions] = useState<PermissionState>({});
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [structureError, setStructureError] = useState<string | null>(null);
  const [menuPermissionsError, setMenuPermissionsError] = useState<string | null>(null);
  const [menuSearchTerm, setMenuSearchTerm] = useState('');

  const [catalogo, setCatalogo] = useState<PermisoCatalogoItem[]>([]);
  const [selectedPermisoIds, setSelectedPermisoIds] = useState<string[]>([]);
  const [initialNegocioIds, setInitialNegocioIds] = useState<string[]>([]);
  const [loadingNegocio, setLoadingNegocio] = useState(false);
  const [errorNegocio, setErrorNegocio] = useState<string | null>(null);
  const [negocioLoaded, setNegocioLoaded] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  /** B.1.1: cierra Radix Dialog antes de ConfirmDialog para no apilar overlays. */
  const [discardPending, setDiscardPending] = useState(false);

  const dialogOpen = isOpen && !discardPending;

  const isNegocioDirty = useMemo(
    () => !areNegocioIdsEqual(initialNegocioIds, selectedPermisoIds),
    [initialNegocioIds, selectedPermisoIds],
  );

  const isMenuDirty = useMemo(
    () => !areMenuPermissionsEqual(initialPermissions, permissions),
    [initialPermissions, permissions],
  );

  const isDirty = isNegocioDirty || isMenuDirty;

  const actionCount = selectedPermisoIds.length;
  const screenCount = useMemo(
    () => countMenusWithVer(hierarchicalStructure, permissions),
    [hierarchicalStructure, permissions],
  );

  const resetState = useCallback(() => {
    setActiveTab('acciones');
    setHierarchicalStructure([]);
    setPermissions({});
    setInitialPermissions({});
    setStructureError(null);
    setMenuPermissionsError(null);
    setMenuSearchTerm('');
    setCatalogo([]);
    setSelectedPermisoIds([]);
    setInitialNegocioIds([]);
    setErrorNegocio(null);
    setNegocioLoaded(false);
    setIsSaving(false);
    setSaveError(null);
    setDiscardPending(false);
  }, []);

  const loadMenuData = useCallback(async () => {
    if (!rolId || !clienteId) return;

    setIsLoadingMenu(true);
    setStructureError(null);
    setMenuPermissionsError(null);

    try {
      const modulos = await menuService.getAuthMenu().then((res) => res.modulos || []);
      const hierarchicalData = authModulosToHierarchical(modulos);
      setHierarchicalStructure(hierarchicalData);

      try {
        const permissionsData = await permissionService.getRolePermissions(rolId);
        const cloned = clonePermissionState(permissionsData);
        setPermissions(cloned);
        setInitialPermissions(clonePermissionState(permissionsData));
      } catch (permErr) {
        console.error('[RolePermissionsManager] Error loading menu permissions:', permErr);
        const msg =
          permErr instanceof Error
            ? permErr.message
            : 'No se pudieron cargar los permisos de pantalla de este perfil.';
        setMenuPermissionsError(msg);
        setPermissions({});
        setInitialPermissions({});
      }
    } catch (err) {
      console.error('[RolePermissionsManager] Error loading menu structure:', err);
      const msg =
        err instanceof Error ? err.message : 'Error al cargar la estructura del menú.';
      setStructureError(msg);
      setHierarchicalStructure([]);
    } finally {
      setIsLoadingMenu(false);
    }
  }, [rolId, clienteId]);

  const loadNegocioData = useCallback(async () => {
    if (!rolId) return;

    setLoadingNegocio(true);
    setErrorNegocio(null);

    try {
      const [catalogoResult, roleResult] = await Promise.allSettled([
        getPermisosCatalogo(),
        getPermisosNegocioByRol(rolId),
      ]);

      const catalogoData = catalogoResult.status === 'fulfilled' ? catalogoResult.value : [];
      setCatalogo(Array.isArray(catalogoData) ? catalogoData : []);

      if (catalogoResult.status === 'rejected') {
        setErrorNegocio('No se pudo cargar el catálogo de acciones. Intente de nuevo más tarde.');
        setSelectedPermisoIds([]);
        setInitialNegocioIds([]);
        return;
      }

      if (roleResult.status === 'rejected') {
        const err = roleResult.reason;
        if (axios.isAxiosError(err) && err.response?.status === 403) {
          setErrorNegocio(
            'No tiene permiso para ver o editar las acciones de este perfil. Solicite acceso de administración de roles si lo necesita.',
          );
        } else {
          const msg =
            err instanceof Error ? err.message : 'Error al cargar las acciones asignadas al perfil.';
          setErrorNegocio(msg);
        }
        setSelectedPermisoIds([]);
        setInitialNegocioIds([]);
      } else {
        const roleData = roleResult.value;
        const permisosList = Array.isArray(roleData) ? roleData : [];
        const assignedIds = getPermisoIdsFromAssignedList(
          permisosList as PermisoAsignadoItem[],
        );
        setSelectedPermisoIds(assignedIds);
        setInitialNegocioIds([...assignedIds]);
      }

      if (
        (!Array.isArray(catalogoData) || catalogoData.length === 0) &&
        roleResult.status !== 'rejected'
      ) {
        setErrorNegocio(
          'El catálogo de acciones no está disponible. Verifique la configuración del tenant.',
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cargar acciones.';
      setErrorNegocio(msg);
      toast.error(msg);
    } finally {
      setLoadingNegocio(false);
      setNegocioLoaded(true);
    }
  }, [rolId]);

  useEffect(() => {
    if (!isOpen) {
      resetState();
      return;
    }
    if (!rolId) return;
    if (!clienteId) {
      const errorMsg = 'No se pudo obtener el cliente de la sesión. Inicie sesión nuevamente.';
      setStructureError(errorMsg);
      toast.error(errorMsg);
      return;
    }
    void loadMenuData();
  }, [isOpen, rolId, clienteId, loadMenuData, resetState]);

  useEffect(() => {
    if (!isOpen || !rolId || negocioLoaded || loadingNegocio) return;
    void loadNegocioData();
  }, [isOpen, rolId, negocioLoaded, loadingNegocio, loadNegocioData]);

  const handleViewPermissionChange = (menuId: string, checked: boolean) => {
    setPermissions((prev) => {
      const updated = { ...prev };
      if (!updated[menuId]) {
        updated[menuId] = { ver: false, crear: false, editar: false, eliminar: false };
      }
      updated[menuId] = {
        ...updated[menuId],
        ver: checked,
        crear: checked ? updated[menuId].crear : false,
        editar: checked ? updated[menuId].editar : false,
        eliminar: checked ? updated[menuId].eliminar : false,
      };
      return updated;
    });
  };

  const togglePermisoNegocio = (permisoId: string) => {
    const id = String(permisoId);
    setSelectedPermisoIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleRequestClose = () => {
    if (isSaving) return;
    if (isDirty) {
      setDiscardPending(true);
      scheduleModalStackValidation('permissions-request-close-dirty');
      return;
    }
    onClose();
  };

  const handleDiscardCancel = () => {
    setDiscardPending(false);
    scheduleModalStackValidation('permissions-discard-cancel-resume');
  };

  const handleDiscardConfirm = () => {
    setSelectedPermisoIds([...initialNegocioIds]);
    setPermissions(clonePermissionState(initialPermissions));
    setDiscardPending(false);
    scheduleModalStackValidation('permissions-discard-confirmed');
    onClose();
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (open) return;
    handleRequestClose();
  };

  const handleSaveAll = async () => {
    if (!isDirty) {
      toast.success('No hay cambios pendientes.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      if (isNegocioDirty) {
        await updatePermisosNegocioByRol(rolId, { permiso_ids: selectedPermisoIds });
        setInitialNegocioIds([...selectedPermisoIds]);
      }

      if (isMenuDirty) {
        const menuDiff = diffMenuPermissions(initialPermissions, permissions);
        if (menuDiff.length > 0) {
          await permissionService.updateRolePermissionsBatch(rolId, menuDiff);
          setInitialPermissions(clonePermissionState(permissions));
        }
      }

      toast.success(`Permisos del perfil «${rolName}» guardados correctamente.`);
      onPermissionsUpdate?.();
      onClose();
    } catch (err) {
      console.error('[RolePermissionsManager] Error saving permissions:', err);
      let errorMessage = 'Error al guardar los permisos.';
      if (axios.isAxiosError(err) && err.response?.status === 422 && err.response.data?.detail) {
        try {
          const details = err.response.data.detail;
          if (Array.isArray(details)) {
            errorMessage = details.map((e: { loc?: string[]; msg?: string }) =>
              `${e.loc?.join('.')}: ${e.msg}`,
            ).join('; ');
          } else if (typeof details === 'string') {
            errorMessage = details;
          }
        } catch {
          /* ignore parse */
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setSaveError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col bg-surface">
          <DialogHeader>
            <DialogTitle className="text-text-base">
              Permisos del perfil: <span className="font-bold">{rolName}</span>
            </DialogTitle>
            <DialogDescription className="text-text-soft">
              Configure qué <strong>acciones</strong> puede ejecutar este perfil en el sistema y qué{' '}
              <strong>pantallas</strong> verá en el menú.
              {negocioLoaded && !loadingNegocio ? (
                <span className="block mt-1 text-xs">
                  Resumen: {actionCount} acciones · {screenCount} pantallas visibles
                </span>
              ) : null}
            </DialogDescription>
          </DialogHeader>

          <IamSegmentTabs
            items={PERMISSION_TABS}
            activeTab={activeTab}
            onChange={setActiveTab}
            ariaLabel="Secciones de permisos del perfil"
          />

          <div className="flex-grow overflow-y-auto pr-1 min-h-0">
            {activeTab === 'acciones' ? (
              <RbacPermissionsPanel
                catalogo={catalogo}
                selectedPermisoIds={selectedPermisoIds}
                loading={loadingNegocio}
                error={errorNegocio}
                disabled={isSaving || Boolean(errorNegocio)}
                onTogglePermiso={togglePermisoNegocio}
                onSetPermisoIds={setSelectedPermisoIds}
              />
            ) : (
              <LbacPermissionsPanel
                hierarchicalStructure={hierarchicalStructure}
                permissions={permissions}
                loading={isLoadingMenu}
                structureError={structureError}
                permissionsError={menuPermissionsError}
                disabled={isSaving}
                searchTerm={menuSearchTerm}
                onSearchChange={setMenuSearchTerm}
                onViewPermissionChange={handleViewPermissionChange}
              />
            )}
          </div>

          <DialogFooter className="mt-auto pt-4 border-t border-border-base flex-wrap gap-2">
            {isDirty ? (
              <p className="text-xs text-warning mr-auto w-full sm:w-auto">Cambios sin guardar</p>
            ) : null}
            {saveError ? (
              <p className="text-xs text-error mr-auto w-full sm:w-auto">{saveError}</p>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={handleRequestClose}
              disabled={isSaving}
              className="dark:border-border-base"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveAll}
              disabled={
                isSaving ||
                !isDirty ||
                loadingNegocio ||
                isLoadingMenu ||
                Boolean(errorNegocio && isNegocioDirty)
              }
              className="bg-brand-primary hover:bg-brand-primary-hover text-white disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Guardando…
                </>
              ) : (
                'Guardar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={discardPending}
        onClose={handleDiscardCancel}
        onConfirm={handleDiscardConfirm}
        title="Descartar cambios"
        message="Hay cambios sin guardar en acciones o pantallas. ¿Desea cerrar sin guardar?"
        confirmText="Sí, descartar"
        cancelText="Seguir editando"
        variant="warning"
      />
    </>
  );
};

export default RolePermissionsManager;
