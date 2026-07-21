import type { CodigoGenerationPolicy, CodigoRegistryEntry } from './codigo-engine.types';

const VALID_POLICIES = new Set<CodigoGenerationPolicy>([
  'AUTO_DEFAULT',
  'AUTO_REQUIRED',
  'MANUAL_ONLY',
]);

export function assertRegistryEntriesValid(entries: readonly CodigoRegistryEntry[]): void {
  const seenKeys = new Set<string>();

  for (const entry of entries) {
    if (!entry.sequenceKey.trim()) {
      throw new Error('Codigo registry: sequenceKey vacío.');
    }
    if (seenKeys.has(entry.sequenceKey)) {
      throw new Error(`Codigo registry: sequenceKey duplicado "${entry.sequenceKey}".`);
    }
    seenKeys.add(entry.sequenceKey);

    if (!entry.moduleCode.trim()) {
      throw new Error(`Codigo registry "${entry.sequenceKey}": moduleCode vacío.`);
    }
    if (!entry.entityKey.trim()) {
      throw new Error(`Codigo registry "${entry.sequenceKey}": entityKey vacío.`);
    }
    if (!entry.fieldKey.trim()) {
      throw new Error(`Codigo registry "${entry.sequenceKey}": fieldKey vacío.`);
    }
    if (!VALID_POLICIES.has(entry.policy)) {
      throw new Error(`Codigo registry "${entry.sequenceKey}": policy inválida.`);
    }
  }
}
