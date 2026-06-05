import { useAuth } from '@/shared/context/AuthContext';

/**
 * Empresa activa de sesión (multi-empresa).
 * Elegibilidad: empresasElegibles (usuario_rol vía GET /auth/me).
 */
export function useEmpresaActiva() {
  const {
    empresaActivaId,
    empresasElegibles,
    empresasDisponibles,
    requiereSeleccionEmpresa,
    esAdminCliente,
    hasEmpresaActivaFlag,
    canAccessErp,
    mustSelectEmpresa,
    cambiarEmpresaActiva,
    userType,
  } = useAuth();

  const isPlatformAdmin = userType === 'platform_admin';

  const showEmpresaActiva =
    hasEmpresaActivaFlag && !requiereSeleccionEmpresa && !isPlatformAdmin;

  /** Dropdown interactivo solo si hay más de una empresa elegible. */
  const canSwitchEmpresa = empresasElegibles.length > 1;

  return {
    empresaActivaId,
    empresasElegibles,
    /** @deprecated Alias de empresasElegibles */
    empresasDisponibles: empresasElegibles.length > 0 ? empresasElegibles : empresasDisponibles,
    requiereSeleccionEmpresa,
    esAdminCliente,
    hasEmpresaActiva: hasEmpresaActivaFlag,
    canAccessErp,
    mustSelectEmpresa,
    cambiarEmpresaActiva,
    showEmpresaActiva,
    /** @deprecated Usar showEmpresaActiva */
    showEmpresaSelector: showEmpresaActiva,
    canSwitchEmpresa,
    /** @deprecated Usar canSwitchEmpresa */
    isMultiEmpresa: canSwitchEmpresa,
    userType,
  };
}
