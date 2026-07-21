import type { CodigoAutoPanelCopy, CodigoRegistryEntry } from './codigo-engine.types';

const DEFAULT_MAX_LENGTH = 20;

export function resolveCodigoFieldLabel(entry: CodigoRegistryEntry, override?: string): string {
  if (override?.trim()) {
    return override.trim();
  }
  if (entry.meta.entityLabel?.trim()) {
    return `Código de ${entry.meta.entityLabel.trim()}`;
  }
  return 'Código';
}

export function resolveAutoPanelCopy(
  entry: CodigoRegistryEntry,
  formatExample?: string,
): CodigoAutoPanelCopy {
  const entity = entry.meta.entityLabel?.trim() ?? 'registro';
  const prefix = entry.meta.prefixHint?.trim();
  const example = entry.meta.exampleFormat?.trim();

  const resolvedExample =
    formatExample?.trim() ||
    (prefix
      ? example
        ? `${prefix}${example}`
        : undefined
      : example || undefined);

  return {
    title: 'Se asignará automáticamente',
    description: `El sistema generará el código de ${entity} al guardar.`,
    hint: resolvedExample ? `Formato esperado` : undefined,
    formatExample: resolvedExample,
  };
}

/** AUTO_DEFAULT — override consciente */
export function resolveManualToggleLabel(): string {
  return 'Modificar código';
}

export function resolveRevertToAutoLabel(): string {
  return 'Volver al automático';
}

export function resolveManualOverrideConfirmTitle(): string {
  return 'Modificar código';
}

export function resolveManualOverrideConfirmMessage(): string {
  return 'Si ingresa el código manualmente, el sistema no lo asignará de forma automática. ¿Desea continuar?';
}

export function resolveUpdateWarningCopy(): string {
  return 'Modificar el código puede afectar integraciones o referencias existentes.';
}

export function resolveCodigoMaxLength(entry: CodigoRegistryEntry): number {
  return entry.meta.maxLength ?? DEFAULT_MAX_LENGTH;
}

export function resolveManualHint(entry: CodigoRegistryEntry): string | undefined {
  const example = entry.meta.exampleFormat?.trim();
  const prefix = entry.meta.prefixHint?.trim();
  if (prefix && example) {
    return `Ejemplo: ${prefix}${example}`;
  }
  if (example) {
    return `Ejemplo: ${example}`;
  }
  return undefined;
}
