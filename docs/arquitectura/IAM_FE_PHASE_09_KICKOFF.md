# IAM-FE-PHASE-09 — Kickoff: AuthContext Decomposition

**Ticket kickoff:** IAM-FE-PHASE-09-KICKOFF-01  
**Ticket epic:** IAM-FE-PHASE-09-AUTH-REFACTOR  
**Versión:** 1.0  
**Estado:** KICKOFF ONLY — sin diseño ni implementación  
**Fecha:** 2026-06-19  
**Referencias normativas:**
- IAM-FE-PHASE-08-SIGNOFF-01 — Phase-08 SIGNED OFF (2026-06-19)
- IAM-FE-PHASE-08-CLOSURE-REPORT-01
- `docs/arquitectura/IAM_SESSION_ALIGNMENT_PLAN_V1.md` v1.1 — §5 Fase 9, §8 V9.x, GAP-P1-05, GAP-P2-02/03, H8
- `docs/arquitectura/IAM_FE_PHASE_08_TECHNICAL_DESIGN.md` v1.0 — congelada; L8-G wiring en AuthContext
- SIGNOFF oficiales **F1–F8**

> Este documento inicia oficialmente la Fase 9.  
> No contiene diseño detallado, código ni parches.  
> **Las Fases 1–8 quedan completamente congeladas.**

---

## Declaraciones normativas (Kickoff)

1. **F1–F8 permanecen completamente congeladas** — cuerpos de sesión, UX F7, telemetría L8.
2. **No modificar contratos OpenAPI.**
3. **No modificar la API pública de `useAuth()`.**
4. **No modificar UX** — modal, gates, banners, flujos visibles.
5. **No modificar comportamiento observable** — login, refresh, terminate, probe, impersonation, cross-tab, telemetría.
6. **La descomposición será exclusivamente interna** — extracción, composición, eliminación legacy.
7. **Todo cambio deberá mantener regresión V1–V8 completamente verde.**

---

## 1. Estado previo (F1–F8 SIGNED OFF)

| Fase | Tema | Estado |
|------|------|--------|
| **F1** | Post-Refresh Session / Hydrate | ✅ SIGNOFF — congelada |
| **F2** | Session Termination Contract | ✅ SIGNOFF — congelada |
| **F3** | Logout & Remote Revocation | ✅ SIGNOFF — congelada |
| **F4** | Cross-Tab Auth Sync | ✅ SIGNOFF — congelada |
| **F5** | Refresh Resilience & Outcomes | ✅ SIGNOFF — congelada |
| **F6** | Impersonation & Platform Admin | ✅ SIGNOFF — congelada |
| **F7** | UX Session Management | ✅ SIGNOFF — congelada |
| **F8** | Session Telemetry & Observability (L8) | ✅ SIGNOFF — congelada (2026-06-19) |

**Estado del monolito previo a F9:**

| Métrica | Valor actual (post-F8) |
|---------|------------------------|
| `AuthContext.tsx` | ~2.850 líneas |
| Módulos `src/core/auth/session/` | F1–F8 desacoplados parcialmente; wiring centralizado en AuthContext |
| Regresión manifesto | V1–V8 — **116/116** verde (post-F8) |
| Hito alineación | **H7** (~98 % §19) — observabilidad + UX |
| Hito pendiente | **H8** — mantenibilidad (≥ 98 % web core) → **objetivo F9** |

**Precondición cumplida:** F8 SIGNOFF autoriza kickoff F9 (Alignment §6: Fase 9 depende de Fases 1–8).

---

## 2. Objetivo arquitectónico de Phase-09

Transformar `AuthContext` de **orquestador monolítico** en **compositor delgado** que:

1. **Delega** responsabilidades de sesión a módulos internos cohesivos (refresh, bootstrap, termination, impersonation, empresa, interceptors, composición L7/L8).
2. **Preserva** el contrato externo `useAuth()` byte-a-byte en semántica y campos.
3. **Elimina** deuda estructural (auth service legacy duplicado, TenantContext legacy).
4. **Cierra H8** — mantenibilidad del core web IAM.
5. **Mantiene** regresión V1–V8 como gate continuo en cada paso IMPL.

---

## 3. Problema que resuelve

| Problema | Situación actual | Impacto |
|----------|------------------|---------|
| **AuthContext monolítico** | ~2.850 líneas; bootstrap, interceptors, refresh, terminate, impersonation, empresa, permisos, wiring F4/F7/F8 en un solo archivo | Cualquier cambio toca superficie amplia |
| **Exceso de responsabilidades** | Orquestación + HTTP interceptors + estado React + DI de F1–F8 + helpers exportados para tests | Violación SRP; difícil navegar |
| **Alto acoplamiento** | AuthContext importa y compone directamente decenas de módulos session; lógica inline mezclada con wiring | Cambios en un dominio arrastran el archivo completo |
| **Dificultad de pruebas** | Tests de regresión leen fuente AuthContext; poca separación compositor vs dominio | Regresión indirecta; pocos tests unitarios del provider |
| **Complejidad de mantenimiento** | GAP-P1-05; evolución post-F8 requiere tocar monolito | Costo alto por feature/hotfix |
| **Riesgo de regresiones** | Superficie F1–F8 certificada pero frágil ante refactor no planificado | Fase 9 acota refactor con gates V9.x |

---

## 4. Dependencias con F1–F8

| Dependencia | Naturaleza | Regla F9 |
|-------------|------------|----------|
| **F1** hydrate / bootstrap | Comportamiento congelado | Extraer wiring; **no** modificar `hydrateSessionCore` cuerpo |
| **F2** termination | Comportamiento congelado | Mover composición DI; **no** modificar `terminateSession` |
| **F3** probe / logout | Comportamiento congelado | Reubicar binders; **no** modificar `SessionRemoteProbe` |
| **F4** auth-sync | Comportamiento congelado | Reubicar listeners; **no** modificar emit/apply/channel |
| **F5** refresh resilience | Comportamiento congelado | Reubicar interceptor refresh; **no** modificar `executeRefreshWithResilience` |
| **F6** impersonation | Comportamiento congelado | Extraer bloque impersonation; **no** modificar orchestrators F6 |
| **F7** UX | Congelada | Reubicar binders F7; **no** modificar L7 modules |
| **F8** L8 telemetry | Congelada | Extraer compositors L8-G; **no** modificar emitter/redaction/sink |

**Regla:** F9 **consume** módulos F1–F8 tal cual; solo reorganiza **dónde** se instancian y componen.

---

## 5. GAPs que cerrará Phase-09

| GAP | Descripción | Cierre F9 |
|-----|-------------|-----------|
| **GAP-P1-05** | AuthContext monolito dificulta evolución segura | AuthProvider compositor + módulos session domain |
| **GAP-P2-02** | `auth.service.ts` legacy duplicado (`src/services/`) | Eliminar o consolidar en servicio canónico `features/auth` |
| **GAP-P2-03** | TenantContext legacy coexistiendo | Migrar consumidores; eliminar legacy |
| **H8** | Mantenibilidad web core | ≥ 98 % alineación §19 post-descomposición |

**Fuera de cierre F9 (sin reclasificar):** GAP-P2-04, GAP-P2-07, GAP-P3-04, sinks externos F8, deuda F1 hydrate logs (A-P2-01 AUDIT-02).

---

## 6. Alcance permitido

| Área | Detalle |
|------|---------|
| Extracción módulos internos | `session-bootstrap`, `session-interceptors`, `session-empresa`, compositors F7/F8 |
| `AuthProvider` compositor | Orquestación declarativa; hooks internos por dominio |
| Reubicación wiring | Binders F4/F7/F8 desde AuthContext a módulos compositor |
| Eliminación legacy | `src/services/auth.service.ts` duplicado; TenantContext legacy |
| Tests | Unit compositor + extensión regresión V9; manifesto V1–V8 obligatorio |
| Documentación F9 | DESIGN-01, regresión, closure, signoff |
| Refactor imports | Actualizar paths internos; **sin** cambiar API pública |

---

## 7. Alcance prohibido

| Tema | Norma |
|------|-------|
| Modificación cuerpos F1–F8 congelados | **Prohibido** |
| Cambio API `useAuth()` — campos, tipos, semántica | **Prohibido** |
| Cambio UX F7 — modal, gates, copy, flujos | **Prohibido** |
| Cambio telemetría L8 — taxonomía, redaction, eventos | **Prohibido** |
| Nuevos endpoints / OpenAPI | **Prohibido** |
| Nuevas pantallas, rutas, componentes UX | **Prohibido** |
| Cambio comportamiento observable sesión | **Prohibido** |
| Feature flags nuevos de dominio sesión | **Prohibido** (salvo rollback F9 documentado en diseño) |
| Optimizaciones no relacionadas con descomposición | **Prohibido** |

---

## 8. Restricciones arquitectónicas

1. **Contrato externo inmutable:** `useAuth()` + tipos exportados consumidos por app.
2. **Composición sobre reescritura:** extraer; no reimplementar lógica F1–F8.
3. **Unidireccionalidad:** módulos F9 compositor → módulos F1–F8 congelados; **sin** imports circulares AuthContext ↔ session.
4. **Regresión continua:** cada IMPL-n debe dejar V1–V8 verde antes del siguiente.
5. **Wiring L8/F7/F4:** compositors explícitos (`composeTerminationEventEmitters`, binders) — no inline disperso post-F9.
6. **React Query / Zustand:** mismos patrones; invalidación sin cambio semántico.
7. **Interceptors Axios:** misma instancia `api`; misma secuencia request/response.
8. **Tests ProtectedRoute / AuthGate / provider.tsx:** deben pasar sin cambio de contrato (V9.3).

---

## 9. Compatibilidad obligatoria con F1–F8

| Fase | Compatibilidad requerida |
|------|--------------------------|
| **F1** | Bootstrap / hydrate / initializeAuth — mismo flujo observable |
| **F2** | Terminación — mismos reasons, toast/modal F7, redirect |
| **F3** | Logout, logout_all, probe remoto — mismos gates |
| **F4** | Cross-tab — BC, anti-loop R1–R7, selection sync |
| **F5** | Refresh resilience — outcomes, retry, single-flight |
| **F6** | Impersonation enter/exit — controlled exit, platform restore |
| **F7** | UX modal/gate/limit — sin alteración presentación |
| **F8** | Telemetría L8 — pasiva; master ON → L8 o silencio (PATCH-01) |

**Smoke obligatorio (Alignment §8):** login Schema A/B · F5 · cambio empresa · password change · platform impersonate → ERP → exit.

---

## 10. Riesgos arquitectónicos

| Riesgo | Prob. | Severidad | Mitigación kickoff |
|--------|-------|-----------|-------------------|
| Regresión F1–V8 por split | Alta | **Alta** | Migración incremental; gate por IMPL; revert por módulo |
| Rotura contrato `useAuth()` | Media | **Alta** | V9.1 tipado + snapshot tests; prohibición explícita cambios API |
| Imports circulares post-extracción | Media | Alta | Capas compositor → domain → frozen; DESIGN-01 diagrama deps |
| Orden effects React alterado | Media | Alta | No reordenar effects en extracción; copy literal inicial |
| Interceptors duplicados o perdidos | Baja | Alta | IMPL dedicado interceptors; test integración |
| Eliminación legacy prematura | Media | Media | IMPL legacy al final; grep consumidores antes de delete |
| Scope creep (features nuevas) | Media | Media | Alcance prohibido §7; auditoría por IMPL |

---

## 11. Estrategia de migración incremental

### Principios

1. **Strangler fig interno** — extraer un dominio por IMPL; AuthContext delega de inmediato.
2. **Copy-first, refactor-second** — mover bloques literales antes de “limpiar” abstracciones.
3. **Green always** — V1–V8 verde al cierre de cada IMPL.
4. **Sin big-bang** — AuthContext sigue siendo entry point hasta IMPL final de slim-down.
5. **Legacy al final** — GAP-P2-02/03 solo tras estabilizar compositor.

### Fases de migración (conceptual)

```
IMPL-01…04  Inventario + contratos internos + flags rollback F9
IMPL-05…09  Extracción dominios (bootstrap, interceptors, refresh, terminate, impersonation)
IMPL-10…12  Compositors F7/F8/F4 + empresa/permisos
IMPL-13     Eliminación legacy (auth.service duplicado, TenantContext)
IMPL-14     Slim AuthProvider + regresión V9 completa
```

---

## 12. Roadmap IMPL-01…IMPL-14 (propuesto kickoff)

| Orden | ID | Entregable | Depende de | Gate |
|-------|-----|------------|------------|------|
| 1 | IMPL-01 | Inventario responsabilidades AuthContext + mapa extracción | — | Documento DESIGN input |
| 2 | IMPL-02 | Contratos internos compositor (`AuthProviderDeps`, hooks internos) | 01 | tsc |
| 3 | IMPL-03 | Flags rollback F9 + feature toggle split (si aplica diseño) | 02 | flags test |
| 4 | IMPL-04 | Tests snapshot `useAuth()` API (V9.1 baseline) | 02 | V9.1 baseline |
| 5 | IMPL-05 | Extraer `session-bootstrap` compositor | 02–04 | V1–V8 |
| 6 | IMPL-06 | Extraer interceptors request/response | 05 | V1–V8 |
| 7 | IMPL-07 | Extraer bloque refresh + cola F5 | 06 | V5 + V8 |
| 8 | IMPL-08 | Extraer termination wiring F2/F4/F8 compositor | 07 | V2 + V4 + V8 |
| 9 | IMPL-09 | Extraer impersonation + platform restore F6 | 08 | V6 smoke |
| 10 | IMPL-10 | Extraer empresa / selección / cambiar empresa | 09 | V1 + ORG gates |
| 11 | IMPL-11 | Reubicar binders F7 + F8 (SessionUx, Telemetry) | 10 | V7 + V8 |
| 12 | IMPL-12 | Slim `AuthProvider` — compositor final &lt; target líneas | 11 | V9.1 |
| 13 | IMPL-13 | Eliminar legacy: `src/services/auth.service.ts`, TenantContext legacy | 12 | grep + V1–V8 |
| 14 | IMPL-14 | Regresión V9 completa + manifesto V1–V8 + ProtectedRoute | 13 | V9.2, V9.3 |

*Detalle normativo, targets de líneas y paths exactos → **DESIGN-01**.*

---

## 13. Escenarios V9.x previstos

| ID | Escenario | Criterio de éxito | Automatizado |
|----|-----------|-------------------|--------------|
| **V9.1** | API pública `useAuth` sin cambios | Mismos campos, tipos y semántica pre-F9 | Sí — snapshot / contract test |
| **V9.2** | Regresión completa V1–V8 | Todos los escenarios manifesto pasan | Sí — CI obligatorio |
| **V9.3** | Tests `ProtectedRoute` existentes | Verde sin modificar expectativas de contrato | Sí |

**Smoke regression (Alignment §8):** obligatorio en VALIDATION F9 manual.

---

## 14. Reglas de rollback

| Nivel | Procedimiento | Efecto |
|-------|---------------|--------|
| **L1** | Flag F9 split OFF (si DESIGN define) | AuthContext monolito path activo |
| **L2** | Revert IMPL-n específico | Dominio extraído vuelve inline |
| **L3** | Revert rama F9 completa | Estado post-F8 SIGNOFF intacto |
| **L4** | Hotfix sobre F8 congelado | Solo P0; fuera flujo F9 normal |

**Criterio activación rollback:** cualquier regresión V1–V8; fallo V9.1 contrato `useAuth()`; smoke platform impersonation roto.

---

## 15. Criterios para iniciar DESIGN-01

| # | Criterio | Estado |
|---|----------|--------|
| 1 | Phase-08 **SIGNED OFF** (SIGNOFF-01) | ✅ |
| 2 | Regresión V1–V8 verde en main/working branch | ✅ (116/116 manifesto) |
| 3 | Kickoff F9 aprobado (este documento) | ✅ |
| 4 | Equipo alineado: **zero cambio observable** | Pendiente review kickoff |
| 5 | Ticket DESIGN-01 creado: `IAM-FE-PHASE-09-DESIGN-01` | Pendiente |

**DESIGN-01 deberá producir:** `IAM_FE_PHASE_09_TECHNICAL_DESIGN.md` con diagrama compositor, contratos internos, paths exactos, gates §11, y refinamiento IMPL-01…14.

---

## Referencias cruzadas

| Documento | Sección |
|-----------|---------|
| `IAM_SESSION_ALIGNMENT_PLAN_V1.md` | §5 Fase 9, §8 V9.x, §10 H8, GAP-P1-05, GAP-P2-02/03 |
| `IAM_FE_PHASE_08_TECHNICAL_DESIGN.md` | §3.4 congelado; L8-G wiring a extraer |
| `IAM_FE_PHASE_01…07_TECHNICAL_DESIGN.md` | Módulos congelados por fase |

---

## Tickets derivados (plantilla)

| Ticket | Contenido |
|--------|-----------|
| IAM-FE-PHASE-09-KICKOFF-01 | Este documento |
| IAM-FE-PHASE-09-DESIGN-01 | Diseño técnico F9 |
| IAM-FE-PHASE-09-AUTH-REFACTOR | Epic implementación |
| IAM-FE-PHASE-09-IMPL-* | Pasos 1–14 |
| IAM-FE-PHASE-09-VALIDATION | V9.x + smoke |
| IAM-FE-PHASE-09-CLOSURE-REPORT | Cierre F9 |
| IAM-FE-PHASE-09-SIGNOFF-01 | SignOff F9 |

---

**Fin del kickoff IAM-FE-PHASE-09 — AuthContext Decomposition**

PHASE-09 KICKOFF COMPLETE
