const SAGA_ERROR_MESSAGES: Record<string, string> = {
  PROVISIONING_CREATE_DATABASE_FAILED: 'Error al crear base de datos',
  PROVISIONING_SCHEMA_FAILED: 'Error al aplicar esquema',
  PROVISIONING_CATALOG_FAILED: 'Error al cargar catálogos',
  PROVISIONING_SEED_FAILED: 'Error al inicializar datos tenant',
  PROVISIONING_METADATA_FAILED: 'Error al registrar conexión',
  PROVISIONING_ACTIVATION_FAILED: 'Error al activar routing',
  PROVISIONING_ABORTED: 'Provisioning cancelado por operador',
};

/**
 * Mensaje UI para errores de saga — contrato UI §11 (sin secrets).
 */
export function getProvisioningSagaErrorMessage(
  errorCode: string | null | undefined,
  fallbackMessage: string | null | undefined,
): string {
  if (errorCode && SAGA_ERROR_MESSAGES[errorCode]) {
    return SAGA_ERROR_MESSAGES[errorCode];
  }
  if (typeof fallbackMessage === 'string' && fallbackMessage.trim()) {
    return fallbackMessage.trim();
  }
  return 'Ocurrió un error durante el provisioning. Contacte a soporte.';
}
