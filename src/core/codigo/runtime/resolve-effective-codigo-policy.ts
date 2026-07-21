/**
 * Resolución de generation_policy — Runtime Snapshot es el único SSOT.
 * No usa Manifest.policy. Estados no-resueltos quedan explícitos.
 */

import type { CodigoGenerationPolicy } from '../engine/codigo-engine.types';
import { resolveRuntimeSequence } from './resolve-runtime-sequence';
import type {
  CodigoRuntimeScopeContext,
  CodigoRuntimeSequenceItem,
  CodigoRuntimeSnapshot,
} from './runtime-snapshot.types';

const VALID_POLICIES = new Set<string>([
  'AUTO_DEFAULT',
  'AUTO_REQUIRED',
  'MANUAL_ONLY',
]);

function asCodigoGenerationPolicy(
  value: string,
): CodigoGenerationPolicy | null {
  if (VALID_POLICIES.has(value)) {
    return value as CodigoGenerationPolicy;
  }
  return null;
}

export type RuntimePolicyResolution =
  | {
      status: 'resolved';
      policy: CodigoGenerationPolicy;
      item: CodigoRuntimeSequenceItem;
    }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'not_found' }
  | { status: 'inactive'; item: CodigoRuntimeSequenceItem }
  | { status: 'invalid_policy'; item: CodigoRuntimeSequenceItem };

export interface ResolveEffectiveCodigoPolicyInput {
  sequenceKey: string;
  snapshot: CodigoRuntimeSnapshot | undefined;
  isSnapshotLoading: boolean;
  isSnapshotError: boolean;
  scopeContext?: CodigoRuntimeScopeContext;
}

/**
 * Única fuente: Runtime Snapshot.
 * loading | error | not_found | inactive | invalid_policy | resolved
 */
export function resolveEffectiveCodigoPolicy(
  input: ResolveEffectiveCodigoPolicyInput,
): RuntimePolicyResolution {
  const {
    sequenceKey,
    snapshot,
    isSnapshotLoading,
    isSnapshotError,
    scopeContext,
  } = input;

  if (isSnapshotLoading) {
    return { status: 'loading' };
  }

  if (isSnapshotError || !snapshot) {
    return { status: 'error' };
  }

  const resolved = resolveRuntimeSequence({
    snapshot,
    sequenceKey,
    scopeContext,
  });

  if (resolved.status === 'not_found') {
    return { status: 'not_found' };
  }

  if (resolved.status === 'inactive') {
    return { status: 'inactive', item: resolved.item };
  }

  const runtimePolicy = asCodigoGenerationPolicy(
    String(resolved.item.generation_policy),
  );
  if (!runtimePolicy) {
    return { status: 'invalid_policy', item: resolved.item };
  }

  return {
    status: 'resolved',
    policy: runtimePolicy,
    item: resolved.item,
  };
}

/** @deprecated Alias — usar RuntimePolicyResolution */
export type ResolveEffectiveCodigoPolicyResult = RuntimePolicyResolution;
