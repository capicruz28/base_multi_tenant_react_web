import { useOrgSessionScope } from './useOrgSessionScope';

/** Habilita queries company-scoped solo con sesión JWT completa. */
export function useOrgCompanyQueryGate(options?: { enabled?: boolean }) {
  const { scopeEmpresaId, canQueryCompanyScoped } = useOrgSessionScope();
  const enabled =
    (options?.enabled ?? true) && canQueryCompanyScoped && !!scopeEmpresaId;
  return { scopeEmpresaId, enabled };
}

/** Habilita queries híbridas (/parametros). */
export function useOrgHybridQueryGate(options?: { enabled?: boolean }) {
  const { scopeEmpresaId, canQueryHybridScoped } = useOrgSessionScope();
  const enabled =
    (options?.enabled ?? true) && canQueryHybridScoped && !!scopeEmpresaId;
  return { scopeEmpresaId, enabled };
}
