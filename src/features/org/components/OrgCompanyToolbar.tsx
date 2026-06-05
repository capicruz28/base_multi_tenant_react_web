import type { ReactNode } from 'react';
import { useHeaderEmpresaContextVisible } from '@/shared/hooks/useHeaderEmpresaContextVisible';
import { OrgActiveEmpresaBanner } from './OrgActiveEmpresaBanner';

interface OrgCompanyToolbarProps {
  children?: ReactNode;
  actions?: ReactNode;
}

/**
 * Barra superior estándar en pantallas company-scoped: empresa activa (JWT) + filtros locales.
 */
export function OrgCompanyToolbar({ children, actions }: OrgCompanyToolbarProps) {
  const headerEmpresaVisible = useHeaderEmpresaContextVisible();

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3 min-w-0">
        {!headerEmpresaVisible ? <OrgActiveEmpresaBanner /> : null}
        {children}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
