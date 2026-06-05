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
import { TooltipLabel } from '@/shared/components/ui/Tooltip';
import type { UserFormData } from '../../types/usuario.types';
import type { Rol } from '../../types/rol.types';
import { RoleCheckboxList } from './RoleCheckboxList';
import { PasswordFieldWithGenerate } from './PasswordFieldWithGenerate';
import { iamInputClass, iamInputErrorClass } from './iam-form-classes';
import { cn } from '@/shared/lib/utils';

type FormErrors = Record<string, string | undefined>;

export interface UserCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequestClose: () => void;
  formData: UserFormData;
  formErrors: FormErrors;
  selectedRoleIds: string[];
  availableRoles: Rol[];
  isSubmitting: boolean;
  isLoadingRoles: boolean;
  onFieldChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onPasswordChange: (value: string) => void;
  onRolesChange: (ids: string[]) => void;
  onClearFieldError: (field: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function UserCreateDialog({
  open,
  onOpenChange,
  onRequestClose,
  formData,
  formErrors,
  selectedRoleIds,
  availableRoles,
  isSubmitting,
  isLoadingRoles,
  onFieldChange,
  onPasswordChange,
  onRolesChange,
  onClearFieldError,
  onSubmit,
}: UserCreateDialogProps) {
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
          <DialogTitle>Crear usuario</DialogTitle>
          <DialogDescription>
            Registre una persona que accederá al sistema. Asigne uno o más perfiles de acceso.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="flex flex-col min-h-0 flex-1">
          <DialogBody className="space-y-4">
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-text-soft">
                Nombre
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre || ''}
                onChange={onFieldChange}
                className={iamInputClass}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label htmlFor="apellido" className="block text-sm font-medium text-text-soft">
                Apellido
              </label>
              <input
                type="text"
                id="apellido"
                name="apellido"
                value={formData.apellido || ''}
                onChange={onFieldChange}
                className={iamInputClass}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <TooltipLabel
                htmlFor="nombre_usuario"
                label="Usuario de acceso"
                required
                tooltip="Identificador para iniciar sesión. Puede ser distinto del correo."
              />
              <input
                type="text"
                id="nombre_usuario"
                name="nombre_usuario"
                value={formData.nombre_usuario}
                onChange={onFieldChange}
                className={cn(iamInputClass, formErrors.nombre_usuario && iamInputErrorClass)}
                disabled={isSubmitting}
                required
              />
              {formErrors.nombre_usuario ? (
                <p className="mt-1 text-xs text-error">{formErrors.nombre_usuario}</p>
              ) : null}
            </div>
            <div>
              <TooltipLabel
                htmlFor="correo"
                label="Correo electrónico"
                required
                tooltip="Correo del usuario. Se usa para comunicaciones y recuperación de acceso."
              />
              <input
                type="email"
                id="correo"
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
            <div>
              <TooltipLabel
                htmlFor="contrasena"
                label="Contraseña"
                required
                tooltip="Contraseña inicial del usuario. Puede generar una segura automáticamente."
              />
              <PasswordFieldWithGenerate
                id="contrasena"
                value={formData.contrasena || ''}
                onChange={onPasswordChange}
                error={formErrors.contrasena}
                disabled={isSubmitting}
                onClearError={() => onClearFieldError('contrasena')}
              />
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
                  Creando…
                </>
              ) : (
                'Crear usuario'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
