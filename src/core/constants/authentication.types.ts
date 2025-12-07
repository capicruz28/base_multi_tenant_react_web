/**
 * Modos de autenticación
 * 
 * Basado en la tabla cliente de la BD:
 * - local: Usuario + contraseña en nuestra BD
 * - sso: Solo federación de identidad (Azure AD, Google, etc)
 * - hybrid: Ambos métodos habilitados
 */
export enum AuthenticationMode {
  LOCAL = 'local',
  SSO = 'sso',
  HYBRID = 'hybrid',
}

/**
 * Proveedores de autenticación externa
 * 
 * Basado en la tabla usuario de la BD:
 * - local: Usuario/password en nuestra BD
 * - azure_ad: Azure Active Directory
 * - google: Google Workspace
 * - okta: Okta
 * - oidc: OpenID Connect genérico
 * - saml: SAML 2.0
 */
export enum AuthenticationProvider {
  LOCAL = 'local',
  AZURE_AD = 'azure_ad',
  GOOGLE = 'google',
  OKTA = 'okta',
  OIDC = 'oidc',
  SAML = 'saml',
}

/**
 * Valida si un string es un modo de autenticación válido
 */
export const isValidAuthenticationMode = (value: string): value is AuthenticationMode => {
  return Object.values(AuthenticationMode).includes(value as AuthenticationMode);
};

/**
 * Valida si un string es un proveedor de autenticación válido
 */
export const isValidAuthenticationProvider = (value: string): value is AuthenticationProvider => {
  return Object.values(AuthenticationProvider).includes(value as AuthenticationProvider);
};

/**
 * Obtiene el label legible para un modo de autenticación
 */
export const getAuthenticationModeLabel = (mode: AuthenticationMode): string => {
  const labels: Record<AuthenticationMode, string> = {
    [AuthenticationMode.LOCAL]: 'Local',
    [AuthenticationMode.SSO]: 'SSO',
    [AuthenticationMode.HYBRID]: 'Híbrido',
  };
  return labels[mode] || mode;
};

/**
 * Obtiene el label legible para un proveedor de autenticación
 */
export const getAuthenticationProviderLabel = (provider: AuthenticationProvider): string => {
  const labels: Record<AuthenticationProvider, string> = {
    [AuthenticationProvider.LOCAL]: 'Local',
    [AuthenticationProvider.AZURE_AD]: 'Azure AD',
    [AuthenticationProvider.GOOGLE]: 'Google',
    [AuthenticationProvider.OKTA]: 'Okta',
    [AuthenticationProvider.OIDC]: 'OpenID Connect',
    [AuthenticationProvider.SAML]: 'SAML 2.0',
  };
  return labels[provider] || provider;
};

