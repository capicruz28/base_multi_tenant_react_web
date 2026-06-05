import type { ComponentProps } from 'react';
import type { DialogContent } from '@/shared/components/ui/dialog';

/** Evita cierre por overlay/ESC; el cierre pasa por onRequestClose (patrón IAM). */
export const orgDialogGuardProps: Pick<
  ComponentProps<typeof DialogContent>,
  'onInteractOutside' | 'onPointerDownOutside' | 'onEscapeKeyDown'
> = {
  onInteractOutside: (event) => event.preventDefault(),
  onPointerDownOutside: (event) => event.preventDefault(),
  onEscapeKeyDown: (event) => event.preventDefault(),
};
