# Recomendación arquitectónica — Persistencia de sesión impersonada (F5)

**Fecha:** 02 jun 2026  
**Estado:** Solo diseño — **sin implementación, sin código, sin commit**  
**Base:** [`PLATFORM_IMPERSONATION_F5_SESSION_LOSS_AUDIT.md`](./PLATFORM_IMPERSONATION_F5_SESSION_LOSS_AUDIT.md) (causa raíz confirmada en QA)

---

## 1. Objetivos funcionales (criterios de aceptación)

| # | Criterio |
|---|----------|
| O-1 | La sesión impersonada **sobrevive a F5** en `/app/*` y `/admin/*` (shells tenant). |
| O-2 | Tras F5, el usuario permanece **tenant_admin impersonado** (`is_impersonation` en JWT y perfil coherente). |
| O-3 | El banner **Modo soporte activo** sigue visible (depende de `isImpersonation` + shells tenant — ya corregido en layout). |
| O-4 | **No** se restaura automáticamente la sesión platform si la impersonación sigue siendo válida. |
| O-5 | Salir de soporte (`endImpersonation` / logout en modo soporte) sigue restaurando platform de forma explícita (IMP-03). |

---

## 2. Diagnóstico resumido (por qué hace falta una estrategia)

Hoy el stack de impersonación es **asimétrico**:

| Capa | Platform (padre) | Impersonación (soporte) |
|------|------------------|-------------------------|
| Persistencia | `sessionStorage` → `platform_parent_session` | **Solo memoria** (`authRef`) |
| Refresh | Cookie HttpOnly + `POST /auth/refresh/` | **No** (contrato: sin refresh; TTL ~2h) |
| Bootstrap F5 | Refresh cookie → token platform | Si hay parent y **no** hay token en memoria → **`restorePlatformSession()`** |

El fallo no es RBAC ni selección de empresa: es **rehidratación post-F5** sin token impersonado persistido.

---

## 3. Comparativa de estrategias

### Estrategia 1 — Persistir access token impersonado en `sessionStorage`

**Idea:** Espejar el patrón de `platform_parent_session` con una segunda clave, p. ej. `impersonation_support_session`, que guarde el **access token** de soporte (y opcionalmente metadatos mínimos: `savedAt`, `clienteLabel`).

**Flujo bootstrap propuesto (orden):**

1. Selección empresa pendiente → sin cambios.
2. Si `hasPlatformParentSession()` **y** existe token impersonado persistido:
   - Hidratar `authRef` / `setAuth` con ese token.
   - `initializeAuth()` → `/auth/me` + menú.
   - Si `/auth/me` confirma `is_impersonation` → **permanecer en soporte** (no llamar `restorePlatformSession`).
   - Si token inválido/expirado (401, claims sin `is_impersonation`) → política explícita: `endImpersonation` o `restorePlatformSession` (no restore silencioso por “memoria vacía”).
3. Si `hasPlatformParentSession()` **sin** token impersonado persistido → mantener restore actual (estado huérfano / salida de soporte).
4. Si no hay parent → `POST /auth/refresh/` estándar (login operativo / platform).

**Puntos de escritura/lectura:**

| Evento | Acción |
|--------|--------|
| `applyFullSessionToken` (incl. `completeEmpresaSelection`) | `saveImpersonationSupportSession(access_token)` si `is_impersonation` |
| `startImpersonation` Schema B directo | Idem tras `applyFullSessionToken` |
| `endImpersonation` / `restorePlatformSession` / `doLogout` | `clearImpersonationSupportSession()` + `clearPlatformParentSession()` |
| Bootstrap F5 | Leer token impersonado **antes** de rama `restorePlatformSession` |

#### Ventajas

| Ventaja | Detalle |
|---------|---------|
| Alineado con arquitectura actual | Ya existe `platform-parent-session.ts`; mismo patrón mental y de limpieza. |
| Sin dependencia de backend | Contrato actual: impersonación **sin refresh token** (`FLUJO_AUTH_MULTIEMPRESA_FE.md`). |
| Cambio acotado en FE | Principalmente `AuthContext` bootstrap + util nueva + hooks de limpieza en salida de soporte. |
| Cumple O-1…O-4 | Rehidrata token tras F5; no dispara restore si token válido. |
| Compatible con `completeEmpresaSelection` | Tras seleccionar empresa, persistir en el mismo `applyFullSessionToken`. |
| Compatible con interceptores | `isImpersonationSupportMode` ya evita refresh automático en 401 genérico durante soporte. |

#### Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Access token en `sessionStorage` (XSS) | Mismo riesgo que cualquier JWT en SPA; el padre **ya** está en `sessionStorage`. Minimizar superficie: solo access token, TTL corto (~2h), borrar al salir. |
| Cookie `refresh_token` de **platform** sigue en el navegador | Bootstrap **no** debe usar `refreshToken()` cuando exista parent + token impersonado persistido (hoy el bug es restore, no refresh — pero hay que blindar). |
| Token expirado en storage | Decodificar `exp` del JWT; si expirado → `clearImpersonationSupportSession` + flujo de salida explícito (no restore ciego). |
| Desincronización token storage vs cookie refresh | Tras impersonar, las APIs usan Bearer del storage; no mezclar refresh platform en ese estado. |

#### Compatibilidad con componentes actuales

| Componente | Compatibilidad |
|--------------|----------------|
| `AuthContext` | **Alta** — bootstrap y `applyFullSessionToken` son el hogar natural. |
| `restorePlatformSession` | **Alta** — añadir clear de sesión impersonada; no cambiar semántica de restore explícito. |
| `completeEmpresaSelection` | **Alta** — sin cambio de API; solo persistir al final de `applyFullSessionToken`. |
| `startImpersonationHandler` | **Alta** — Schema A ya deja parent en storage; Schema B persiste en apply. |
| `NewLayout` / banner | **Alta** — `isImpersonation` se rehidrata desde token + `/auth/me`. |
| `PermissionGuard` / menú | **Alta** — `initializeAuth` recarga menú como hoy. |

---

### Estrategia 2 — Refresh de impersonación desde backend

**Idea:** Tras F5, `POST /auth/refresh/` (o endpoint dedicado) renueva el access token **en contexto impersonado**, con cookie HttpOnly propia de soporte.

#### Ventajas

| Ventaja | Detalle |
|---------|---------|
| Modelo “correcto” OAuth | Access token en memoria; refresh en cookie HttpOnly. |
| Menor exposición del access token en `sessionStorage` | Si el refresh funciona, el access podría vivir solo en memoria tras cada refresh. |
| TTL manejado en servidor | Renovación sin depender de `exp` en cliente. |

#### Riesgos

| Riesgo | Detalle |
|--------|------------|
| **Dependencia backend** | Contrato actual documenta impersonación **sin refresh**; hay que diseñar e implementar BE. |
| **Colisión de cookies** | Tras impersonar, la cookie `refresh_token` del **platform_admin** puede seguir presente. Un `POST /auth/refresh/` genérico podría devolver **platform**, no tenant impersonado — riesgo crítico de seguridad/UX. |
| Cambio en bootstrap FE | Hoy, con `hasPlatformParentSession()`, el camino por defecto tras F5 sin token en memoria es **restore**, no refresh. Habría que definir refresh impersonado explícito y **nunca** refresh platform mientras exista parent sin salir de soporte. |
| Interceptores | `isImpersonationSupportMode` **omite** refresh en 401; el bootstrap **sí** llama `refreshToken()` en rama sin parent — hay que rediseñar ambos caminos. |
| Plazo y pruebas | Dos repos, CORS/cookies, entornos `platform.app.local` vs tenant. |

#### Compatibilidad con arquitectura actual

| Componente | Compatibilidad |
|--------------|----------------|
| `AuthContext` bootstrap | **Media** — requiere contrato claro de qué cookie refresca qué sesión. |
| `auth-http.utils` | **Media** — `shouldSkipTokenRefresh` no distingue impersonation refresh. |
| `FLUJO_AUTH_MULTIEMPRESA_FE.md` | **Baja hasta actualizar** — hoy dice explícitamente “Sin refresh token”. |

**Veredicto estrategia 2:** Arquitectónicamente deseable a medio plazo, pero **no es la opción correcta para cerrar F5 ahora** sin proyecto backend coordinado y aislamiento de cookies platform vs impersonación.

---

### Estrategia 3 — Alternativas

| Alternativa | Descripción | Valoración |
|-------------|-------------|------------|
| **3a. Snapshot completo en sessionStorage** | Guardar `{ accessToken, userData, empresaActivaId }` | Redundante: `/auth/me` ya reconstruye user; aumenta riesgo de datos obsoletos. |
| **3b. sessionStorage solo access token (recomendada como 1)** | Mínimo necesario para F5 | **Óptima** relación costo/beneficio. |
| **3c. localStorage** | Persistencia entre pestañas | **No recomendada** — impersonación no debe sobrevivir otra pestaña sin control; peor para seguridad. |
| **3d. No persistir; cambiar bootstrap** | Si hay parent sin token en memoria → **no** restore; forzar login/impersonate de nuevo | Mala UX; no cumple O-1 de forma fluida. |
| **3e. Híbrida 1 + validación estricta** | Persistir token + en bootstrap **siempre** `GET /auth/me`; solo continuar si `is_impersonation`; si no → `endImpersonation` | **Recomendada como refinamiento de estrategia 1** — evita confiar ciegamente en storage. |

---

## 4. Matriz decisión

| Criterio | Estrategia 1 (sessionStorage token) | Estrategia 2 (BE refresh) | Estrategia 3e (1 + validación /me) |
|----------|-----------------------------------|---------------------------|-------------------------------------|
| Cumple O-1…O-4 | Sí | Sí (con BE correcto) | Sí |
| Cambio solo FE | Sí | No | Sí |
| Alineado con contrato actual | Sí | No (cambio contrato) | Sí |
| Riesgo cookie platform vs impersonación | Bajo (si bootstrap blindado) | Alto sin diseño BE | Bajo |
| Esfuerzo / time-to-fix | Bajo–medio | Alto | Bajo–medio |
| Seguridad vs XSS | Similar a padre ya en storage | Mejor para access | Similar + validación servidor |

---

## 5. Recomendación para este ERP

### Opción elegida: **Estrategia 3e — Persistir access token impersonado en `sessionStorage` + validación obligatoria en bootstrap**

Es la **estrategia 1** con una regla de oro: **nunca restaurar platform solo porque `authRef.token` es null tras F5**; restaurar platform solo en salida **explícita** de soporte o cuando la validación demuestre que el token impersonado ya no es válido.

### Por qué no estrategia 2 (ahora)

1. El contrato vigente en `docs/FLUJO_AUTH_MULTIEMPRESA_FE.md` define impersonación **sin refresh token**.
2. La cookie de refresh del login platform **sigue en el navegador** durante soporte; un refresh genérico es ambiguo y peligroso sin aislamiento backend.
3. El frontend ya resolvió el patrón “sesión padre en sessionStorage” para impersonación; extenderlo al hijo (token soporte) es el cambio mínimo coherente con IMP-01…IMP-04.

### Por qué no solo “arreglar bootstrap” sin persistir

Corregir únicamente la rama `restorePlatformSession` cuando hay parent (p. ej. no restaurar nunca en F5) **no rehidrata** al usuario impersonado: seguiría en platform o en pantalla de login. Hace falta **reponer el access token** tras F5; la persistencia en `sessionStorage` es el mecanismo más directo sin backend.

---

## 6. Diseño operativo propuesto (sin código)

### 6.1 Nuevo módulo utilitario (espejo de platform-parent)

| Responsabilidad | Detalle |
|-----------------|---------|
| Clave | `impersonation_support_session` (nombre sugerido) |
| Contenido mínimo | `{ accessToken: string }` opcional `savedAt: number` |
| API | `save` / `get` / `clear` / `has` |

No duplicar `userData` completo: `/auth/me` sigue siendo fuente de verdad tras rehidratar.

### 6.2 Reglas de ciclo de vida

```
startImpersonation
  → savePlatformParentSession (existente)
  → [Schema A | Schema B]
  → applyFullSessionToken
      → si is_impersonation: saveImpersonationSupportSession(access_token)

completeEmpresaSelection
  → applyFullSessionToken (idem)

F5 bootstrap
  → si hasPlatformParentSession && hasImpersonationSupportSession:
        setAuth(token from storage)
        initializeAuth()
        si me OK && is_impersonation → FIN (permanecer impersonado)
        si 401/exp/!is_impersonation → clear impersonation + endImpersonation o restore explícito
  → si hasPlatformParentSession && !hasImpersonationSupportSession:
        restorePlatformSession()  // comportamiento actual (huérfano)
  → else → refresh estándar

endImpersonation / restorePlatformSession / doLogout (soporte)
  → clearImpersonationSupportSession
  → clearPlatformParentSession (restore ya limpia parent)
```

### 6.3 Regla explícita anti-regresión (crítica)

| Situación | Comportamiento |
|-----------|----------------|
| `platform_parent_session` + token impersonado persistido + `/auth/me` impersonado | **Permanecer en soporte** |
| `platform_parent_session` + token impersonado + `/auth/me` platform | Token inválido → salir de soporte (no “éxito silencioso” en platform) |
| `platform_parent_session` + **sin** token impersonado (memoria null, storage vacío) | **No** asumir F5 = fin de soporte; solo restore si política huérfana (actual) |
| Sin parent | `refreshToken()` normal |

### 6.4 Interacción con interceptores

Mantener:

- `isImpersonationSupportMode` = `hasPlatformParentSession() || isImpersonationToken(token)`.
- No usar refresh cookie de platform para “recuperar” soporte en bootstrap cuando exista token impersonado persistido.

Opcional posterior: en bootstrap con token persistido, **no** llamar `POST /auth/refresh/` aunque falle una petición ERP (ya parcialmente alineado con omitir refresh en modo soporte).

### 6.5 Seguridad (aceptable para el producto)

| Tema | Postura |
|------|---------|
| Token en sessionStorage | Aceptado **solo en ventana de soporte**, misma clase de riesgo que `platform_parent_session`. |
| TTL ~2h | Respetar `exp` JWT; al expirar, forzar salida de soporte con mensaje claro. |
| Cierre de pestaña | `sessionStorage` se pierde; al reabrir no debe reimpersonar sin login platform — parent también se pierde en nueva sesión, OK. |
| XSS | Mitigación estándar ERP (CSP, sanitización); no empeorar respecto a padre ya persistido. |

### 6.6 Compatibilidad IMP / V2

| Norma | Cómo se cumple |
|------|----------------|
| IMP-01 | No bypass guards; token impersonado real en APIs |
| IMP-02 | Selección empresa sin cambios; persistir al final de apply |
| IMP-03 | Salir soporte limpia **ambas** claves storage |
| IMP-04 | Banner sigue ligado a `isImpersonation` rehidratado |

Sugerencia documental post-implementación (fuera de alcance ahora): nota en `FLUJO_AUTH_MULTIEMPRESA_FE.md` + posible IMP-05 “rehidratación F5 vía impersonation_support_session”.

---

## 7. Roadmap sugerido (dos fases)

| Fase | Alcance | Entregable |
|------|---------|------------|
| **Fase A (inmediata)** | Estrategia 3e en FE | F5 sobrevive; no restore espurio; banner + tenant_admin |
| **Fase B (opcional)** | Backend: refresh dedicado impersonación + cookie aislada | Sustituir persistencia access; retirar token de sessionStorage |

No iniciar Fase B hasta cerrar Fase A en QA.

---

## 8. Checklist QA (post-implementación)

| # | Caso | Resultado esperado |
|---|------|-------------------|
| 1 | Impersonar → seleccionar empresa → ERP | tenant_admin + banner |
| 2 | F5 en `/app/home` | Sigue impersonado; banner; `platform_parent_session` presente |
| 3 | F5 en `/admin/*` | Idem |
| 4 | `GET /auth/me` tras F5 | `is_impersonation: true`, `user_type: tenant_admin` |
| 5 | No restore automático a `/super-admin` tras F5 válido | Permanece en ERP |
| 6 | Salir modo soporte | Platform restaurado; ambas claves storage limpias |
| 7 | Login normal (sin impersonación) → F5 | Sin `platform_parent_session` de soporte; refresh/login estándar |
| 8 | Token impersonado expirado en storage (simular TTL) | Salida de soporte controlada, no platform “fantasma” |
| 9 | Pestaña nueva sin impersonar | No heredar soporte desde storage ajeno |

---

## 9. Conclusión

Para este ERP, la opción correcta **ahora** es:

**Persistir el access token de impersonación en `sessionStorage` (clave dedicada), rehidratarlo en bootstrap antes de cualquier `restorePlatformSession`, y validar con `GET /auth/me` que la impersonación sigue activa.**

La estrategia de **refresh backend** es la evolución natural a medio plazo, pero **no** debe bloquear el fix de F5: requiere contrato nuevo, aislamiento de cookies y coordinación con el equipo backend.

---

*Recomendación arquitectónica F5 impersonación. Sin implementación. Sin commit.*
