import { Building2 } from 'lucide-react';
import { useOrgSessionScope } from '../hooks/useOrgSessionScope';

/**
 * Muestra la empresa activa de sesión (JWT). Sustituye el selector manual cross-company (Etapa A).
 */
export function OrgActiveEmpresaBanner() {
  const { scopeEmpresaId, activeEmpresaLabel, canSwitchEmpresa } = useOrgSessionScope();

  if (!scopeEmpresaId || !activeEmpresaLabel) return null;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border-base bg-subtle text-sm text-text-base">
      <Building2 size={15} className="text-brand-primary flex-shrink-0" aria-hidden />
      <span>
        <span className="text-text-soft">Empresa activa: </span>
        <span className="font-medium">{activeEmpresaLabel}</span>
      </span>
      {canSwitchEmpresa ? (
        <span className="text-xs text-text-soft border-l border-border-base pl-2 ml-1">
          Cambiar en el encabezado
        </span>
      ) : null}
    </div>
  );
}
