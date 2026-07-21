import type { CodigoFieldMode, CodigoRegistryEntry, PolicyBehaviorProfile } from './codigo-engine.types';
import { getPolicyBehaviorProfile } from './policy-profiles';

export function resolvePolicyBehavior(
  entry: CodigoRegistryEntry,
  mode: CodigoFieldMode,
): PolicyBehaviorProfile {
  return getPolicyBehaviorProfile(entry.policy, mode);
}
