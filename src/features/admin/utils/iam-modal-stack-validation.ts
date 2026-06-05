/**
 * Validación temporal post-cierre de modales IAM (Sprint B.1.1).
 * Verifica que Radix no deje body lock ni overlays huérfanos.
 * Remover o desactivar cuando QA confirme estabilidad.
 */
const LOG_PREFIX = '[IAM Modal Cleanup]';

export interface ModalStackValidationResult {
  context: string;
  bodyOverflow: string;
  bodyPointerEvents: string;
  radixOverlayCount: number;
  ok: boolean;
  issues: string[];
}

export function validateModalStackCleanup(context: string): ModalStackValidationResult {
  const bodyOverflow = document.body.style.overflow;
  const bodyPointerEvents = document.body.style.pointerEvents;
  const overlays = document.querySelectorAll('[data-radix-dialog-overlay]');
  const issues: string[] = [];

  if (bodyOverflow === 'hidden') {
    issues.push('body.style.overflow sigue en "hidden"');
  }
  if (bodyPointerEvents === 'none') {
    issues.push('body.style.pointerEvents sigue en "none"');
  }
  if (overlays.length > 0) {
    issues.push(`${overlays.length} overlay(s) Radix residual(es) en DOM`);
  }

  const result: ModalStackValidationResult = {
    context,
    bodyOverflow: bodyOverflow || '(vacío)',
    bodyPointerEvents: bodyPointerEvents || '(vacío)',
    radixOverlayCount: overlays.length,
    ok: issues.length === 0,
    issues,
  };

  console.group(`${LOG_PREFIX} ${context}`);
  console.info('body.overflow:', result.bodyOverflow);
  console.info('body.pointerEvents:', result.bodyPointerEvents);
  console.info('radix overlays:', result.radixOverlayCount);
  overlays.forEach((node, index) => {
    console.info(`overlay[${index}] data-state:`, node.getAttribute('data-state'));
  });
  if (result.ok) {
    console.info('Resultado: OK — stack de modales limpio');
  } else {
    console.warn('Resultado: PROBLEMAS —', issues.join('; '));
  }
  console.groupEnd();

  return result;
}

/** Ejecuta validación tras el siguiente paint (post-teardown Radix). */
export function scheduleModalStackValidation(context: string): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      validateModalStackCleanup(context);
    });
  });
}
