import { FormEvent, ChangeEvent } from 'react';
import { Loader } from 'lucide-react';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { TooltipLabel } from '@/shared/components/ui/Tooltip';
import type { UserUpdateData } from '../../types/usuario.types';
import type { Rol } from '../../types/rol.types';
import { RoleCheckboxList } from './RoleCheckboxList';
import { iamInputClass, iamInputErrorClass } from './iam-form-classes';
import { cn } from '@/shared/lib/utils';

type FormErrors = Record<string, string | undefined>;

export interface UserEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequestClose: () => void;
  loginUsername: string;
  formData: UserUpdateData;
  formErrors: FormErrors;
  selectedRoleIds: string[];
  availableRoles: Rol[];
  isSubmitting: boolean;
  isLoadingRoles: boolean;
  onFieldChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onActiveChange: (checked: boolean) => void;
  onRolesChange: (ids: string[]) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function UserEditDialog({
  open,
  onOpenChange,
  onRequestClose,
  loginUsername,
  formData,
  formErrors,
  selectedRoleIds,
  availableRoles,
  isSubmitting,
  isLoadingRoles,
  onFieldChange,
  onActiveChange,
  onRolesChange,
  onSubmit,
}: UserEditDialogProps) {
  const handleDialogOpenChange = (next: boolean) => {
    if (isSubmitting) return;
    if (next) {
      onOpenChange(true);
      return;
    }
    onRequestClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        className="sm:max-w-lg max-h-[90vh] flex flex-col"
        onInteractOutside={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Editar usuario</DialogTitle>
          <DialogDescription>
            Usuario de acceso: <span className="font-medium text-text-base">{loginUsername}</span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="flex flex-col min-h-0 flex-1">
          <DialogBody className="space-y-4">
            <div>
              <label htmlFor="edit_nombre" className="block text-sm font-medium text-text-soft">
                Nombre
              </label>
              <input
                type="text"
                id="edit_nombre"
                name="nombre"
                value={formData.nombre || ''}
                onChange={onFieldChange}
                className={iamInputClass}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label htmlFor="edit_apellido" className="block text-sm font-medium text-text-soft">
                Apellido
              </label>
              <input
                type="text"
                id="edit_apellido"
                name="apellido"
                value={formData.apellido || ''}
                onChange={onFieldChange}
                className={iamInputClass}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <TooltipLabel
                htmlFor="edit_correo"
                label="Correo electrónico"
                required
                tooltip="Correo del usuario. Se usa para comunicaciones y recuperación de acceso."
              />
              <input
                type="email"
                id="edit_correo"
                name="correo"
                value={formData.correo}
                onChange={onFieldChange}
                className={cn(iamInputClass, formErrors.correo && iamInputErrorClass)}
                disabled={isSubmitting}
                required
              />
              {formErrors.correo ? (
                <p className="mt-1 text-xs text-error">{formErrors.correo}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="edit_es_activo"
                checked={Boolean(formData.es_activo)}
                onCheckedChange={(checked) => onActiveChange(checked === true)}
                disabled={isSubmitting}
                aria-label="Usuario con acceso activo"
              />
              <label htmlFor="edit_es_activo" className="text-sm text-text-base cursor-pointer">
                Usuario con acceso activo
              </label>
            </div>
            <div>
              <TooltipLabel
                label="Perfiles de acceso"
                tooltip="Los perfiles definen qué pantallas y acciones tendrá el usuario."
              />
              {isLoadingRoles ? (
                <div className="flex items-center gap-2 py-4 text-sm text-text-soft">
                  <Loader className="h-4 w-4 animate-spin text-brand-primary" />
                  Cargando perfiles…
                </div>
              ) : (
                <RoleCheckboxList
                  roles={availableRoles}
                  selectedIds={selectedRoleIds}
                  onChange={onRolesChange}
                  disabled={isSubmitting}
                />
              )}
            </div>
          </DialogBody>
          <DialogFooter className="mt-4 pt-4 border-t border-border-base">
            <Button
              type="button"
              variant="outline"
              onClick={onRequestClose}
              disabled={isSubmitting}
              className="dark:border-border-base"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isLoadingRoles}
              className="bg-brand-primary hover:bg-brand-primary-hover text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Guardando…
                </>
              ) : (
                'Guardar cambios'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
