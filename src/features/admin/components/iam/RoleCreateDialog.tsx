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
import type { RolCreateData } from '../../types/rol.types';
import { iamInputClass, iamInputErrorClass, iamTextareaClass } from './iam-form-classes';
import { cn } from '@/shared/lib/utils';

type FormErrors = Record<string, string | undefined>;

export interface RoleCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequestClose: () => void;
  formData: RolCreateData;
  formErrors: FormErrors;
  isSubmitting: boolean;
  onFieldChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function RoleCreateDialog({
  open,
  onOpenChange,
  onRequestClose,
  formData,
  formErrors,
  isSubmitting,
  onFieldChange,
  onSubmit,
}: RoleCreateDialogProps) {
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
          <DialogTitle>Crear perfil de acceso</DialogTitle>
          <DialogDescription>
            Defina un perfil que agrupa permisos. Los perfiles nuevos se crean activos; puede desactivarlos
            después desde la tabla si lo necesita.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="flex flex-col min-h-0 flex-1">
          <DialogBody className="space-y-4">
            <div>
              <label htmlFor="create_nombre" className="block text-sm font-medium text-text-soft">
                Nombre <span className="text-error">*</span>
              </label>
              <input
                type="text"
                id="create_nombre"
                name="nombre"
                value={formData.nombre}
                onChange={onFieldChange}
                className={cn(iamInputClass, formErrors.nombre && iamInputErrorClass)}
                disabled={isSubmitting}
                required
              />
              {formErrors.nombre ? (
                <p className="mt-1 text-xs text-error">{formErrors.nombre}</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="create_descripcion" className="block text-sm font-medium text-text-soft">
                Descripción
              </label>
              <textarea
                id="create_descripcion"
                name="descripcion"
                value={formData.descripcion || ''}
                onChange={onFieldChange}
                rows={3}
                className={iamTextareaClass}
                disabled={isSubmitting}
              />
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
              disabled={isSubmitting}
              className="bg-brand-primary hover:bg-brand-primary-hover text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Creando…
                </>
              ) : (
                'Crear perfil'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
