import { useInvSessionScope } from './useInvSessionScope';

/** Habilita queries company-scoped solo con sesión JWT completa. */
export function useInvCompanyQueryGate(options?: { enabled?: boolean }) {
  const { scopeEmpresaId, canQueryCompanyScoped } = useInvSessionScope();
  const enabled =
    (options?.enabled ?? true) && canQueryCompanyScoped && !!scopeEmpresaId;
  return { scopeEmpresaId, enabled };
}
