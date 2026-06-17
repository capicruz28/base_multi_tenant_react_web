// src/features/auth/pages/Login.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Loader } from 'lucide-react';
import { useAuth } from '../../../shared/context/AuthContext';
import { authService } from '../services/auth.service';
import { getErrorMessage } from '../../../core/services/error.service';
import {
  LoginCredentials,
  isLoginEmpresaSelectionResponse,
  APP_CHANGE_PASSWORD,
} from '../types/auth.types';
import { useBranding } from '../../tenant/hooks/useBranding';
import { useTenant } from '../../tenant/components/TenantContext';
import { useTheme } from '@/shared/context/ThemeContext';
import caxisLogoLight from '@/assets/images/caxis-logo-light.svg';
import caxisLogoDark from '@/assets/images/caxis-logo-dark.svg';
import { resolvePostLoginPath, APP_HOME } from '@/core/routing/post-login-path';
import { logPostLoginDiag } from '@/core/auth/utils/post-login-diag-log';
import { useEmpresaSelectionStore } from '../stores/empresa-selection.store';
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

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { subdomain } = useTenant();
  const { branding, loading: brandingLoading } = useBranding(false);
  const { isDarkMode } = useTheme();
  const caxisLogoSrc = isDarkMode ? caxisLogoDark : caxisLogoLight;
  const location = useLocation();
  const { setAuthFromLogin } = useAuth();
  const setPendingSelection = useEmpresaSelectionStore((s) => s.setPendingSelection);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<LoginCredentials>({
    username: '',
    password: '',
  });

  const isPlatformLogin = subdomain === PLATFORM_LOGIN_SUBDOMAIN;
  const clientDisplayName = resolveClientDisplayName(branding, subdomain);

  useEffect(() => {
    if (!ENABLE_CONTEXTUAL_LOGIN_UI) return;

    const previousTitle = document.title;
    if (isPlatformLogin) {
      document.title = 'Administración de plataforma | CAXIS';
    } else if (clientDisplayName) {
      document.title = `Iniciar sesión | ${clientDisplayName}`;
    } else {
      document.title = 'Iniciar sesión';
    }

    return () => {
      document.title = previousTitle;
    };
  }, [isPlatformLogin, clientDisplayName]);

  const from = location.state?.from?.pathname as string | undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username || !formData.password) {
      toast.error('Por favor complete todos los campos');
      return;
    }

    setLoading(true);

    try {
      const loginResult = await authService.login(formData);

      // Schema A — selección pendiente: sin access_token, sin /auth/me
      if (isLoginEmpresaSelectionResponse(loginResult)) {
        setPendingSelection(loginResult);
        if (loginResult.user_data?.requires_password_change) {
          toast.success('Debe actualizar su contraseña para continuar', {
            duration: 3000,
            position: 'top-right',
          });
          navigate(APP_CHANGE_PASSWORD, { replace: true });
          return;
        }
        toast.success('Seleccione su empresa para continuar', { duration: 3000, position: 'top-right' });
        navigate('/app/seleccionar-empresa', { replace: true });
        return;
      }

      // Schema B — sesión completa
      const session = await setAuthFromLogin(loginResult);

      if (session?.user) {
        const userData = session.user;
        toast.success('¡Bienvenido!', { duration: 3000, position: 'top-right' });

        const userType = userData.user_type ?? 'user';
        const isSuperAdmin =
          userType === 'platform_admin' || Boolean(userData.is_super_admin);

        if (userData.requires_password_change && userType !== 'platform_admin' && !isSuperAdmin) {
          navigate(APP_CHANGE_PASSWORD, { replace: true });
          return;
        }

        const sinEmpresa = !userData.empresa_activa;
        const onboardingAdmin = userData.es_admin_cliente && sinEmpresa;

        if (onboardingAdmin) {
          navigate('/app/onboarding', { replace: true });
          return;
        }

        const destination = resolvePostLoginPath({
          isSuperAdmin,
          userType,
          menuModulos: session.menuModulos,
          fromPathname: from ?? APP_HOME,
        });

        logPostLoginDiag('Login', 'destination-calculated', {
          destination,
          userType,
          isSuperAdmin,
          fromPathname: from ?? APP_HOME,
          menuModulosCount: session.menuModulos?.length ?? 0,
          menuModulosCodigos: session.menuModulos?.map((m) => m.codigo) ?? null,
          empresaActivaId: userData.empresa_activa ?? null,
        });

        if (import.meta.env.DEV) {
          console.log(`[Login] navigate → ${destination} (user_type: ${userType}, from: ${from})`);
        }

        navigate(destination, { replace: true });
      } else {
        console.error(
          'Login page: setAuth did not return user data, likely due to invalid API response passed to it.',
        );
        toast.error('Error al procesar la respuesta del servidor.', {
          duration: 4000,
          position: 'top-right',
        });
      }
    } catch (error: unknown) {
      const errorData = getErrorMessage(error);
      console.error('Login page caught error during authService.login:', errorData, error);
      toast.error(errorData.message || 'Credenciales incorrectas o error del servidor.', {
        duration: 4000,
        position: 'top-right',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-page px-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-surface border border-border-base shadow-lg rounded-lg">
        {ENABLE_CONTEXTUAL_LOGIN_UI ? (
          <LoginBrandingHeader
            isPlatformLogin={isPlatformLogin}
            brandingLoading={brandingLoading}
            branding={branding}
            clientDisplayName={clientDisplayName}
            isDarkMode={isDarkMode}
          />
        ) : (
          <LoginLegacyHeader branding={branding} caxisLogoSrc={caxisLogoSrc} />
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="space-y-4 rounded-md">
            <div>
              <label htmlFor="username" className="sr-only">
                Usuario
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-border-base placeholder:text-text-faint text-text-base bg-surface dark:bg-subtle rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-brand-primary focus:border-brand-primary focus:z-10 sm:text-sm"
                placeholder="Nombre de usuario"
                value={formData.username}
                onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
              />
            </div>

            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-border-base placeholder:text-text-faint text-text-base bg-surface dark:bg-subtle rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-brand-primary focus:border-brand-primary focus:z-10 sm:text-sm pr-10"
                placeholder="Contraseña"
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute inset-y-0 right-0 pr-2 flex items-center rounded-md text-text-soft hover:text-text-base hover:bg-overlay"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
          >
            {loading ? (
              <>
                <Loader className="animate-spin h-5 w-5 mr-3" aria-hidden="true" />
                Iniciando sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        {ENABLE_CONTEXTUAL_LOGIN_UI && !isPlatformLogin ? (
          <LoginPoweredBy isDarkMode={isDarkMode} />
        ) : null}
      </div>
    </div>
  );
};

export default Login;
