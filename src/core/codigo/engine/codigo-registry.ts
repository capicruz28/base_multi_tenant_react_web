import type { CodigoRegistryEntry } from './codigo-engine.types';
import { assertRegistryEntriesValid } from './codigo-registry.validation';

const registry = new Map<string, CodigoRegistryEntry>();

export function registerCodigoManifest(
  moduleCode: string,
  entries: readonly CodigoRegistryEntry[],
): void {
  for (const entry of entries) {
    if (entry.moduleCode !== moduleCode) {
      throw new Error(
        `Codigo manifest mismatch: entry "${entry.sequenceKey}" declara moduleCode "${entry.moduleCode}" pero el manifest es "${moduleCode}".`,
      );
    }

    if (registry.has(entry.sequenceKey)) {
      throw new Error(
        `Codigo registry duplicate sequenceKey "${entry.sequenceKey}" (module "${moduleCode}").`,
      );
    }

    registry.set(entry.sequenceKey, { ...entry });
  }
}

export function getCodigoEntry(sequenceKey: string): CodigoRegistryEntry {
  const entry = registry.get(sequenceKey);
  if (!entry) {
    throw new Error(
      `Codigo registry: sequenceKey "${sequenceKey}" no registrado. Registre el manifest del módulo antes de usar CodigoField.`,
    );
  }
  return entry;
}

export function tryGetCodigoEntry(sequenceKey: string): CodigoRegistryEntry | undefined {
  return registry.get(sequenceKey);
}

export function listCodigoEntriesByModule(moduleCode: string): CodigoRegistryEntry[] {
  return [...registry.values()].filter((entry) => entry.moduleCode === moduleCode);
}

export function listAllCodigoEntries(): CodigoRegistryEntry[] {
  return [...registry.values()];
}

export function assertRegistryValid(): void {
  assertRegistryEntriesValid(listAllCodigoEntries());
}

/** Solo tests — no usar en producción */
export function clearCodigoRegistryForTests(): void {
  registry.clear();
}
