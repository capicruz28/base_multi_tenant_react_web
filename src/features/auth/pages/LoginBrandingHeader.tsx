/**
 * Cabecera visual del login (white-label). Solo se usa si ENABLE_CONTEXTUAL_LOGIN_UI.
 */
import React from 'react';
import type { BrandingRead } from '@/features/tenant/types/branding.types';
import caxisLogoLight from '@/assets/images/caxis-logo-light.svg';
import caxisLogoDark from '@/assets/images/caxis-logo-dark.svg';
import caxisIconLight from '@/assets/images/caxis-icon-light.svg';
import caxisIconDark from '@/assets/images/caxis-icon-dark.svg';

export function formatClientLabelFromSubdomain(subdomain: string): string {
  return subdomain
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function resolveClientDisplayName(
  branding: BrandingRead | null | undefined,
  subdomain: string | null,
): string | null {
  const appName = branding?.tema_personalizado?.appName?.trim();
  if (appName) return appName;
  if (subdomain) return formatClientLabelFromSubdomain(subdomain);
  return null;
}

/** Iniciales para avatar (ej. "Acme Corp" → "AC"). */
export function clientInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
  return displayName.trim().slice(0, 2).toUpperCase();
}

const TENANT_LOGIN_TAGLINE = 'Inicia sesión con tu cuenta corporativa';

interface LoginBrandingHeaderProps {
  isPlatformLogin: boolean;
  brandingLoading: boolean;
  branding: BrandingRead | null | undefined;
  clientDisplayName: string | null;
  isDarkMode: boolean;
}

export const LoginBrandingHeader: React.FC<LoginBrandingHeaderProps> = ({
  isPlatformLogin,
  brandingLoading,
  branding,
  clientDisplayName,
  isDarkMode,
}) => {
  const caxisLogoSrc = isDarkMode ? caxisLogoDark : caxisLogoLight;
  const caxisIconSrc = isDarkMode ? caxisIconDark : caxisIconLight;

  if (brandingLoading) {
    return (
      <div className="text-center" aria-busy="true" aria-label="Cargando marca">
        <div className="mx-auto mb-5 h-16 w-16 animate-pulse rounded-2xl bg-subtle" />
        <div className="mx-auto h-8 w-44 animate-pulse rounded bg-subtle" />
        <div className="mx-auto mt-3 h-4 w-64 max-w-full animate-pulse rounded bg-subtle" />
      </div>
    );
  }

  if (isPlatformLogin) {
    return (
      <div className="text-center">
        <img
          src={caxisLogoSrc}
          alt="CAXIS"
          className="mx-auto mb-6 h-auto max-h-16 w-[200px] max-w-full object-contain"
        />
        <h2 className="text-3xl font-bold text-text-base">Administración de plataforma</h2>
        <p className="mt-2 text-sm text-text-soft">
          Ingresa tus credenciales de administrador global
        </p>
      </div>
    );
  }

  const clientLogoUrl = branding?.logo_url?.trim() || null;
  const showInitialsAvatar = !clientLogoUrl && !!clientDisplayName;

  return (
    <div className="text-center">
      {clientLogoUrl ? (
        <img
          src={clientLogoUrl}
          alt={clientDisplayName ? `Logo ${clientDisplayName}` : 'Logo del cliente'}
          className="mx-auto mb-5 h-auto max-h-20 w-auto max-w-full object-contain"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : null}

      {showInitialsAvatar ? (
        <div
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary/15 text-xl font-semibold tracking-wide text-brand-primary"
          aria-hidden
        >
          {clientInitials(clientDisplayName)}
        </div>
      ) : null}

      <h2 className="text-3xl font-bold text-text-base">
        {clientDisplayName ?? 'Iniciar sesión'}
      </h2>
      <p className="mt-2 text-sm text-text-soft">{TENANT_LOGIN_TAGLINE}</p>
    </div>
  );
};

interface LoginPoweredByProps {
  isDarkMode: boolean;
}

export const LoginPoweredBy: React.FC<LoginPoweredByProps> = ({ isDarkMode }) => {
  const caxisIconSrc = isDarkMode ? caxisIconDark : caxisIconLight;

  return (
    <div className="mt-8 flex items-center justify-center gap-1.5 border-t border-border-base pt-6">
      <span className="text-xs text-text-faint">Powered by</span>
      <img src={caxisIconSrc} alt="" className="h-4 w-4 object-contain" aria-hidden />
      <span className="text-xs font-medium text-text-soft">CAXIS</span>
    </div>
  );
};

/** UI clásica (revert) — misma apariencia que antes del white-label contextual. */
interface LoginLegacyHeaderProps {
  branding: BrandingRead | null | undefined;
  caxisLogoSrc: string;
}

export const LoginLegacyHeader: React.FC<LoginLegacyHeaderProps> = ({
  branding,
  caxisLogoSrc,
}) => (
  <div className="text-center">
    {branding?.logo_url ? (
      <img
        src={branding.logo_url}
        alt="Logo"
        className="h-15 w-auto mx-auto mb-6 max-h-16 object-contain"
        onError={(e) => {
          e.currentTarget.src = caxisLogoSrc;
        }}
      />
    ) : (
      <img
        src={caxisLogoSrc}
        alt="CAXIS"
        className="mx-auto mb-6 h-auto max-h-16 w-[200px] max-w-full object-contain"
      />
    )}
    <h2 className="text-3xl font-bold text-text-base">Iniciar Sesión</h2>
    <p className="mt-2 text-sm text-text-soft">Ingresa tus credenciales para acceder al sistema</p>
  </div>
);
