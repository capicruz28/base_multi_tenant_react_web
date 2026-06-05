import { hasEmpresaActiva } from '@/core/auth/utils/empresa-access';

export interface OrgCompanyScopeAccessInput {
  userType: string;
  scopeEmpresaId: string | null;
  empresaSelectionPending: boolean;
}

/**
 * Habilitación ORG company-scoped (JWT empresa activa).
 * No usar canAccessErp: esa regla es para shell ERP operativo (excluye tenant_admin).
 */
export function canOperateOrgCompanyScope({
  userType,
  scopeEmpresaId,
  empresaSelectionPending,
}: OrgCompanyScopeAccessInput): boolean {
  if (empresaSelectionPending) return false;
  if (!hasEmpresaActiva(scopeEmpresaId)) return false;
  if (userType === 'platform_admin') return false;
  return userType === 'tenant_admin' || userType === 'user';
}
