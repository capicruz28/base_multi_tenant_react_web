import { useEmpresaActiva } from '@/features/auth/hooks/useEmpresaActiva';
import useUserType from '@/core/hooks/useUserType';
import { useLayoutShell } from '@/shared/components/layout/LayoutShellContext';

/**
 * Espejo de Header.tsx + EmpresaSelector: contexto de empresa visible en el header.
 * Mantener alineado con la condición de montaje de EmpresaSelector y su early return.
 */
export function useHeaderEmpresaContextVisible(): boolean {
  const shell = useLayoutShell();
  const { isSuperAdminUser, isTenantAdminUser } = useUserType();
  const { showEmpresaActiva, empresaActivaId } = useEmpresaActiva();

  const headerShowsEmpresaSlot =
    !isSuperAdminUser &&
    (shell === 'app' || (shell === 'admin' && isTenantAdminUser));

  return headerShowsEmpresaSlot && showEmpresaActiva && !!empresaActivaId;
}
