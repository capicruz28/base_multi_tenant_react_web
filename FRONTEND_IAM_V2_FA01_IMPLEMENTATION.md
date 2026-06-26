# FRONTEND IAM V2 — FA01 Session Identity Migration

**Documento:** `FRONTEND_IAM_V2_FA01_IMPLEMENTATION.md`  
**Versión:** 1.0.0  
**Fecha:** 2026-06-23  
**Estado:** IMPLEMENTADO  
**Fuente normativa:** `IAM_SESSION_MANAGEMENT_V2_BACKEND_SPECIFICATION.md`  
**Plan base:** `FRONTEND_IAM_V2_COMPLIANCE_AUDIT.md` — Fase A (P0)  

**Alcance:** FE-01, FE-02, FE-09, FE-10 exclusivamente.

---

## 1. Resumen

Migración del identificador de sesión de RC1 (`token_id` / `current_token_id`) al modelo canónico IAM V2 (`session_id` / `current_session_id`), con compatibilidad temporal RC1 vía `resolveSessionId()` y fallback `token_id` en `isCurrentSession`.

Sin cambios en UX, estilos, interceptores, login, refresh, logout, empresa ni impersonación.

---

## 2. Decisión arquitectónica

### 2.1 Helper central `resolveSessionId`

Ubicación: `src/features/admin/utils/iam-session-id.utils.ts`

```typescript
session.session_id?.trim() || session.token_id
```

**Uso único para:**
- Path param de revoke (admin y self)
- React `key` en tablas/cards de sesiones

**No se usa** para comparar `is_current` — ahí se comparan campos nativos (`session_id` vs `current_session_id`) antes del fallback token.

### 2.2 Contexto de match `CurrentSessionMatchContext`

`isCurrentSession(session, context)` recibe:

| Campo | Origen |
|-------|--------|
| `currentSessionId` | `auth.user.current_session_id` (GET `/me/`) |
| `currentTokenId` | `auth.user.current_token_id` (fallback RC1) |

**Prioridad de evaluación (spec §8.1 item 9):**

1. `session.is_current === true`
2. `session.session_id === current_session_id`
3. `session.token_id === current_token_id` (compat temporal)

### 2.3 Tipos aditivos

- `UserData.current_session_id` — opcional, normalizado en `auth.service.ts`
- `UserSessionRead.session_id` — opcional; `token_id` permanece obligatorio (refresh vigente, no ID de sesión)

### 2.4 Revoke

Services renombrados semánticamente a `sessionId`; valor enviado = `resolveSessionId(target)`.

Endpoints sin cambio de contrato:
- `POST /auth/sessions/{session_id}/revoke/`
- `POST /auth/sessions/{session_id}/revoke_admin/`

---

## 3. Archivos modificados

### Nuevos (2)

| Archivo | Propósito |
|---------|-----------|
| `src/features/admin/utils/iam-session-id.utils.ts` | `resolveSessionId()` |
| `src/features/admin/utils/__tests__/iam-session-id.utils.test.ts` | Tests helper |

### Modificados (14)

| Archivo | Cambio |
|---------|--------|
| `src/features/auth/types/auth.types.ts` | `current_session_id` en `UserData` |
| `src/features/auth/services/auth.service.ts` | Normalización `current_session_id` en `/me/` |
| `src/features/admin/types/session.types.ts` | `session_id` en DTOs; comentarios V2 |
| `src/features/admin/services/session.service.ts` | Revoke por `sessionId` |
| `src/features/admin/utils/iam-current-session.ts` | Refactor V2 + `CurrentSessionMatchContext` |
| `src/features/admin/utils/iam-session-revoke.utils.ts` | `resolveSessionId(target)` en revoke |
| `src/features/admin/hooks/useRevokeSession.ts` | Contexto dual session/token |
| `src/features/admin/hooks/useMySessionsList.ts` | Contexto dual session/token |
| `src/features/admin/components/iam/sessions/ActiveSessionsTableView.tsx` | `key={resolveSessionId(session)}` |
| `src/features/admin/components/iam/sessions/ActiveSessionsCardsView.tsx` | `key={resolveSessionId(session)}` |
| `src/features/admin/utils/iam-session-list-order.utils.ts` | Comentario V2 |
| `src/features/admin/utils/__tests__/iam-current-session.utils.test.ts` | Escenarios V2 + RTR |
| `src/features/admin/pages/__tests__/ActiveSessionsPage.post-revoke.test.ts` | Assert `session_id` en revoke |
| `src/features/admin/hooks/__tests__/useRevokeSession.test.ts` | Assert `session_id` en self-revoke |
| `src/features/auth/services/__tests__/auth-me-current-token-id.test.ts` | Tests `current_session_id` |

**Total:** 16 archivos (2 nuevos + 14 modificados)

---

## 4. Compatibilidad RC1 → V2

| Escenario | Comportamiento |
|-----------|----------------|
| Backend V2 con `session_id` + `current_session_id` | Identidad canónica V2; revoke y keys usan `session_id` |
| Backend RC1 sin `session_id` | `resolveSessionId` → `token_id`; revoke funciona vía alias BE |
| RTR: `token_id` cambia, `session_id` estable | `isCurrentSession` match por `session_id`; keys estables |
| `/me/` solo con `current_token_id` | Fallback nivel 3 en `isCurrentSession` |
| Payload mixto V2+RC1 | Sin ruptura; campos extra ignorados en lógica de identidad |

**Transición:** no se elimina `token_id` del modelo — permanece como refresh vigente y fallback estrictamente donde la spec lo permite.

---

## 5. Riesgos

| Riesgo | Mitigación implementada |
|--------|-------------------------|
| Backend antiguo sin `session_id` en listado | `resolveSessionId` fallback a `token_id` |
| Tests/fixtures sin `session_id` | Tests RC1-only explícitos (post-revoke) |
| Regresión probe post-revoke | Tests mantienen lógica probe; context V2 |
| Confusión token vs session en UI | Sin cambio visual; IDs nunca mostrados (E-ME4) |

**Riesgo residual:** entornos con backend V2 activo pero `/me/` sin `current_session_id` dependerán del fallback `current_token_id` hasta que BE lo exponga (comportamiento spec-compliant como fallback).

---

## 6. Pruebas ejecutadas

```bash
npx vitest run \
  src/features/admin/utils/__tests__/iam-current-session.utils.test.ts \
  src/features/admin/utils/__tests__/iam-session-id.utils.test.ts \
  src/features/admin/pages/__tests__/ActiveSessionsPage.post-revoke.test.ts \
  src/features/admin/hooks/__tests__/useRevokeSession.test.ts \
  src/features/auth/services/__tests__/auth-me-current-token-id.test.ts \
  src/features/admin/hooks/__tests__/useMySessionsList.test.ts \
  src/features/admin/components/iam/sessions/__tests__/active-sessions-views.enterprise.test.tsx
```

**Resultado:** 7 archivos, **41 tests passed**, 0 failed.

---

## 7. Cobertura obtenida

| Módulo | Tests | Escenarios clave |
|--------|-------|------------------|
| `iam-session-id.utils` | 2 | V2 priority, RC1 fallback |
| `iam-current-session` | 10 | Prioridad triple, RTR, case-insensitive, RC1 |
| `auth.service.me` | 8 | `current_session_id` + `current_token_id` normalize |
| `iam-session-revoke` (admin) | 9 | Revoke con `session_id`, RC1 fallback, probe |
| `iam-session-revoke` (self) | 5 | Self-revoke `session_id`, probe remoto |
| `useMySessionsList` | 3 | Sort current-first (sin regresión) |
| `active-sessions-views` | 4 | UX sin regresión (mock `isCurrentSession`) |

Cobertura funcional FA01: **100 %** de los criterios FE-01/02/09/10 en paths implementados.

---

## 8. Criterios FE cerrados

| ID | Estado FA01 | Evidencia |
|----|-------------|-----------|
| **FE-01** | ✅ **CERRADO** | `resolveSessionId` en keys React y revoke; `session_id` en tipos |
| **FE-02** | ✅ **CERRADO** | ID canónico = `session_id`; `token_id` solo refresh/fallback |
| **FE-09** | ✅ **CERRADO** | `current_session_id` en UserData + hooks; prioridad spec en `isCurrentSession` |
| **FE-10** | ✅ **CERRADO** | Revoke envía `resolveSessionId(session)` → preferencia `session_id` |

**No implementados (fuera de alcance FA01):** FE-21, FE-23, FE-24.

---

## 9. Autoauditoría FE-01 / FE-02 / FE-09 / FE-10

### FE-01 — Usa `session_id` como identificador en UI y revoke

| Verificación | Resultado |
|--------------|-----------|
| `session_id` en `UserSessionRead` / `AdminSessionRead` | ✅ |
| React keys: `resolveSessionId(session)` en TableView y CardsView | ✅ |
| Revoke path: `resolveSessionId(target)` → `session_id` preferido | ✅ |
| Test: `revokeSessionById(CURRENT_SESSION_ID)` | ✅ |
| Test: `revokeSessionSelf(CURRENT_SESSION_ID)` | ✅ |

**Veredicto FE-01:** ✅ **CUMPLE**

---

### FE-02 — No usa `token_id` como ID de sesión en V2

| Verificación | Resultado |
|--------------|-----------|
| Revoke primario usa `session_id` cuando presente | ✅ |
| Keys React usan `session_id` cuando presente | ✅ |
| `token_id` solo en fallback `resolveSessionId` y match RC1 nivel 3 | ✅ |
| Comentarios en tipos: `token_id` = refresh vigente, no ID sesión | ✅ |
| Test RTR: match por `session_id` aunque `token_id` rotó | ✅ |

**Veredicto FE-02:** ✅ **CUMPLE** (fallback RC1 documentado y acotado)

---

### FE-09 — `is_current` vía `current_session_id` (/me/, fallback `current_token_id`)

| Verificación | Resultado |
|--------------|-----------|
| `current_session_id` en `UserData` | ✅ |
| Normalización en `normalizeUserData` | ✅ |
| Hooks consumen `current_session_id` + `current_token_id` | ✅ |
| Prioridad: `is_current` → `session_id` → `token_id` | ✅ |
| Test `/me/` normaliza `current_session_id` | ✅ |
| Test fallback `session_id` case-insensitive | ✅ |

**Veredicto FE-09:** ✅ **CUMPLE**

---

### FE-10 — Revoke remoto usa `session_id` del listado

| Verificación | Resultado |
|--------------|-----------|
| `executeActiveSessionRevoke` → `resolveSessionId(target)` | ✅ |
| `executeSelfSessionRevoke` → `resolveSessionId(target)` | ✅ |
| Services: param `sessionId` en path | ✅ |
| Test admin: `toHaveBeenCalledWith('session-browser-a')` | ✅ |
| Test RC1 sin session_id: fallback `token-browser-a` | ✅ |

**Veredicto FE-10:** ✅ **CUMPLE**

---

## 10. Declaración final FA01

| Atributo | Valor |
|----------|-------|
| Fase | FA01 — Session Identity Migration |
| Criterios objetivo | FE-01, FE-02, FE-09, FE-10 |
| Estado | **COMPLETADO** |
| Backend modificado | No |
| Contrato OpenAPI modificado | No |
| UX / estilos modificados | No |
| Tests FA01 | 41/41 passed |
| Cumplimiento FA01 | **100 %** |

**Los cuatro criterios FE de FA01 quedan completamente cumplidos** en el código desplegado de esta fase, con compatibilidad temporal RC1 acotada a `resolveSessionId` y fallback nivel 3 de `isCurrentSession`.

---

**Fin del documento — FRONTEND IAM V2 FA01 Implementation v1.0.0**
