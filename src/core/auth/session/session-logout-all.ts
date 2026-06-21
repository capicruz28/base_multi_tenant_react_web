/**
 * Orquestador Logout All — IAM-FE-PHASE-03 IMPL-02.
 * POST /auth/logout_all/ → terminación local vía DI; sin HTTP, React ni router directos.
 */

/** Entrada del flujo logout all (consumida por wiring IMPL-04 al armar terminate). */
export interface LogoutAllFlowInput {
  /** Hereda semántica `terminateSession`. Default implícito: true. */
  preservePreLoginBranding?: boolean;
  /** Omite redirect en terminación. Default implícito: false. Solo tests. */
  skipRedirect?: boolean;
}

/** Dependencias inyectadas desde AuthContext (IMPL-04). */
export interface LogoutAllFlowDeps {
  getIsTerminating: () => boolean;
  callLogoutAllEndpoint: () => Promise<void>;
  runTerminateAfterLogoutAll: () => Promise<void>;
  /** Opcional: logging DEV cuando logout_all falla (toast vive en mutation UI). */
  onLogoutAllRejected?: (error: unknown) => void;
}

/**
 * Orquesta logout all contractual (§6.1, §9.3):
 * 1. Guard `getIsTerminating()` — no-op idempotente
 * 2. `callLogoutAllEndpoint()`
 * 3. Error → opcional `onLogoutAllRejected`; propagar; **sin** terminate
 * 4. 200 → `runTerminateAfterLogoutAll()` únicamente
 *
 * `input` se acepta por contrato; el wiring IMPL-04 lo cierra en `runTerminateAfterLogoutAll`.
 */
export async function executeLogoutAllFlow(
  input: LogoutAllFlowInput,
  deps: LogoutAllFlowDeps,
): Promise<void> {
  void input;

  if (deps.getIsTerminating()) {
    return;
  }

  try {
    await deps.callLogoutAllEndpoint();
  } catch (error) {
    deps.onLogoutAllRejected?.(error);
    throw error;
  }

  await deps.runTerminateAfterLogoutAll();
}
