import type {
  CodigoFieldMode,
  CodigoGenerationPolicy,
  PolicyBehaviorProfile,
} from './codigo-engine.types';

function baseProfile(
  policy: CodigoGenerationPolicy,
  mode: CodigoFieldMode,
): PolicyBehaviorProfile {
  switch (policy) {
    case 'AUTO_DEFAULT':
      return {
        policy,
        mode,
        allowsManualOnCreate: mode === 'create',
        defaultAssignmentMode: 'auto',
        createPresentation: 'auto_panel',
        updatePresentation: 'editable',
      };
    case 'AUTO_REQUIRED':
      return {
        policy,
        mode,
        allowsManualOnCreate: false,
        defaultAssignmentMode: 'auto',
        createPresentation: 'locked_panel',
        updatePresentation: mode === 'read' ? 'readonly' : 'readonly',
      };
    case 'MANUAL_ONLY':
      return {
        policy,
        mode,
        allowsManualOnCreate: false,
        defaultAssignmentMode: 'manual',
        createPresentation: 'manual_input',
        updatePresentation: mode === 'read' ? 'readonly' : 'editable',
      };
    default: {
      const _exhaustive: never = policy;
      throw new Error(`Policy no soportada: ${String(_exhaustive)}`);
    }
  }
}

export function getPolicyBehaviorProfile(
  policy: CodigoGenerationPolicy,
  mode: CodigoFieldMode,
): PolicyBehaviorProfile {
  const profile = baseProfile(policy, mode);

  if (mode === 'read') {
    return {
      ...profile,
      createPresentation: profile.createPresentation,
      updatePresentation: 'readonly',
    };
  }

  if (mode === 'update' && policy === 'AUTO_REQUIRED') {
    return {
      ...profile,
      updatePresentation: 'readonly',
    };
  }

  return profile;
}
