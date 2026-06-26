# FRONTEND — Auditoría Integral de Documentos Maestros

**Documento:** `FRONTEND_MASTER_DOCUMENTS_V2_AUDIT.md`  
**Versión:** 1.0.0  
**Fecha:** 2026-06-24  
**Modo:** READ ONLY — auditoría documental; sin cambios en normativa existente  
**Audiencia:** Arquitectura Frontend Enterprise, Producto, QA  

---

## 0. Resumen ejecutivo

Se auditó el estado de los **tres documentos maestros oficiales** del frontend ERP contra la arquitectura vigente del proyecto tras el cierre de:

| Bloque | Estado proyecto | Evidencia principal |
|--------|-----------------|---------------------|
| Backend IAM Session Management V2 | ✅ COMPLETADO | `IAM_SESSION_MANAGEMENT_V2_BACKEND_SPECIFICATION.md` v1.0.0 |
| Frontend IAM Session Management V2 | ✅ CERTIFICADO | `FRONTEND_IAM_V2_COMPLIANCE_CERTIFICATE.md` (FE-01…FE-25) |
| Active Sessions Enterprise | ✅ Fases 1A–4 Stage 2 | `FRONTEND_ACTIVE_SESSIONS_ENTERPRISE_UX_DESIGN_V1_2.md` + reports de fase |
| Arquitectura estructural L9 | ✅ SIGNOFF Phase-09 | `ERP_FRONTEND_ARCHITECTURE_BASELINE_V1.md` v1.2 |

**Veredicto global:** los documentos maestros conservan un **núcleo normativo sólido y mayoritariamente vigente** (multiempresa JWT, plantillas A/B, integridad API, B.1.1, §5.11 PERF, diseño 2 capas, Baseline Provider+Compositors). Sin embargo, presentan un **desfase material** respecto al dominio IAM Session V2 y al patrón **Admin IAM Enterprise Tier C** (Active Sessions), que quedaron implementados y certificados **después** de la última revisión normativa de `ERP_FRONTEND_STANDARDS_V2.md` (v2.4, 2026-06-19).

**Riesgo principal:** un agente o desarrollador que siga únicamente V2 + `.cursorrules` + PROMPT **no dispone de reglas explícitas** para `session_id`, `SessionDetailDialog`, KPIs admin, dual view Lista/Cards, Desktop First ni autoauditoría por fases — y puede aplicar por error reglas B-L (p. ej. PB-15 anti-click fila) a pantallas Admin IAM.

---

## 1. Alcance y metodología

### 1.1 Documentos oficiales auditados

| Documento | Versión detectada | Rol |
|-----------|-------------------|-----|
| `.cursorrules` | Operativo (sin semver) | Recordatorios MUST + diseño 2 capas |
| `docs/prompts/PROMPT_FRONTEND_MAESTRO.md` | **v4.2** | Bootstrap módulos Fase 0–3.5 + Fase E |
| `ERP_FRONTEND_STANDARDS_V2.md` | **v2.4** (2026-06-19) | Fuente normativa UX/plataforma |

### 1.2 Fuentes normativas de comparación

| Documento | Versión | Rol en auditoría |
|-----------|---------|------------------|
| `IAM_SESSION_MANAGEMENT_V2_BACKEND_SPECIFICATION.md` | 1.0.0 | Contrato funcional sesión V2 |
| `FRONTEND_ACTIVE_SESSIONS_ENTERPRISE_UX_DESIGN_V1_2.md` | 1.2 | UX oficial Active Sessions |
| `FRONTEND_ACTIVE_SESSIONS_PHASE_1A_IMPLEMENTATION.md` | 1.0 | Evidencia tabla enterprise |
| `FRONTEND_ACTIVE_SESSIONS_PHASE_1B_IMPLEMENTATION.md` | 1.0 | Evidencia KPI strip |
| `FRONTEND_ACTIVE_SESSIONS_PHASE_2_IMPLEMENTATION.md` | 1.0 | Evidencia Dialog + progressive disclosure |
| `FRONTEND_ACTIVE_SESSIONS_PHASE_3_IMPLEMENTATION.md` | 1.0 | Evidencia toolbar enterprise |
| `FRONTEND_ACTIVE_SESSIONS_PHASE4_STAGE1_IMPLEMENTATION.md` | 1.0 | Evidencia shared components |
| `FRONTEND_ACTIVE_SESSIONS_PHASE4_STAGE2_IMPLEMENTATION.md` | 1.0 | Evidencia paridad Cards |
| `FRONTEND_IAM_V2_COMPLIANCE_CERTIFICATE.md` | 1.0.0 | Cierre FE-01…FE-25 |
| `ERP_FRONTEND_ARCHITECTURE_BASELINE_V1.md` | 1.2 | Patrón Provider + Compositors |
| Código `src/features/admin/`, `src/core/auth/` | Working tree jun 2026 | Verificación empírica |

### 1.3 Metodología

1. Lectura íntegra de maestros + secciones críticas de V2 (§2, §4, §5, §6, §7, §9, §10, §11).
2. Cruce contra especificaciones IAM V2 y Active Sessions Enterprise.
3. Verificación en código de patrones certificados (`resolveSessionId`, `SessionDetailDialog`, `ActiveSessionsPage`, compositors auth).
4. Clasificación: vigente / parcialmente obsoleto / contradictorio / faltante.
5. **Sin proponer texto normativo** — solo diagnóstico y plan de actualización.

---

## 2. Matriz documento vs arquitectura actual

| Dimensión arquitectónica | Estado código (jun 2026) | `.cursorrules` | PROMPT v4.2 | ERP V2.4 | Brecha |
|--------------------------|--------------------------|----------------|-------------|----------|--------|
| Multiempresa JWT (ME-*) | ✅ Vigente | ✅ | ✅ | ✅ | Ninguna |
| Plantillas A / A+ / B-* | ✅ Referencia ORG/INV | ✅ | ✅ | ✅ | Ninguna |
| §5.11 ErpList Tier B/C | ✅ INV/ORG | ✅ | ✅ | ✅ | Ninguna |
| B.1.1 / modal stacking | ✅ | ✅ | ✅ | ✅ | Ninguna |
| Diseño 2 capas (tokens + brand) | ✅ | ✅ exclusivo | Pointer | §8.9 + pointer | Ninguna |
| Provider + Compositors L9 | ✅ SIGNOFF-02 | ✅ pointer | ✅ Fase E | §4.8.3 | Ninguna estructural |
| IAM Session V2 (`session_id`, revoke) | ✅ FA01 certificado | ❌ | ❌ | ❌ | **Alta** |
| `current_session_id` en `/me/` | ✅ FA01 | ❌ | ❌ | ❌ | **Alta** |
| Admin IAM Tier C enterprise | ✅ ActiveSessionsPage | ❌ | ❌ | ⚠️ genérico Admin | **Alta** |
| `SessionDetailDialog` / progressive disclosure | ✅ Fase 2 | ❌ | ❌ | ❌ | **Alta** |
| KPI strip admin (`useQueries`) | ✅ Fase 1B | ❌ | ❌ | ❌ | **Media** |
| Dual view Lista/Cards permanente | ✅ Fase 4 v1.2 | ❌ | ❌ | ❌ | **Media** |
| Desktop First Enterprise | ✅ D-23 v1.2 | ❌ | ❌ | ❌ | **Media** |
| Tiempo relativo + tooltip absoluto | ✅ `iam-session-display.utils` | ❌ | ❌ | ❌ | **Baja** |
| Shared components feature-first (`sessions/shared/`) | ✅ Fase 4 S1 | ❌ | ❌ | ❌ | **Media** |
| Toolbar enterprise monitoring | ✅ Fase 3 | ❌ | ❌ | ⚠️ TB-* genérico | **Media** |
| Autoauditoría por fases congeladas | ✅ Reports fase | ❌ | ❌ | ❌ | **Media** |
| Testing IAM sessions (vitest) | ✅ 107+ tests admin | ⚠️ genérico | ⚠️ Fase 3 | ⚠️ Gate 4 genérico | **Media** |
| IAM-REF-01 «no reabrir IAM» | Obsoleto post-V2 | — | — | ❌ vigente en §9.1 | **Alta** |
| Gate checklist Admin Enterprise | No existe | — | — | ❌ | **Alta** |
| Impersonación UI empresa (P0 post-cert) | ⚠️ Bug documentado | IMP pointer | — | IMP-* sin UI guard | **Media** |

**Leyenda brecha:** Ninguna · ⚠️ parcial · ❌ ausente/desalineado

---

## 3. Reglas completamente vigentes (no modificar)

Las siguientes reglas permanecen **correctas, operativas y alineadas** con el código actual. Deben conservarse sin alteración de fondo.

### 3.1 Integridad y contrato API

| Área | IDs / sección | Justificación |
|------|---------------|---------------|
| No consumir deprecated | API-01, API-02 | Sin cambio post IAM V2 |
| Cabecera + detalle embebido | CD-01, CD-02 | Dominio ERP transaccional intacto |
| Tipado estricto sin `any` | Absoluto | Cumplido en módulos certificados |
| Service layer obligatorio | Absoluto | Active Sessions respeta `session.service.ts` |
| `getErrorMessage` + ER-01/ER-02 | §8.5 | Patrón intacto en hooks sesión |
| No mostrar UUID en UI | E-ME4 | Active Sessions + Dialog auditados sin UUID visible |

### 3.2 Multiempresa JWT

| ID | Estado |
|----|--------|
| ME-01 … ME-06, ME-09, ME-10 | ✅ Vigentes |
| AUTH-01 … AUTH-05 | ✅ Vigentes (flujos implementados) |
| IMP-01 … IMP-04 (comportamiento normativo) | ✅ Vigentes como reglas de negocio |
| `useEmpresaActiva` / `scopeEmpresaId` | ✅ Fuente única empresa operativa |
| Guards `*CompanyRouteGuard`, `useTenantQuery` | ✅ Patrón escalable sin cambio |

### 3.3 Plantillas ERP operativas (ORG / INV)

| Plantilla | Referencias | Estado |
|-----------|-------------|--------|
| A / A+ | ORG E-SEC, INV M3 | ✅ Cerradas |
| B-L / B-F / B-R | INV M2 | ✅ Cerradas |
| ERP-BL-ACT-01 (PB-15…PB-21) | MovimientosPage | ✅ Vigente para **B-L únicamente** |
| §5.11 PERF (LR-*, PR-*) | ProductosPage, MovimientosPage | ✅ Vigente para módulos ERP Tier B/C |
| B.1.1 (B11-*) | UserManagementPage origen | ✅ Vigente; Active Sessions cumple B11-10 en revoke |

### 3.4 UX transversal ERP

| Área | IDs | Estado |
|------|-----|--------|
| Toolbar sin H1 | TB-01, TB-02 | ✅ Active Sessions cumple |
| Skeleton / empty IAM | SK-01, ES-01 | ✅ `InvTableSkeleton`, `IamTableEmptyState` |
| ConfirmDialog variants | UX-05…UX-08 | ✅ Revoke sesión usa patrón existente |
| RBAC visual | RB-01, RB-02 | ✅ Sin render sin permiso |
| Branding BR-01…BR-05 | §8.9 + `.cursorrules` | ✅ Tokens Capa 1/2 respetados en sesiones |
| React Query server state | Absoluto | ✅ Hooks sesión conformes |
| Zustand solo global | Absoluto | ✅ Sin violación en dominio sesión |

### 3.5 Arquitectura estructural

| Documento / principio | Estado |
|-----------------------|--------|
| Baseline V1 P-01…P-10 | ✅ Vigente post Phase-09 |
| Shell público `@/shared/context/AuthContext` | ✅ Implementado |
| MUST NOT import compositors desde features | ✅ Respetado |
| V2 §4.8.3 pointer a Baseline | ✅ Correcto |
| PROMPT Fase E + epic template | ✅ Vigente para refactors core |

### 3.6 Precedencia documental

La jerarquía **OpenAPI > V2 > Baseline V1 > .cursorrules > PROMPT** sigue siendo válida. Los nuevos artefactos IAM Session V2 y Active Sessions Enterprise deben **incorporarse como evidencia y extensión de V2 §9.1 / §4.8**, no como precedencia superior a V2 salvo contrato OpenAPI.

---

## 4. Reglas parcialmente obsoletas

| Regla / apartado | Documento | Por qué quedó parcialmente obsoleta |
|------------------|-----------|-------------------------------------|
| **IAM-REF-01** «No reabrir IAM salvo multiempresa FE/BE o LBAC ampliado» | V2 §9.1 | IAM Session V2 + Active Sessions Enterprise **reabrieron y cerraron** un bloque mayor de IAM (sesiones, identidad V2, panel admin). La condición de excepción es insuficiente. |
| Cierre IAM «Sprints A–D + B.1.1» | V2 §0, §9.1 | No refleja cierre **IAM Session V2** ni **Active Sessions Enterprise** (jun 2026). |
| Referencia IAM = `IamSearchInput`, `IamTableEmptyState` | V2 §9.1, §10, PROMPT 0.5 | Reduce IAM a componentes de catálogo; ignora stack sesiones (`SessionDetailDialog`, KPI strip, shared session primitives). |
| Plantilla **Admin** genérica | V2 §1.2, §2.1 | No distingue Admin catálogo (UserManagement) vs Admin panel Tier C enterprise (ActiveSessions). |
| §5.11 LR-01 aplicado uniformemente a Tier C | V2 §5.11 | Active Sessions Tier C usa `useActiveSessionsList` dedicado, **no** `use*ErpList` — patrón certificado pero **no documentado como excepción Admin IAM**. |
| SR-03 debounce 500 ms IAM | V2 §5.3 | Sigue válido como SHOULD; Active Sessions usa 350 ms en filtro usuario (aceptable por SR-03: 500 ms «fuera listados ERP»). No obsoleto, pero **ambiguo** para nuevos filtros IAM. |
| §4.8 Auth sin identidad sesión V2 | V2 §4.8 | Cubre flujos login/selección/impersonation pero **no** `session_id`, `current_session_id`, revoke por `session_id`, RTR, replay. |
| PROMPT alcance «Fase 0–3.5 módulos ERP operativos» | PROMPT §CONTEXTO | Correcto para PUR/SLS; **no incluye** procedimiento bootstrap para paneles Admin IAM enterprise ni remediación IAM V2. |
| `.cursorrules` checklist evaluación código (12 ítems) | `.cursorrules` | No incluye criterios IAM Session V2 ni Admin enterprise; ítem 9 (PB-15 B-L) puede **false-positive** en Admin IAM. |
| `docs/arquitectura/IAM_SESSION_FRONTEND_ARCHITECTURE_V1.md` | Arquitectura auxiliar | Fecha 2026-06-19; referencia backend antigua; **anterior a FA01/FA02** y Active Sessions. Parcialmente histórico. |
| Estado V2 «CONGELADO» en `.cursorrules` | `.cursorrules` L10 | Coexiste con V2 header «Normativo» y necesidad real de revisión §9.1 — **semántica de congelamiento desactualizada**. |

---

## 5. Contradicciones con la arquitectura actual

Clasificadas por severidad. **Ninguna invalida el núcleo V2**; son conflictos de interpretación, alcance o lag documental.

### 5.1 Severidad ALTA

| ID | Contradicción | Manifestación | Impacto |
|----|---------------|---------------|---------|
| **C-01** | IAM-REF-01 vs trabajo IAM certificado | V2 prohíbe reabrir IAM; proyecto certificó IAM V2 + Active Sessions | Agentes/desalineación procesal; bloqueo artificial a mejoras IAM |
| **C-02** | LR-01 §5.11 vs Admin Tier C sessions | V2 exige `use*ErpList` Tier B/C; código usa hook dedicado con `normalizeAdminSessionsResponse` | Auditoría automática marcaría 🔴 falso positivo |
| **C-03** | Ausencia FE-01…FE-25 en maestros | Certificado exige `session_id`; maestros no mencionan identidad V2 | Regresión RC1 posible en nuevos módulos sesión |

### 5.2 Severidad MEDIA

| ID | Contradicción | Manifestación | Impacto |
|----|---------------|---------------|---------|
| **C-04** | PB-15 (B-L) vs D-05 (Admin MAY click fila) | `.cursorrules` ítem 9 aplica PB-15 globalmente; Active Sessions **MAY** `onClick` `<tr>` admin | Confusión plantilla B-L vs Admin |
| **C-05** | IMP-* sin guard UI empresa | V2 IMP-01…04; `POST_CERTIFICATION_FRONTEND_BUG_AUDIT` P0: selector empresa activo en impersonación | Brecha normativa UX impersonación |
| **C-06** | «CONGELADO» vs extensión obligatoria | `.cursorrules` declara V2 congelado; realidad exige ampliar §9.1 | Resistencia organizacional a actualizar V2 |
| **C-07** | Gates §11 sin Admin Enterprise | No hay Gate IAM-Session ni checklist Active Sessions | Sign-off ad hoc por reports sueltos |

### 5.3 Severidad BAJA

| ID | Contradicción | Manifestación | Impacto |
|----|---------------|---------------|---------|
| **C-08** | PB-06 empty inline B-L vs ES-01 | Deuda documentada; Active Sessions usa `IamTableEmptyState` | Solo referencia B-L INV |
| **C-09** | SR-06 Tier C sin `buscar` | Active Sessions **sí** expone `search` server-side en admin API | Necesita nota «Admin IAM Tier C con `search` permitido» |
| **C-10** | Feature-first shared bajo `features/admin/.../shared/` | V2 §10 lista `@/shared/components` y `@/features/admin/components/iam` pero no subcarpeta `sessions/shared/` | Descubribilidad componentes |

---

## 6. Reglas nuevas necesarias (incorporar)

Sin redactar texto normativo — **temas que deben existir** en la próxima revisión.

### 6.1 IAM Session Management V2

| Tema | Contenido mínimo requerido | Evidencia código |
|------|---------------------------|------------------|
| Identidad canónica | `session_id` MUST; `token_id` solo refresh/fallback RC1 | `iam-session-id.utils.ts` |
| Contexto sesión actual | `current_session_id` desde `/me/`; fallback `current_token_id` | `iam-current-session.ts`, `auth.types.ts` |
| Revoke | Path param = `resolveSessionId(target)` | `session.service.ts`, `useRevokeSession.ts` |
| `is_current` | Prioridad: flag backend → session_id → token_id | `isCurrentSession()` |
| Matriz FE-01…FE-25 | Pointer a certificado + checklist Gate | `FRONTEND_IAM_V2_COMPLIANCE_CERTIFICATE.md` |
| Re-login post activación V2 | FE-24 comportamiento pasivo | `FRONTEND_IAM_V2_FE24_AUDIT.md` |
| Impersonación + cambiar empresa | UI guard MUST o política explícita | `POST_CERTIFICATION_FRONTEND_BUG_AUDIT.md` P0 |

### 6.2 Active Sessions Enterprise / Admin IAM Tier C

| Tema | Contenido mínimo requerido | Evidencia |
|------|---------------------------|-----------|
| Clasificación **Admin-C** o subtipo | Panel monitoreo Tier C tenant-scoped; ≠ catálogo Admin A | UX Design v1.2 §2.1 |
| `SessionDetailDialog` | Progressive disclosure; única fuente detalle avanzado; B11-10 revoke | Fase 2 |
| Acciones superficie | `Eye` + `LogOut` únicamente; MUST NOT revoke desde click fila | D-04, D-06 |
| KPI strip | `useActiveSessionsKpiSummary`; staleTime ≥ 60s; copy dual con filtros | Fase 1B |
| Dual view | Lista/Cards paridad funcional MUST; toggle `localStorage` permanente | D-25…D-27, Fase 4 |
| Desktop First | Viewports 1920–1280 + tablet landscape; no mobile first admin sesiones | D-23, D-24, D-32 |
| Tiempo relativo | `formatSessionRelativeTime` + tooltip absoluto | `iam-session-display.utils.ts` |
| Toolbar enterprise | Monitoring: actualizado, auto-refresh, presets sort, resumen filtros | Fase 3 |
| Excepción §5.11 | Admin IAM Tier C MAY hook dedicado si API admin sessions; MUST `normalizeListResponse` equivalente | `useActiveSessionsList.ts` |

### 6.3 Arquitectura de componentes

| Tema | Contenido mínimo requerido |
|------|---------------------------|
| Feature-first shared | Primitivos de dominio bajo `features/{modulo}/components/.../shared/` cuando no son plataforma |
| Paridad Lista/Cards | Composición shared obligatoria; MUST NOT duplicar lógica presentación |
| Page como orquestador | State dialog/revoke/filtros en page; vistas presentacionales |

### 6.4 React Query

| Tema | Contenido mínimo requerido |
|------|---------------------------|
| KPI queries separadas | Keys distintas listado vs KPI; invalidación conjunta en revoke/refresh |
| `dataUpdatedAt` para meta UI | Patrón «Actualizado hace…» sin polling adicional |
| Auto-refresh | Intervalo configurable; default Manual/OFF; `localStorage` |

### 6.5 Testing y autoauditoría

| Tema | Contenido mínimo requerido |
|------|---------------------------|
| Autoauditoría por fase | Tabla «fases congeladas intactas» obligatoria en reports |
| Tests mínimos Admin-C | Dialog sin UUID; paridad Cards; revoke B11-10; `resolveSessionId` |
| Gate IAM-Session | Extensión §11 o anexo con FE-* + UX Active Sessions |

### 6.6 Auth arquitectura (pointers)

| Tema | Contenido mínimo requerido |
|------|---------------------------|
| Compositors | Mantener §4.8.3 + Baseline §14 |
| Dominio `core/auth/session/` | Pointer a políticas termination, impersonation, refresh |
| Actualizar `IAM_SESSION_FRONTEND_ARCHITECTURE_V1` | Alineación post-certificación |

---

## 7. Apartados que deben ampliarse (sin eliminar contenido válido)

| Documento | Apartado | Ampliación sugerida |
|-----------|----------|---------------------|
| **ERP_FRONTEND_STANDARDS_V2** | §4.8 | Nueva §4.8.4 «Identidad sesión IAM V2» (session_id, current_session_id, revoke, RC1) |
| | §9.1 IAM | Subsecciones: catálogo IAM (actual) + Session V2 + Admin Enterprise Active Sessions |
| | §2.1 árbol clasificación | Rama Admin → Admin-A (catálogo) / Admin-C (panel Tier C) |
| | §5.11 o §9.1.2 | Excepción hook listado Admin IAM Tier C |
| | §10 mapa componentes | Entradas: `SessionDetailDialog`, `ActiveSessionsKpiStrip`, `sessions/shared/*`, utils sesión |
| | §11 Gates | Gate **2-Admin** o **Gate IAM-Session** con checklist FE + UX |
| | §0.2 alcance | Incluir «paneles administración IAM enterprise» |
| | Anexo / changelog | Referencias certificados jun 2026 |
| **`.cursorrules`** | Evaluación código | Ítems 13–15: session_id, Admin-C vs B-L, SessionDetailDialog |
| | IAM pointer | §9.1 ampliado; revocar literal «no reabrir» sin condición |
| | Precedencia | Añadir pointer a especificaciones IAM V2 como evidencia §9 |
| **`PROMPT_FRONTEND_MAESTRO`** | Fase 0.5 matriz | Filas: Admin IAM Tier C → `ActiveSessionsPage`; Session V2 → FA01 utils |
| | Fase 3 verificación | Checks FE-01/02/09/10; paridad Cards; KPI |
| | Alcance | Nota: remediaciones IAM / paneles admin siguen V2 + anexos IAM |
| **`ERP_FRONTEND_ARCHITECTURE_BASELINE_V1`** | §15 (si existe IAM Admin) | Cross-ref Active Sessions como UI Admin, no core provider |
| **`IAM_SESSION_FRONTEND_ARCHITECTURE_V1`** | Completo | Actualización mayor post-certificación (ver dictamen D) |

---

## 8. Prioridades de actualización

| Prioridad | Ítem | Justificación | Esfuerzo doc |
|-----------|------|---------------|--------------|
| **P0** | Revocar/ampliar IAM-REF-01; cerrar §9.1 con Session V2 + Active Sessions | Bloquea interpretación correcta del estado IAM | Medio |
| **P0** | §4.8.4 identidad sesión V2 (FE-01, FE-02, FE-09, FE-10) | Previene regresión RC1 | Medio |
| **P0** | Excepción/documentación Admin Tier C vs §5.11 LR-01 | Elimina falsos positivos auditoría | Bajo |
| **P1** | Nuevo Gate IAM-Session en §11 | Unifica sign-off | Medio |
| **P1** | Patrón SessionDetailDialog + progressive disclosure | Reutilizable en otros paneles admin | Medio |
| **P1** | Desktop First + dual view Lista/Cards | Decisiones producto v1.2 no en V2 | Medio |
| **P1** | IMP UI guard empresa (P0 post-cert) en §4.8.2 | Cierra brecha seguridad UX | Bajo |
| **P2** | KPI strip + React Query patterns admin | Escalabilidad dashboards IAM | Bajo |
| **P2** | Feature-first `shared/` convention en §10 | Descubribilidad | Bajo |
| **P2** | PROMPT v4.3 matriz referencias | Onboarding agentes | Bajo |
| **P3** | Tiempo relativo como util plataforma | Ya implementado; documentar | Bajo |
| **P3** | Actualizar `IAM_SESSION_FRONTEND_ARCHITECTURE_V1` | Coherencia arquitectura auxiliar | Alto |

---

## 9. Plan de actualización documental

### Fase U0 — Inventario y gobernanza (1 sprint doc)

- [ ] Aprobar que IAM Session V2 + Active Sessions **abren** excepción formal a IAM-REF-01.
- [ ] Decidir versionado (§12 recomendación).
- [ ] Congelar lista IDs nuevos propuestos (p. ej. `IAM-S01`, `ADM-C01`, `FE-REF-01`).

### Fase U1 — ERP_FRONTEND_STANDARDS_V2 revisión (núcleo)

- [ ] §4.8.4 Session Identity V2.
- [ ] §9.1 reescritura ampliativa (mantener tabla actual + nuevas filas).
- [ ] §2.1 subclasificación Admin.
- [ ] §10 mapa + §11 Gate IAM-Session.
- [ ] Changelog y fecha.

### Fase U2 — Satélites sincronizados

- [ ] `.cursorrules`: pointers + checklist + nota congelamiento.
- [ ] `PROMPT_FRONTEND_MAESTRO` v4.3: matriz 0.5 + verificación Fase 3.
- [ ] Cross-refs en `FRONTEND_IAM_V2_COMPLIANCE_CERTIFICATE.md` → V2 §x.

### Fase U3 — Arquitectura auxiliar

- [ ] `IAM_SESSION_FRONTEND_ARCHITECTURE_V2` o revisión mayor V1.
- [ ] Índice en `docs/arquitectura/` apuntando jerarquía.

### Fase U4 — Validación

- [ ] Auditoría READ ONLY post-actualización (grep IDs, matriz FE, checklist Gate).
- [ ] Sign-off Arquitectura Frontend Enterprise.

---

## 10. Estrategia de migración documental

```
┌─────────────────────────────────────────────────────────────────┐
│  OpenAPI + IAM_SESSION_MANAGEMENT_V2_BACKEND_SPECIFICATION      │
└────────────────────────────┬────────────────────────────────────┘
                             │ informa
┌────────────────────────────▼────────────────────────────────────┐
│  ERP_FRONTEND_STANDARDS_V2.5  ←── extensión normativa principal │
│  · §4.8.4 Session V2                                            │
│  · §9.1 IAM ampliado                                            │
│  · §11 Gate IAM-Session                                         │
└────────────┬───────────────────────────────┬────────────────────┘
             │ resume                        │ no duplica
┌────────────▼────────────┐    ┌─────────────▼────────────────────┐
│  .cursorrules (pointers) │    │  PROMPT v4.3 (procedimiento)    │
└──────────────────────────┘    └────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────────────────┐
│  Evidencia / diseño (NO normativa primaria, sí trazabilidad)    │
│  · FRONTEND_ACTIVE_SESSIONS_ENTERPRISE_UX_DESIGN_V1_2           │
│  · FRONTEND_IAM_V2_COMPLIANCE_CERTIFICATE                       │
│  · PHASE_*_IMPLEMENTATION reports                               │
└─────────────────────────────────────────────────────────────────┘
```

**Principios:**

1. **Write once** — IDs nuevos solo en V2; `.cursorrules` y PROMPT referencian.
2. **No superseder Baseline V1** — capa estructural intacta.
3. **Evidencia de fase permanece** — reports de implementación no se fusionan en V2; se citan.
4. **UX Design v1.2** pasa a «diseño congelado» referenciado desde §9.1, igual que INV cierres.
5. **Transición RC1** — documentar ventana `resolveSessionId` hasta deprecación backend explícita.

---

## 11. Recomendación de versionado

| Documento | Versión actual | Versión sugerida | Justificación |
|-----------|----------------|-----------------|---------------|
| `ERP_FRONTEND_STANDARDS_V2.md` | 2.4 | **2.5** (revisión menor significativa) | La taxonomía A/B, ME-*, §5.11 y Gates 0–4 **siguen válidos**. Los cambios son **extensiones** (§9.1, §4.8.4, Admin-C, Gate IAM), no reestructuración. Saltar a V3 implicaría señalar ruptura innecesaria. |
| `.cursorrules` | — | Actualización sincronizada V2.5 | Sin semver; fecha/changelog interno |
| `PROMPT_FRONTEND_MAESTRO.md` | 4.2 | **4.3** | Matriz referencias + checks IAM; sin cambio metodología Fase 0–3.5 |
| `ERP_FRONTEND_ARCHITECTURE_BASELINE_V1.md` | 1.2 | **1.2** (mantener) | Phase-09 vigente; solo cross-ref §9.1 si aplica |
| `IAM_SESSION_FRONTEND_ARCHITECTURE_V1.md` | V1 (2026-06-19) | **V2** o revisión 1.3 mayor | Desalineado post FA01/FA02 y certificado |

**No recomendado:** `ERP_FRONTEND_STANDARDS_V3` en este momento — el prefijo «V2» ya es marca estable en `.cursorrules`, PROMPT y precedencia; una V3 solo se justificaría con ruptura de plantillas o reordenación §2.

**Alternativa aceptable:** V2.5 + anexo normativo `ERP_FRONTEND_IAM_SESSION_V2_ADDENDUM.md` si se desea desacoplar temporalmente — con plan de fusión a §4.8/§9.1 en 1 ciclo.

---

## 12. Checklist para iniciar la actualización oficial

### Pre-requisitos

- [ ] Sign-off Producto de que UX Design v1.2 es normativa de referencia Admin Sessions.
- [ ] Sign-off de que `FRONTEND_IAM_V2_COMPLIANCE_CERTIFICATE` es baseline FE Session V2.
- [ ] Confirmar política impersonación empresa (bloqueo UI vs CONTROLLED_EXIT) con spec §13.5.

### Contenido mínimo V2.5

- [ ] §4.8.4 — Identidad sesión (`session_id`, `current_session_id`, `resolveSessionId`, revoke).
- [ ] §9.1 — Tabla ampliada: UserManagement (existente) + ActiveSessionsPage + MySessionsPage.
- [ ] §9.1 — Revocación IAM-REF-01 literal; nueva condición de reapertura documentada.
- [ ] §2 — Subtipo Admin-C (panel monitoreo Tier C).
- [ ] §5.11 nota — Excepción Admin IAM listados con hook dedicado.
- [ ] §9.5 — Fila «Admin IAM Tier C enterprise» → `ActiveSessionsPage`.
- [ ] §10 — 15+ entradas nuevas (sesiones).
- [ ] §11 — Gate IAM-Session (FE-01…FE-25 subset + UX D-01…D-32 subset).
- [ ] Changelog 2.5 con fecha y referencias certificados.

### Satélites

- [ ] `.cursorrules` — ítem evaluación Admin vs B-L; pointer §4.8.4.
- [ ] PROMPT 4.3 — matriz 0.5 + verificación ítems 23–26.
- [ ] Actualizar «CONGELADO» → «Normativo v2.5» o «Revisión 2.5».

### Validación post-actualización

- [ ] Grep: `IAM-REF-01` coherente con texto nuevo.
- [ ] Matriz FE-01…FE-25 trazable a §11.
- [ ] Ninguna regla PB-15 aplicada a `/admin/sesiones` en ejemplos.
- [ ] Precedencia documental sin ciclos.
- [ ] Auditoría READ ONLY de cierre (`FRONTEND_MASTER_DOCUMENTS_V2_AUDIT_POST_UPDATE.md`).

---

## 13. Respuestas estructuradas a las preguntas de auditoría

### 13.1 ¿Qué reglas siguen completamente vigentes?

Ver **§3** completo. Resumen: integridad API, multiempresa JWT, plantillas ORG/INV, §5.11 PERF para módulos ERP, B.1.1, RBAC, errores, diseño 2 capas, Baseline Provider+Compositors, precedencia OpenAPI>V2>Baseline.

### 13.2 ¿Qué reglas quedaron parcialmente obsoletas?

Ver **§4**. Críticas: **IAM-REF-01**, cierre IAM §9.1 limitado a Sprints A–D, plantilla Admin sin subtipos, §4.8 sin identidad V2, LR-01 sin excepción Admin-C.

### 13.3 ¿Qué reglas contradicen la arquitectura actual?

Ver **§5** (C-01…C-10 por severidad).

### 13.4 ¿Qué reglas faltan incorporar?

Ver **§6** (IAM V2, SessionDetailDialog, current_session_id, session_id, Progressive Disclosure, Desktop First, Shared Components, Feature First, React Query patterns, Enterprise components/toolbar/KPIs, Tabla/Cards, Relative Time, autoauditoría, testing, auth architecture).

### 13.5 ¿Qué apartados deberían ampliarse?

Ver **§7**.

### 13.6 ¿Qué documentos deberían subir de versión?

Ver **§11** — recomendación principal: **ERP_FRONTEND_STANDARDS_V2.5**, PROMPT **4.3**, revisión mayor `IAM_SESSION_FRONTEND_ARCHITECTURE_V1` → V2.

---

## 14. Dictamen final

### A) Documentos totalmente vigentes

| Documento | Justificación técnica |
|-----------|----------------------|
| **`ERP_FRONTEND_ARCHITECTURE_BASELINE_V1.md` v1.2** | Phase-09 SIGNOFF-02 sigue siendo la implementación en `src/core/auth/provider/`. Principios P-01…P-10, fases A→D, AC rules y testing estructural **no fueron contradichos** por IAM Session V2 ni Active Sessions (zero feature delta en refactor; nuevas features en capa dominio/features). |
| **Especificaciones de cierre ORG/INV referenciadas en V2 §9.2–§9.3** | Sin cambio arquitectónico que las invalide. |
| **Núcleo normativo V2 §4 (ME-*), §5–§8 (excepto lag IAM), §5.11 PERF** | Código ERP operativo y nuevos módulos siguen estos patrones. |

### B) Requieren actualización menor

| Documento | Justificación técnica |
|-----------|----------------------|
| **`.cursorrules`** | El contenido operativo es ~90% vigente. Requiere **pointers** a IAM V2 y Admin Enterprise, ampliación checklist evaluación (3–5 ítems), y aclaración de «CONGELADO» vs revisión 2.5. **No reescritura.** |
| **`docs/prompts/PROMPT_FRONTEND_MAESTRO.md` v4.2** | Metodología Fase 0–3.5 y Fase E intacta. Falta matriz referencias Active Sessions + checks FE en verificación. **Actualización incremental → v4.3.** |
| **`docs/arquitectura/IAM_SESSION_FRONTEND_ARCHITECTURE_V1.md`** | Útil como arquitectura auxiliar pero **lag de 5+ días** respecto a certificación; referencias backend desactualizadas. Actualización menor insuficiente — ver C para este archivo en práctica es **mayor**; se lista aquí si se opta por patch puntual. |

### C) Requieren actualización mayor

| Documento | Justificación técnica |
|-----------|----------------------|
| **`ERP_FRONTEND_STANDARDS_V2.md` v2.4** | Documento central con **lag sistemático** respecto a jun 22–23 2026: §9.1 IAM incompleto, ausencia Session V2 en §4.8, sin Admin-C enterprise, sin Gate IAM-Session, §10 sin componentes sesión, IAM-REF-01 contradictorio con estado certificado. **La estructura V2 se conserva**; la actualización es **ampliativa y correctiva**, no sustitutiva → versión **2.5**, no reescritura total. |

### D) Deben reescribirse

| Documento | Justificación técnica |
|-----------|----------------------|
| **Ninguno de los tres maestros oficiales** | `.cursorrules`, PROMPT y V2 son **evolutivos**. Una reescritura completa (p. ej. V3 desde cero) introduciría riesgo de regresión normativa en ORG/INV sin beneficio. |
| **`IAM_SESSION_FRONTEND_ARCHITECTURE_V1.md` (auxiliar, no maestro)** | Si se mantiene como documento de arquitectura de dominio auth/sesión, requiere **reescritura sustancial** o reemplazo por **V2** alineado a `IAM_SESSION_MANAGEMENT_V2_BACKEND_SPECIFICATION.md` v1.0.0, FA01/FA02, compositors Phase-09 y Active Sessions. El documento actual describe RC1 y referencias backend obsoletas. |

---

## 15. Síntesis ejecutiva para Arquitectura

| Pregunta | Respuesta |
|----------|-----------|
| ¿Los maestros están rotos? | **No** — el núcleo ERP sigue sólido. |
| ¿Están completos post IAM V2 + Active Sessions? | **No** — lag documental **material** en §9.1 y §4.8. |
| ¿Hay contradicciones peligrosas? | **Sí, interpretativas** (IAM-REF-01, LR-01 vs Admin-C, PB-15 vs Admin MAY click). |
| ¿V3 o V2.5? | **V2.5** + PROMPT 4.3. |
| ¿Primer paso? | P0: ampliar §9.1 y §4.8.4; revocar IAM-REF-01 en forma documentada. |

---

*Fin del informe de auditoría. Modo READ ONLY respetado: ningún documento maestro fue modificado en esta entrega.*
