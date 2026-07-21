import { useMemo } from 'react';

import type { CodigoRegistryEntry } from '../engine/codigo-engine.types';
import { getCodigoEntry } from '../engine/codigo-registry';

export function useCodigoRegistryEntry(sequenceKey: string): CodigoRegistryEntry {
  return useMemo(() => getCodigoEntry(sequenceKey), [sequenceKey]);
}
