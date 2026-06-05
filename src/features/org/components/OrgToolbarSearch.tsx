import { IamSearchInput, type IamSearchInputProps } from '@/features/admin/components/iam';

/**
 * Búsqueda en toolbar ORG con ancho acotado (patrón INV: min-w + max-w).
 * Evita que `w-full` interno de IamSearchInput ocupe toda la fila del flex.
 */
export function OrgToolbarSearch(props: Omit<IamSearchInputProps, 'className'>) {
  return (
    <div className="relative w-52 min-w-[12rem] max-w-md shrink-0">
      <IamSearchInput {...props} className="w-full" />
    </div>
  );
}
