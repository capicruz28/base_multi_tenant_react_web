/**

 * Reglas de acceso al ERP según sesión multi-empresa (alineado con backend).

 */

export interface CanAccessErpInput {

  userType: string;

  empresaActivaId: string | null;

  esAdminCliente: boolean;

  requiereSeleccionEmpresa: boolean;

}



export interface EmpresaFlowInput extends CanAccessErpInput {

  empresasDisponiblesCount: number;

}



export function hasEmpresaActiva(empresaActivaId: string | null | undefined): boolean {

  return typeof empresaActivaId === 'string' && empresaActivaId.length > 0;

}



/** Usuario operativo puede entrar al shell `/app` (rutas ERP o selección). */

export function canAccessErp({

  userType,

  empresaActivaId,

  esAdminCliente,

  requiereSeleccionEmpresa,

}: CanAccessErpInput): boolean {

  if (requiereSeleccionEmpresa) return false;

  if (userType === 'platform_admin' || userType === 'tenant_admin') return false;

  if (hasEmpresaActiva(empresaActivaId)) return true;

  if (esAdminCliente) return true;

  return false;

}



/**

 * Onboarding: admin de cliente sin empresa y sin lista de selección (primera empresa).

 * Mutuamente excluyente con shouldSelectEmpresa.

 */

export function shouldOnboardEmpresa({

  userType,

  empresaActivaId,

  esAdminCliente,

  requiereSeleccionEmpresa,

  empresasDisponiblesCount,

}: EmpresaFlowInput): boolean {

  return (

    userType !== 'platform_admin' &&

    Boolean(esAdminCliente) &&

    !hasEmpresaActiva(empresaActivaId) &&

    empresasDisponiblesCount === 0 &&

    !requiereSeleccionEmpresa

  );

}



/** @deprecated Usar shouldOnboardEmpresa */

export const needsOnboardingEmpresa = shouldOnboardEmpresa;



/**

 * Selección: token/flag de selección con empresas asignadas, u operativo sin empresa.

 * No aplica a admin en onboarding (sin empresas en lista).

 */

export function shouldSelectEmpresa({

  userType,

  empresaActivaId,

  esAdminCliente,

  requiereSeleccionEmpresa,

  empresasDisponiblesCount,

}: EmpresaFlowInput): boolean {

  if (userType === 'platform_admin' || userType === 'tenant_admin') return false;

  if (shouldOnboardEmpresa({

    userType,

    empresaActivaId,

    esAdminCliente,

    requiereSeleccionEmpresa,

    empresasDisponiblesCount,

  })) {

    return false;

  }

  if (requiereSeleccionEmpresa && empresasDisponiblesCount > 0) return true;

  if (!hasEmpresaActiva(empresaActivaId) && !esAdminCliente) return true;

  return false;

}



/** Debe completar POST /auth/empresa/seleccionar/ antes del ERP. */

export function mustSelectEmpresa(input: EmpresaFlowInput): boolean {

  return shouldSelectEmpresa(input);

}


