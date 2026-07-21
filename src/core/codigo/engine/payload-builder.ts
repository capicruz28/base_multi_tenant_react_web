import type {
  CodigoAssignmentMode,
  CodigoFieldMode,
  CodigoPayloadSlice,
  CodigoRegistryEntry,
  PolicyBehaviorProfile,
} from './codigo-engine.types';

export interface BuildCodigoPayloadInput {
  entry: CodigoRegistryEntry;
  mode: CodigoFieldMode;
  profile: PolicyBehaviorProfile;
  assignmentMode: CodigoAssignmentMode;
  value: string;
}

function trimValue(value: string): string {
  return value.trim();
}

/**
 * Construye el slice de payload para el campo código.
 * Regla FCE-P-08: auto → propiedad ausente (undefined).
 */
export function buildCodigoPayloadSlice(input: BuildCodigoPayloadInput): CodigoPayloadSlice {
  const { entry, mode, profile, assignmentMode, value } = input;
  const trimmed = trimValue(value);

  if (mode === 'read') {
    return { fieldKey: entry.fieldKey, value: undefined };
  }

  if (mode === 'create') {
    switch (profile.policy) {
      case 'AUTO_DEFAULT':
        if (assignmentMode === 'auto') {
          return { fieldKey: entry.fieldKey, value: undefined };
        }
        return {
          fieldKey: entry.fieldKey,
          value: trimmed.length > 0 ? trimmed : undefined,
        };
      case 'AUTO_REQUIRED':
        return { fieldKey: entry.fieldKey, value: undefined };
      case 'MANUAL_ONLY':
        return {
          fieldKey: entry.fieldKey,
          value: trimmed.length > 0 ? trimmed : undefined,
        };
      default: {
        const _exhaustive: never = profile.policy;
        throw new Error(`Policy no soportada: ${String(_exhaustive)}`);
      }
    }
  }

  // UPDATE
  if (profile.updatePresentation === 'readonly') {
    return {
      fieldKey: entry.fieldKey,
      value: trimmed.length > 0 ? trimmed : undefined,
    };
  }

  return {
    fieldKey: entry.fieldKey,
    value: trimmed.length > 0 ? trimmed : undefined,
  };
}

export function mergeCodigoIntoPayload<T extends Record<string, unknown>>(
  payload: T,
  slice: CodigoPayloadSlice,
): T {
  const next = { ...payload };

  if (slice.value === undefined) {
    delete next[slice.fieldKey];
  } else {
    next[slice.fieldKey] = slice.value;
  }

  return next;
}
