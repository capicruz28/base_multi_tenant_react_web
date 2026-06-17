import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Loader } from 'lucide-react';
import { useAuth } from '@/shared/context/AuthContext';
import { getErrorMessage } from '@/core/services/error.service';
import { APP_CHANGE_PASSWORD } from '../types/auth.types';
import {
  resolvePostLoginPath,
  APP_HOME,
  APP_ONBOARDING,
  APP_SELECCIONAR_EMPRESA,
} from '@/core/routing/post-login-path';
import { shouldOnboardEmpresa } from '@/core/auth/utils/empresa-access';
import { useEmpresaSelectionStore } from '../stores/empresa-selection.store';
import { useEmpresaSelectionHydrated } from '../stores/empresa-selection-hydration';
import { useBranding } from '@/features/tenant/hooks/useBranding';
import { useBrandingStore } from '@/features/tenant/stores/branding.store';
import { useTenant } from '@/features/tenant/components/TenantContext';
import { applyBranding } from '@/utils/branding.utils';
import type { BrandingRead } from '@/features/tenant/types/branding.types';
import { useTheme } from '@/shared/context/ThemeContext';
import caxisLogoLight from '@/assets/images/caxis-logo-light.svg';
import caxisLogoDark from '@/assets/images/caxis-logo-dark.svg';
import {
  ENABLE_CONTEXTUAL_LOGIN_UI,
  PLATFORM_LOGIN_SUBDOMAIN,
} from '../config/login-ui.flags';
import {
  LoginBrandingHeader,
  LoginLegacyHeader,
  LoginPoweredBy,
  resolveClientDisplayName,
} from './LoginBrandingHeader';

function validateNewPassword(password: string): string | null {
  if (password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Debe incluir al menos una letra mayúscula.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Debe incluir al menos una letra minúscula.';
  }
  if (!/[0-9]/.test(password)) {
    return 'Debe incluir al menos un número.';
  }
  return null;
}

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { subdomain } = useTenant();
  const { branding, loading: brandingLoading } = useBranding(false);
  const subdomainBranding = useBrandingStore((state) =>
    subdomain ? state.subdomainCache.get(subdomain) ?? null : null,
  );
  const subdomainBrandingLoading = useBrandingStore(
    (state) => state.loading,
  );
  const { isDarkMode } = useTheme();
  const caxisLogoSrc = isDarkMode ? caxisLogoDark : caxisLogoLight;
  const hydrated = useEmpresaSelectionHydrated();
  const pendingSelectionActive = useEmpresaSelectionStore((s) => s.hasPendingSelection());
  const selectionUserPreview = useEmpresaSelectionStore((s) => s.userPreview);
  const {
    requiresPasswordChange,
    completePasswordChange,
    logout,
    authInitialized,
    loading: authLoading,
    isAuthenticated,
    auth,
    userType,
    isSuperAdmin,
    menuModulos,
    esAdminCliente,
    empresaActivaId,
    requiereSeleccionEmpresa,
    empresasDisponibles,
  } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const isPlatformLogin = subdomain === PLATFORM_LOGIN_SUBDOMAIN;

  const effectiveBranding: BrandingRead | null = requiresPasswordChange
    ? subdomainBranding ?? branding
    : branding;

  const effectiveBrandingLoading =
    requiresPasswordChange && subdomain
      ? subdomainBrandingLoading && !subdomainBranding
      : brandingLoading;

  const clientDisplayName = resolveClientDisplayName(effectiveBranding, subdomain);
  const displayUsername =
    auth.user?.nombre_usuario ?? selectionUserPreview?.nombre_usuario ?? null;

  useEffect(() => {
    if (!requiresPasswordChange || !subdomain) return;
    const cached = useBrandingStore.getState().getBrandingBySubdomain(subdomain);
    if (!cached) {
      void useBrandingStore.getState().loadBrandingBySubdomain(subdomain);
    }
  }, [requiresPasswordChange, subdomain]);

  useEffect(() => {
    if (!requiresPasswordChange || !effectiveBranding) return;
    applyBranding(effectiveBranding);
  }, [requiresPasswordChange, effectiveBranding]);

  useEffect(() => {
    if (!ENABLE_CONTEXTUAL_LOGIN_UI) return;

    const previousTitle = document.title;
    if (isPlatformLogin) {
      document.title = 'Cambio de contraseña | CAXIS';
    } else if (clientDisplayName) {
      document.title = `Cambiar contraseña | ${clientDisplayName}`;
    } else {
      document.title = 'Cambiar contraseña';
    }

    return () => {
      document.title = previousTitle;
    };
  }, [isPlatformLogin, clientDisplayName]);

  const canAccessPage =
    isAuthenticated || (pendingSelectionActive && Boolean(selectionUserPreview));

  useEffect(() => {
    if (!authInitialized || authLoading || !hydrated) return;

    if (!canAccessPage) {
      navigate('/login', { replace: true });
      return;
    }

    if (!requiresPasswordChange) {
      const destination = resolvePostLoginPath({
        isSuperAdmin,
        userType,
        menuModulos,
        fromPathname: APP_HOME,
      });
      navigate(destination, { replace: true });
    }
  }, [
    authInitialized,
    authLoading,
    hydrated,
    canAccessPage,
    requiresPasswordChange,
    navigate,
    isSuperAdmin,
    userType,
    menuModulos,
  ]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFieldError(null);

    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setFieldError('Complete todos los campos.');
      return;
    }

    const passwordRuleError = validateNewPassword(newPassword);
    if (passwordRuleError) {
      setFieldError(passwordRuleError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setFieldError('La confirmación no coincide con la nueva contraseña.');
      return;
    }

    if (currentPassword === newPassword) {
      setFieldError('La nueva contraseña debe ser diferente a la actual.');
      return;
    }

    setSubmitting(true);
    try {
      const session = await completePasswordChange({
        current_password: currentPassword,
        new_password: newPassword,
      });

      if (!session?.user) {
        toast.error('No se pudo completar el cambio de contraseña.');
        return;
      }

      toast.success('Contraseña actualizada correctamente.');

      const user = session.user;
      const pendingSelection = useEmpresaSelectionStore.getState().hasPendingSelection();

      if (pendingSelection || requiereSeleccionEmpresa) {
        navigate(APP_SELECCIONAR_EMPRESA, { replace: true });
        return;
      }

      if (
        shouldOnboardEmpresa({
          userType: user.user_type ?? userType,
          empresaActivaId: user.empresa_activa ?? empresaActivaId,
          esAdminCliente: Boolean(user.es_admin_cliente ?? esAdminCliente),
          requiereSeleccionEmpresa: false,
          empresasDisponiblesCount: empresasDisponibles.length,
        })
      ) {
        navigate(APP_ONBOARDING, { replace: true });
        return;
      }

      navigate(
        resolvePostLoginPath({
          isSuperAdmin: user.user_type === 'platform_admin' || Boolean(user.is_super_admin),
          userType: user.user_type ?? userType,
          menuModulos: session.menuModulos,
          fromPathname: APP_HOME,
        }),
        { replace: true },
      );
    } catch (error: unknown) {
      const err = getErrorMessage(error);
      setFieldError(err.message || 'Error al cambiar la contraseña.');
      toast.error(err.message || 'Error al cambiar la contraseña.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  if (!authInitialized || authLoading || !hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <Loader className="w-8 h-8 animate-spin text-brand-primary" aria-label="Cargando" />
      </div>
    );
  }

  if (!requiresPasswordChange) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-page px-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-surface border border-border-base shadow-lg rounded-lg">
        {ENABLE_CONTEXTUAL_LOGIN_UI ? (
          <LoginBrandingHeader
            isPlatformLogin={isPlatformLogin}
            brandingLoading={effectiveBrandingLoading}
            branding={effectiveBranding}
            clientDisplayName={clientDisplayName}
            isDarkMode={isDarkMode}
          />
        ) : (
          <LoginLegacyHeader branding={effectiveBranding} caxisLogoSrc={caxisLogoSrc} />
        )}

        <div className="text-center">
          <h1 className="text-xl font-semibold text-text-base">
            Cambio de contraseña obligatorio
          </h1>
          <p className="mt-2 text-sm text-text-soft">
            Por seguridad, debe establecer una nueva contraseña antes de continuar.
          </p>
          {displayUsername ? (
            <p className="mt-1 text-xs text-text-soft">
              Usuario: <span className="font-medium text-text-base">{displayUsername}</span>
            </p>
          ) : null}
        </div>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="current_password" className="block text-sm font-medium text-text-soft mb-1">
              Contraseña actual
            </label>
            <div className="relative">
              <input
                id="current_password"
                type={showCurrent ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-border-base rounded-md bg-surface dark:bg-subtle text-text-base focus:ring-2 focus:ring-brand-primary"
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute inset-y-0 right-0 pr-2 flex items-center text-text-soft hover:text-text-base"
                onClick={() => setShowCurrent((v) => !v)}
                aria-label={showCurrent ? 'Ocultar' : 'Mostrar'}
              >
                {showCurrent ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="new_password" className="block text-sm font-medium text-text-soft mb-1">
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                id="new_password"
                type={showNew ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-border-base rounded-md bg-surface dark:bg-subtle text-text-base focus:ring-2 focus:ring-brand-primary"
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute inset-y-0 right-0 pr-2 flex items-center text-text-soft hover:text-text-base"
                onClick={() => setShowNew((v) => !v)}
                aria-label={showNew ? 'Ocultar' : 'Mostrar'}
              >
                {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-text-soft">
              Mínimo 8 caracteres, mayúscula, minúscula y número.
            </p>
          </div>

          <div>
            <label htmlFor="confirm_password" className="block text-sm font-medium text-text-soft mb-1">
              Confirmar nueva contraseña
            </label>
            <input
              id="confirm_password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-border-base rounded-md bg-surface dark:bg-subtle text-text-base focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          {fieldError ? (
            <p className="text-sm text-error bg-error/10 px-3 py-2 rounded-md" role="alert">
              {fieldError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex justify-center py-2 px-4 text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader className="animate-spin h-5 w-5 mr-2" />
                Actualizando...
              </>
            ) : (
              'Actualizar contraseña'
            )}
          </button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm text-text-soft hover:text-text-base underline"
          >
            Cerrar sesión
          </button>
        </div>

        {ENABLE_CONTEXTUAL_LOGIN_UI && !isPlatformLogin ? (
          <LoginPoweredBy isDarkMode={isDarkMode} />
        ) : null}
      </div>
    </div>
  );
}

export { APP_CHANGE_PASSWORD };
