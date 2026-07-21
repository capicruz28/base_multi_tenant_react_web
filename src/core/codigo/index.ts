/**
 * Shell público — Frontend Code Generation Engine (FCE)
 * Exports congelados para consumo desde features.
 */

// Types
export type {
  CodigoAssignmentMode,
  CodigoAutoPanelCopy,
  CodigoDirtySnapshot,
  CodigoFieldError,
  CodigoFieldMode,
  CodigoFieldViewModel,
  CodigoGenerationPolicy,
  CodigoPayloadSlice,
  CodigoRegistryEntry,
  CodigoRegistryMeta,
  CodigoUiPhase,
  PolicyBehaviorProfile,
} from './engine/codigo-engine.types';

// Registry
export {
  assertRegistryValid,
  clearCodigoRegistryForTests,
  getCodigoEntry,
  listAllCodigoEntries,
  listCodigoEntriesByModule,
  registerCodigoManifest,
  tryGetCodigoEntry,
} from './engine/codigo-registry';

// Engine (pure functions — testeables sin React)
export { resolvePolicyBehavior } from './engine/policy-resolver';
export { getPolicyBehaviorProfile } from './engine/policy-profiles';
export { buildCodigoPayloadSlice, mergeCodigoIntoPayload } from './engine/payload-builder';
export type { BuildCodigoPayloadInput } from './engine/payload-builder';
export { mapCodigoFieldError, applyCodigoFieldErrorToController } from './engine/error-mapper';
export {
  CODIGO_INITIAL_STATE,
  createInitialCodigoState,
  transitionCodigoState,
} from './engine/state-machine';
export { buildCodigoFieldViewModel } from './engine/view-model-builder';
export type { BuildCodigoFieldViewModelInput } from './engine/view-model-builder';

// Controller
export { useCodigoFieldController } from './hooks/useCodigoFieldController';
export type {
  CodigoFieldControllerActions,
  CodigoFieldControllerResult,
  UseCodigoFieldControllerOptions,
} from './hooks/useCodigoFieldController';
export { useCodigoRegistryEntry } from './hooks/useCodigoRegistryEntry';
export { useCodigoRuntimeSnapshot } from './hooks/useCodigoRuntimeSnapshot';
export { CODIGO_RUNTIME_SNAPSHOT_STALE_TIME_MS } from './hooks/useCodigoRuntimeSnapshot';

// Runtime Snapshot (infra — sin cableado Engine aún)
export type {
  CodigoRuntimeNormalizeCase,
  CodigoRuntimeScopeContext,
  CodigoRuntimeScopeType,
  CodigoRuntimeSequenceItem,
  CodigoRuntimeSnapshot,
  ResolveRuntimeSequenceResult,
} from './runtime/runtime-snapshot.types';
export {
  CODIGO_RUNTIME_QUERY_KEY_PREFIX,
  codigoRuntimeQueryKeys,
} from './runtime/runtime-snapshot.query-keys';
export { codigoRuntimeSnapshotService } from './runtime/runtime-snapshot.service';
export { resolveRuntimeSequence } from './runtime/resolve-runtime-sequence';
export { resolveEffectiveCodigoPolicy } from './runtime/resolve-effective-codigo-policy';
export type {
  RuntimePolicyResolution,
  ResolveEffectiveCodigoPolicyInput,
  ResolveEffectiveCodigoPolicyResult,
} from './runtime/resolve-effective-codigo-policy';
export {
  invalidateCodigoRuntimeSnapshot,
  removeCodigoRuntimeSnapshot,
} from './runtime/invalidate-runtime-snapshot';

// Integration helpers
export { isCodigoFieldDirty } from './integration/codigo-dirty.utils';
