import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  resolvePostLoginPath,
  APP_SELECCIONAR_EMPRESA,
  APP_ONBOARDING,
} from '@/core/routing/post-login-path';
import { useEmpresaSelectionStore } from '@/features/auth/stores/empresa-selection.store';
import { shouldOnboardEmpresa } from '@/core/auth/utils/empresa-access';
import { APP_CHANGE_PASSWORD } from '@/features/auth/types/auth.types';

/**
 * Redirección según contexto de usuario (raíz `/`).
 * Prioridad: selección empresa → onboarding → tipo de usuario.
 */
const SmartRedirect: React.FC = () => {
  const {
    isSuperAdmin,
    userType,
    loading,
    authInitialized,
    mustSelectEmpresa,
    esAdminCliente,
    empresaActivaId,
    requiereSeleccionEmpresa,
    empresasDisponibles,
    menuModulos,
    requiresPasswordChange,
  } = useAuth();
  const hasPendingSelection = useEmpresaSelectionStore((s) => s.hasPendingSelection());

  if (loading || !authInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary" />
      </div>
    );
  }

  if (requiresPasswordChange) {
    if (import.meta.env.DEV) {
      console.log(`🔄 [SmartRedirect] → ${APP_CHANGE_PASSWORD} (cambio de contraseña obligatorio)`);
    }
    return <Navigate to={APP_CHANGE_PASSWORD} replace />;
  }

  if (hasPendingSelection || mustSelectEmpresa) {
    if (import.meta.env.DEV) {
      console.log(`🔄 [SmartRedirect] → ${APP_SELECCIONAR_EMPRESA} (selección pendiente)`);
    }
    return <Navigate to={APP_SELECCIONAR_EMPRESA} replace />;
  }

  if (
    shouldOnboardEmpresa({
      userType,
      empresaActivaId,
      esAdminCliente,
      requiereSeleccionEmpresa,
      empresasDisponiblesCount: empresasDisponibles.length,
    })
  ) {
    if (import.meta.env.DEV) {
      console.log(`🔄 [SmartRedirect] → ${APP_ONBOARDING} (onboarding admin)`);
    }
    return <Navigate to={APP_ONBOARDING} replace />;
  }

  const target = resolvePostLoginPath({
    isSuperAdmin,
    userType,
    menuModulos,
  });

  if (import.meta.env.DEV) {
    console.log(`🔄 [SmartRedirect] → ${target}`);
  }

  return <Navigate to={target} replace />;
};

export default SmartRedirect;
