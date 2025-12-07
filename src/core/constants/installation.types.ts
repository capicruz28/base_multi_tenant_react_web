/**
 * Tipos de instalación del sistema
 * 
 * Basado en la tabla cliente de la BD:
 * - shared: Cliente usa la BD centralizada
 * - dedicated: Cliente tiene su propia BD en tu infraestructura
 * - onpremise: Cliente tiene BD en su servidor local
 * - hybrid: Cliente con BD local + sincronización con SaaS
 */
export enum InstallationType {
  SHARED = 'shared',
  DEDICATED = 'dedicated',
  ONPREMISE = 'onpremise',
  HYBRID = 'hybrid',
}

/**
 * Valida si un string es un tipo de instalación válido
 */
export const isValidInstallationType = (value: string): value is InstallationType => {
  return Object.values(InstallationType).includes(value as InstallationType);
};

/**
 * Obtiene el label legible para un tipo de instalación
 */
export const getInstallationTypeLabel = (type: InstallationType): string => {
  const labels: Record<InstallationType, string> = {
    [InstallationType.SHARED]: 'Compartida',
    [InstallationType.DEDICATED]: 'Dedicada',
    [InstallationType.ONPREMISE]: 'On-Premise',
    [InstallationType.HYBRID]: 'Híbrida',
  };
  return labels[type] || type;
};

