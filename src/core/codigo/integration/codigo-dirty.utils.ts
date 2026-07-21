import type { CodigoDirtySnapshot } from '../engine/codigo-engine.types';

export function isCodigoFieldDirty(
  current: CodigoDirtySnapshot,
  baseline: CodigoDirtySnapshot,
): boolean {
  return (
    current.assignmentMode !== baseline.assignmentMode ||
    current.value.trim() !== baseline.value.trim()
  );
}
