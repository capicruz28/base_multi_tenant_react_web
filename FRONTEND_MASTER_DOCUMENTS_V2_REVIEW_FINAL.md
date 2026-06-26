# FRONTEND — Revisión Final de Documentos Maestros hacia IAM Session Management V2

**Documento:** `FRONTEND_MASTER_DOCUMENTS_V2_REVIEW_FINAL.md`  
**Versión:** 1.0.0  
**Fecha:** 2026-06-24  
**Modo:** READ ONLY — auditoría arquitectónica documental  
**Reemplaza enfoque:** `FRONTEND_MASTER_DOCUMENTS_V2_AUDIT.md` (v1.0.0)  
**Audiencia:** Arquitectura Frontend Enterprise  

---

## 1. Resumen ejecutivo

Esta revisión aplica un **criterio arquitectónico corregido**: los documentos maestros oficiales (`.cursorrules`, `PROMPT_FRONTEND_MAESTRO.md`, `ERP_FRONTEND_STANDARDS_V2.md`) existen para normar el desarrollo de **todos los módulos futuros del ERP**, con referencia canónica **ORG e INV**. IAM Session Management V2 fue un **proyecto transversal de autenticación**; Active Sessions Enterprise es un **módulo administrativo especializado** cuya documentación de módulo **no debe contaminar** el estándar global con componentes, métricas ni UX particulares.

### Veredicto en una línea

Los maestros están **mayoritariamente vigentes**; requieren una **actualización acotada y transversal** (identidad sesión V2, impersonation guard, patrones reutilizables) — **no** una expansión normativa del módulo Active Sessions.

### Corrección respecto a la auditoría anterior

| Hallazgo auditoría v1.0 | Clasificación v1.0 | Clasificación corregida | Motivo |
|-------------------------|-------------------|-------------------------|--------|
| Incorporar `ActiveSessionsPage` en §9.5 | P0 / ampliar §9.1 | **D** | Referencia de módulo, no patrón ERP |
| Subtipo plantilla Admin-C / Tier C enterprise | P0 | **D** | Taxonomía de un módulo admin concreto |
| `SessionDetailDialog` en §10 / V2 | P1 | **D** | Componente del módulo sesiones |
| KPI strip, toolbar monitoring | P1–P2 | **D** | UX/métricas del módulo |
| Toggle Lista/Cards permanente | P1 | **D** | Decisión de producto del módulo |
| Gate «IAM-Session» con checks UX D-* | P1 | **D** (UX) / **A** (solo FE auth) | Separar auth transversal de QA del módulo |
| Excepción §5.11 LR-01 para admin sessions | P0 | **D** | Hook dedicado es decisión de módulo; §5.11 sigue vigente para PUR/SLS |
| `session_id`, `resolveSessionId`, IMP guard | P0 | **A / B** | Afecta arquitectura auth global |
| Progressive Disclosure, Desktop First, feature-first shared | Parcial en v1 | **A** | Patrones reutilizables (sin nombrar componentes sesión) |
| Tiempo relativo sesiones | P3 en v1 | **D** (util sesión) / **A** (patrón transversal genérico) | Separar implementación de regla abstracta |
| IAM-REF-01 «no reabrir IAM» | C-01 alta | **C** (literal) + **B** (reemplazo acotado) | La prohibición absoluta ya no refleja el estado del dominio auth |

### Alcance de cambio recomendado en maestros

| Área | ¿Tocar maestros? |
|------|------------------|
| Identidad sesión IAM V2 (auth) | **Sí** — §4.8.4 + pointers |
| Impersonation + cambiar empresa (P0) | **Sí** — IMP-05 o ampliación §4.8.2 |
| Patrones transversales (PD, DF, FF, paridad vistas, autoauditoría) | **Sí** — anexo o §8/§7 pointer |
| Metodología PROMPT (referencias ORG/INV intactas) | **Sí** — pointer auth V2; sin filas Active Sessions |
| Active Sessions (componentes, KPIs, Cards, Eye, IP mismatch, etc.) | **No** — solo docs de módulo |
| ORG / INV / §5.11 / plantillas A/B | **No** — permanecen intactos |

---

## 2. Revisión documento por documento

### 2.1 `ERP_FRONTEND_STANDARDS_V2.md` (v2.4, 2026-06-19)

| Aspecto | Estado | Acción |
|---------|--------|--------|
| §0–§3 precedencia, glosario base, plantillas §2 | ✅ Vigente | Mantener |
| §4 ME-*, AUTH-01…05, IMP-01…04 | ✅ Vigente con lag | **B** — ampliar IMP; añadir §4.8.4 |
| §4.8.3 Provider + Compositors | ✅ Vigente | Mantener |
| §5–§8 plantillas A/B, listados, RBAC, errores | ✅ Vigente (ref. ORG/INV) | Mantener |
| §5.11 PERF (LR-*, ErpList) | ✅ Vigente | Mantener — **no** crear excepción Active Sessions |
| §9.1 IAM (Sprints A–D, IAM-REF-01) | ⚠️ Desactualizado | **B + C** — actualizar cierre; eliminar «no reabrir» absoluto |
| §9.2 ORG, §9.3 INV | ✅ Referencia oficial | **Intacto** |
| §9.5 matriz copiar | ✅ Vigente | Mantener ORG/INV; **no** añadir ActiveSessionsPage |
| §10 mapa componentes | ✅ Vigente para ORG/INV/IAM catálogo | **no** añadir componentes sesión |
| §11 Gates 0–4 | ✅ Vigente para módulos ERP | Ampliar Gate 1 con ítems auth V2; **no** Gate UX sesiones |
| §13 changelog | Desactualizado post 2026-06-19 | **B** — entrada 2.5 acotada |

**Filosofía:** V2 sigue siendo el contrato de **módulos operativos** (PUR, SLS, FIN…) copiando ORG/INV. IAM Session V2 extiende **§4 Auth**, no redefine plantillas.

---

### 2.2 `.cursorrules`

| Aspecto | Estado | Acción |
|---------|--------|--------|
| Integridad API, ME-*, plantillas, §5.11, B.1.1, B-L/B-F | ✅ Vigente | Mantener |
| Diseño 2 capas (exclusivo aquí) | ✅ Vigente | Mantener |
| Baseline V1 pointer | ✅ Vigente | Mantener |
| Auth IMP pointer §4.8 | ⚠️ Incompleto | **B** — §4.8.4 session identity; IMP empresa |
| «V2 CONGELADO» (L10) | ⚠️ Ambiguo | **B** — «Normativo v2.5» o quitar «congelado» |
| Checklist evaluación (12 ítems) | ✅ Vigente para ORG/INV | **B** — +2 ítems auth V2; **no** ítems Active Sessions |
| IAM §9.1 pointer | Genérico | **B** — distinguir IAM catálogo vs auth core |
| Sin mención `session_id` | Lag auth | **A** — pointer corto a V2 §4.8.4 |

**Filosofía:** Recordatorios diarios transversales. **Prohibido** copiar decisiones UX de Active Sessions.

---

### 2.3 `docs/prompts/PROMPT_FRONTEND_MAESTRO.md` (v4.2)

| Aspecto | Estado | Acción |
|---------|--------|--------|
| Fase 0–3.5 bootstrap módulos ERP | ✅ Vigente | Mantener |
| Fase 0.5 matriz ORG/INV | ✅ Vigente | **Intacto** — referencia principal |
| Fila «Componentes IAM» (IamSearchInput…) | ✅ Vigente para catálogo Admin | Mantener |
| Fase E Baseline | ✅ Vigente | Mantener |
| Auth/session V2 | Ausente | **A** — nota: remediación auth → V2 §4.8.4 + certificado; **fuera** Fase 0–3.5 módulo |
| Verificación Fase 3 (22 ítems) | ✅ Vigente ORG/INV | **B** — ítems auth si módulo toca sesión; **no** checks Active Sessions |
| Autoauditoría por fases | Ausente como metodología | **A** — SHOULD en Fase 3 para epics grandes |

**Filosofía:** PROMPT arranca **módulos operativos** (PUR, SLS…). Active Sessions no es plantilla de bootstrap.

---

## 3. Reglas que permanecen vigentes (sin cambio)

Toda la normativa cuya referencia canónica es **ORG/INV** permanece **intacta**. No modificar filosofía ni precedencia.

### 3.1 Núcleo ERP operativo

- Clasificación plantillas §2.1: A, A+, B-L, B-F, B-R, T, H, Admin (genérico), Platform.
- Multiempresa JWT: **ME-01 … ME-10**, **E-ME4**, guards §4.5, invalidate ME-03/ME-09.
- Listados PERF §5.11: **LR-01 … LR-10**, **LR-N01 … LR-N04**, **PR-01 … PR-04**.
- Plantilla A: **PA-***, **TB-***, **SR-***, **ES-***, **SK-***, **RB-ROW-***.
- Plantilla B: **PB-***, **CD-***, **ERP-BL-ACT-01** (solo B-L), **SEC-*** transaccional.
- B.1.1 / modales: **B11-***, **MD-05 … MD-08**.
- Integridad API: **API-01 … API-04**, **ER-01/ER-02**, **UX-01 … UX-08**.
- RBAC: **RB-01/02**, **RB-N01 … RB-N04**, **SEC-14**.
- Branding: **BR-01 … BR-05** + diseño 2 capas en `.cursorrules`.
- Gates §11.1–§11.5 para sprints M0/M1/M2.
- §9.2 ORG-REF-01/02, §9.3 INV-REF-01 como referencias obligatorias PUR/SLS/FIN/CRM.
- Arquitectura estructural: Baseline V1, §4.8.3, PROMPT Fase E.

### 3.2 Auth ya normado y sigue correcto

- **AUTH-01 … AUTH-05** — flujos login, selección, onboarding.
- **IMP-01 … IMP-04** — reglas de negocio impersonation (con lag UX en IMP empresa — ver §4).
- **§4.8.3** — shell `AuthContext`, compositors, MUST NOT import desde features.

### 3.3 IAM catálogo (Admin plantilla A)

- **IamSearchInput**, **IamTableEmptyState**, **UserManagementPage** como origen B.1.1.
- **AP-12** rutas admin legacy.
- Separación **§8.3.2** — no mezclar RBAC IAM/LBAC con RBAC negocio ERP.

---

## 4. Reglas que deben actualizarse (categoría B)

| ID propuesto | Regla / apartado actual | Qué actualizar | Fuente |
|--------------|-------------------------|----------------|--------|
| **B-01** | V2 §4.8 — sin identidad sesión V2 | Añadir **§4.8.4 Identidad de sesión IAM V2** (ver §6) | Backend spec §3, FA01, certificado FE |
| **B-02** | V2 §4.8.2 IMP-01…04 | Añadir **IMP-05**: MUST NOT invocar `cambiarEmpresa` ni exponer selector interactivo en impersonación; bloqueo in-place sin CONTROLLED_EXIT | P0 post-cert, diseño impersonation fix |
| **B-03** | V2 §9.1 estado «Sprints A–D» | Actualizar metadatos de cierre: incluir **IAM Session V2 FE certificado** como extensión §4.8, no como nueva plantilla | Compliance certificate |
| **B-04** | V2 §9.1 **IAM-REF-01** | Reemplazar «No reabrir IAM» por alcance acotado: §9.1 = catálogo IAM Admin; §4.8.4 = transporte sesión; UX módulos admin = docs de módulo | Criterio arquitectónico |
| **B-05** | V2 §10 — sin `resolveSessionId` | Añadir entrada **auth/sesión**: `resolveSessionId`, `isCurrentSession` en ruta utils admin/auth (pointer, no componentes UI) | FA01 |
| **B-06** | `.cursorrules` L10 «CONGELADO» | Sincronizar con V2.5 «Normativo»; evitar bloqueo semántico a revisión auth | §13.1 V2 |
| **B-07** | `.cursorrules` evaluación código | Añadir: ¿revoke/listados usan `session_id` vía `resolveSessionId`? ¿`current_session_id` en contexto auth? | FE-01, FE-09, FE-10 |
| **B-08** | PROMPT — sin nota auth V2 | Nota explícita: cambios auth/sesión = epic transversal V2 §4.8.4; bootstrap módulo ORG/INV no cambia | Alcance PROMPT |
| **B-09** | Gate 1 §11.2 | Checkbox: **AUTH/IMP** incluye §4.8.4 si el módulo consume `/auth/sessions` o identidad sesión | FE matrix subset |
| **B-10** | Glosario §1.1 | Entradas: `session_id`, `current_session_id`, `token_id` (refresh vigente, no ID sesión) | Backend spec |

**Nota RC1:** los maestros **no nombran explícitamente** `token_id` como ID de sesión; el riesgo RC1 está en código y docs de módulo. La actualización B-01/B-10 **introduce** la semántica V2 sin eliminar contenido ORG/INV válido.

---

## 5. Reglas que deben eliminarse (categoría C)

| ID | Regla / texto | Documento | Por qué eliminar |
|----|---------------|-----------|------------------|
| **C-01** | **IAM-REF-01** literal: «No reabrir IAM salvo multiempresa FE/BE o LBAC ampliado» | V2 §9.1 | Impide documentar extensiones auth ya certificadas; sustituir por **B-04** (alcance acotado), no por reapertura libre de §9.1 |
| **C-02** | Implicación implícita en auditoría v1 de que Active Sessions es referencia §9.5 | N/A (no está en maestros) | **No introducir** en maestros — evitar deuda futura |
| **C-03** | Cualquier futura «excepción LR-01 Admin sessions» | Propuesta v1 | **No incorporar** — mantener §5.11 uniforme; el módulo documenta su hook en su propia auditoría |

**No eliminar:** IMP-01…04, AUTH-*, ME-*, plantillas, Gates, referencias ORG/INV, §4.8.3 Baseline.

---

## 6. Nuevas reglas arquitectónicas a incorporar (categoría A)

Solo patrones y normas **transversales**. Sin nombres de componentes Active Sessions.

### 6.1 Auth — Identidad sesión IAM V2 (§4.8.4 propuesto)

| ID | Nivel | Regla |
|----|-------|-------|
| **AUTH-V2-01** | MUST | Identificador canónico de sesión = `session_id` (claim JWT `sid`, listados, revoke path param) |
| **AUTH-V2-02** | MUST NOT | Usar `token_id` como ID de sesión en UI, keys de dominio ni revoke — es refresh vigente (RTR) |
| **AUTH-V2-03** | MUST | `current_session_id` desde `GET /auth/me/` en contexto auth; fallback temporal `current_token_id` solo RC1 |
| **AUTH-V2-04** | MUST | `is_current`: prioridad `is_current` backend → `session_id` === `current_session_id` → fallback token RC1 |
| **AUTH-V2-05** | MUST | Revoke self/admin: path param = `resolveSessionId(target)` (`session_id` ?? `token_id` RC1) |
| **AUTH-V2-06** | SHOULD | Pointer normativo: `IAM_SESSION_MANAGEMENT_V2_BACKEND_SPECIFICATION.md` + `FRONTEND_IAM_V2_COMPLIANCE_CERTIFICATE.md` |

**Ubicación:** V2 §4.8.4; pointer en `.cursorrules` y PROMPT nota auth.

### 6.2 Impersonation — guard transversal

| ID | Nivel | Regla |
|----|-------|-------|
| **IMP-05** | MUST | En impersonación: MUST NOT `POST /auth/empresa/cambiar/`; selector empresa readonly; sesión impersonada permanece |
| **IMP-06** | MUST | Guard canónico en provider (`cambiarEmpresaActiva`); UI refleja `canSwitchEmpresa`; MUST NOT CONTROLLED_EXIT por intento cambio empresa |

**Ubicación:** V2 §4.8.2; pointer `.cursorrules` ME/Auth.

### 6.3 Patrones UX/arquitectura reutilizables (sin componentes concretos)

| ID | Patrón | Regla abstracta | No incluir en V2 |
|----|--------|-------------------|------------------|
| **PD-01** | Progressive Disclosure | Listado/hub = superficie operativa; detalle avanzado = modal `Dialog` + `DialogBody`; acciones destructivas vía confirm separado (B11-10) | `SessionDetailDialog`, secciones sesión |
| **DF-01** | Desktop First | Paneles administración y operación ERP: diseño objetivo desktop (≥1280px); tablet landscape aceptable; mobile no es objetivo primario salvo plantilla explícita | Viewports 1920–1366 de sesiones, D-32 |
| **FF-01** | Feature-first shared | Primitivos de dominio reutilizables dentro del feature: `features/{mod}/components/.../shared/`; plataforma transversal sigue en `@/shared` | `sessions/shared/*` como catálogo §10 |
| **VPAR-01** | Paridad entre vistas | Si un módulo expone ≥2 modos de render (tabla/cards/custom), MUST paridad funcional de acciones, permisos y flujos confirm | Toggle Lista/Cards, `SessionAdminCard` |
| **RT-01** | Tiempo relativo transversal | SHOULD timestamps operativos en listados: formato relativo en celda + tooltip/fecha absoluta; util por módulo | `formatSessionRelativeTime`, reglas expira/refresh sesión |
| **RQ-ADM-01** | React Query — agregados KPI | Si un panel necesita métricas agregadas independientes del listado: queries separadas, keys distintas, invalidación conjunta en mutaciones que afecten ambos | `useActiveSessionsKpiSummary`, copy KPI sesiones |
| **AUD-PH-01** | Autoauditoría por fases | Epics multi-fase SHOULD incluir tabla «fases congeladas intactas» antes de sign-off | Templates de report Active Sessions |
| **TST-FE-01** | Testing auth V2 | Tests MUST cubrir `resolveSessionId`, prioridad `is_current`, revoke path con `session_id` cuando el módulo toca sesiones | Tests de `SessionDetailDialog`, cards |

**Ubicación sugerida:** V2 §8.10 «Patrones transversales post-2026» o anexo normativo ligero; pointers en PROMPT Fase 3.

### 6.4 Arquitectura Auth (ya vigente — solo reforzar pointer)

| Elemento | Acción |
|----------|--------|
| Provider + Compositors (Baseline V1, §4.8.3) | **A** — ya incorporado; mantener |
| Dominio `core/auth/session/` | **A** — pointer en §4.8.4 a políticas refresh/termination/impersonation |
| `docs/arquitectura/IAM_SESSION_FRONTEND_ARCHITECTURE_V1.md` | Actualizar **fuera** de maestros (doc auxiliar); maestros solo pointer |

---

## 7. Elementos que NO deben pasar al estándar (categoría D)

Pertenecen **exclusivamente** a la documentación del módulo Active Sessions (y evidencia de fase). La auditoría v1.0 los clasificó erróneamente como P0–P2 de actualización maestra.

### 7.1 Componentes y páginas

| Elemento | Permanecer en |
|----------|---------------|
| `ActiveSessionsPage`, `MySessionsPage` | UX Design v1.2, reports fase |
| `SessionDetailDialog` | Fase 2 implementation |
| `ActiveSessionsTableView`, `ActiveSessionsCardsView` | Reports fase |
| `SessionAdminCard`, `SessionSelfCard` | Fase 4 Stage 2 |
| `ActiveSessionsKpiStrip`, `ActiveSessionsKpiStripSkeleton` | Fase 1B |
| `ActiveSessionsToolbarMonitoring` | Fase 3 / toolbar consolidation |
| `ActiveSessionsUserFilter`, `ActiveSessionsSortPresets`, `ActiveSessionsFiltersSummary` | Fase 2–3 |
| `ActiveSessionsAutoRefreshSelect`, `ActiveSessionsPanelPagination` | Fase 3 |
| `ActiveSessionsUpdatedMeta`, `ActiveSessionsFilteredResultsMeta` | Fase 1B–2 |
| Primitivos `sessions/shared/*` (SessionIpLine, etc.) | Fase 4 Stage 1 — catálogo de módulo |

### 7.2 Decisiones UX y métricas del módulo

| Elemento | Motivo categoría D |
|----------|-------------------|
| KPI Total tenant / Web / Mobile | Métrica dominio sesiones |
| Tile «Ver próximas a expirar →» | Preset UX sesiones |
| Acciones `Eye` + `LogOut` en grilla | Acciones dominio sesiones |
| Click `<tr>` MAY abrir detalle (D-05) | No generalizar — contradice PB-15 en B-L; es decisión Admin módulo |
| IP mismatch `AlertTriangle` | Regla forense sesiones |
| `user_agent` colapsable «Diagnóstico avanzado» | Contenido dialog sesiones |
| Toggle Lista/Cards + `localStorage` | Preferencia módulo |
| Grid compacto cards, densidad `p-3` | Layout módulo |
| Copy dual KPI vs paginación filtrada | Copy módulo |
| Auto-refresh 30s/1min/5min default Manual | Monitoreo módulo |
| Nota limitación búsqueda `empresa_nombre` | Copy API módulo |
| Tabla 5 columnas / colgroup % | Layout módulo |
| QA viewports 1920, 1600… exclusivos sesiones | QA módulo |

### 7.3 Normativa que la auditoría v1 propuso y esta revisión rechaza

| Propuesta v1 | Decisión final |
|--------------|----------------|
| Subtipo plantilla **Admin-C** en §2.1 | **D** — Admin genérico en V2 basta |
| **Gate IAM-Session** con checks UX D-01…D-32 | **D** — QA en docs módulo; solo FE auth en Gate 1 si aplica |
| Excepción **§5.11 LR-01** para admin sessions | **D** — no debilitar norma PERF global |
| Entradas §10 por cada componente sesión | **D** |
| Fila §9.5 «Admin IAM Tier C → ActiveSessionsPage» | **D** |
| Incorporar `useActiveSessionsList` como patrón | **D** — hook de módulo |

### 7.4 Qué sí se extrae de Active Sessions (patrón → A, no componente)

| De Active Sessions | Patrón maestro |
|--------------------|----------------|
| Dialog detalle + lista condensada | **PD-01** Progressive Disclosure |
| `sessions/shared/` | **FF-01** Feature-first shared |
| Paridad tabla/cards | **VPAR-01** |
| Desktop First declarado | **DF-01** (política ERP admin, sin viewports sesión) |
| `formatSessionRelativeTime` | **RT-01** (regla genérica; util queda en módulo) |
| KPI queries separadas | **RQ-ADM-01** (solo si panel con agregados; no obligatorio en catálogo A) |
| Reports «fase congelada intacta» | **AUD-PH-01** |

---

## 8. Plan recomendado de actualización documental

### Fase 1 — Núcleo auth (obligatorio, acotado)

1. **ERP V2.5** — únicamente:
   - §4.8.4 AUTH-V2-01…06
   - §4.8.2 IMP-05, IMP-06
   - §1.1 glosario session_id / token_id
   - §9.1 B-03, B-04 (metadatos + alcance IAM)
   - §10 B-05 (utils auth, no UI sesiones)
   - §11.2 Gate 1: ítems AUTH-V2 si aplica
   - Changelog 2.5
2. **`.cursorrules`** — pointers §4.8.4, IMP-05; checklist B-07; B-06 congelamiento
3. **`PROMPT` v4.3** — nota B-08; AUD-PH-01 opcional Fase 3

**Esfuerzo estimado:** 1 ciclo documental. **Cero** contenido Active Sessions en maestros.

### Fase 2 — Patrones transversales (recomendado, separable)

1. V2 §8.10 o anexo: PD-01, DF-01, FF-01, VPAR-01, RT-01, RQ-ADM-01, AUD-PH-01, TST-FE-01
2. Pointer PROMPT — «cuando aplique», no MUST global en catálogo A

### Fase 3 — Documentación auxiliar (fuera maestros)

1. Actualizar `IAM_SESSION_FRONTEND_ARCHITECTURE_V1` → V2 alineado certificación
2. Mantener `FRONTEND_ACTIVE_SESSIONS_*` como única fuente UX sesiones
3. Cross-ref desde V2 §9.1: «paneles admin especializados → documentación de módulo»

### Fase 4 — Validación

1. Auditoría READ ONLY: grep maestros sin nombres `ActiveSessions*`, `SessionDetail*`, `KpiStrip`
2. Trazabilidad FE-01…FE-10 → §4.8.4
3. Confirmar §5.11 y §9.3 INV sin cambios

---

## 9. Recomendación de versionado

| Documento | Versión actual | Versión sugerida | Justificación |
|-----------|----------------|-----------------|---------------|
| `ERP_FRONTEND_STANDARDS_V2.md` | 2.4 | **2.5** | Revisión **menor acotada**: auth V2 + IMP-05/06 + patrones opcionales §8.10. **No** V3 — sin ruptura plantillas ORG/INV |
| `docs/prompts/PROMPT_FRONTEND_MAESTRO.md` | 4.2 | **4.3** | Nota auth epic + autoauditoría; matriz 0.5 **sin** Active Sessions |
| `.cursorrules` | — | Sync V2.5 | Pointers auth; sin componentes sesión |
| `ERP_FRONTEND_ARCHITECTURE_BASELINE_V1.md` | 1.2 | **1.2** | Sin cambio — Phase-09 vigente |
| Docs módulo Active Sessions | v1.2 + fases | Mantener | Fuente única UX sesiones |

**No recomendado:** `ERP_FRONTEND_STANDARDS_V3` ni inflar V2.5 con contenido categoría D.

---

## 10. Dictamen final

### 10.1 Sobre los documentos maestros

| Documento | Dictamen | Justificación |
|-----------|----------|---------------|
| **`ERP_FRONTEND_STANDARDS_V2.md`** | **Actualización menor acotada (v2.5)** | Núcleo ORG/INV/PERF **correcto y debe permanecer intacto**. Lag real limitado a **§4 Auth** y metadatos §9.1. La auditoría v1 **sobredimensionó** el alcance al mezclar Active Sessions con estándar global. |
| **`.cursorrules`** | **Actualización menor (sync v2.5)** | Recordatorios operativos válidos. Solo añadir pointers auth V2 e impersonation guard. |
| **`PROMPT_FRONTEND_MAESTRO.md`** | **Actualización menor (v4.3)** | Metodología Fase 0–3.5 **no cambia**. ORG/INV siguen siendo referencia de bootstrap. |

### 10.2 Sobre IAM Session Management V2

| Ámbito | ¿Va a maestros? |
|--------|-----------------|
| Identidad `session_id` / `current_session_id` / revoke / `is_current` | **Sí** — §4.8.4 (categoría **A/B**) |
| Refresh, logout, selection token, interceptores | Ya cubierto por AUTH/IMP + Baseline; reforzar pointers |
| Certificado FE-01…FE-25 | Pointer en §4.8.4; checklist Gate 1 subset |

### 10.3 Sobre Active Sessions Enterprise

| Ámbito | ¿Va a maestros? |
|--------|-----------------|
| Cualquier componente, métrica, layout o copy del módulo | **No** — categoría **D** |
| Patrones abstractos (PD, FF, VPAR, DF, RT, RQ-ADM, AUD-PH) | **Sí** — categoría **A**, sin nombrar implementación sesiones |

### 10.4 Sobre la auditoría anterior

`FRONTEND_MASTER_DOCUMENTS_V2_AUDIT.md` identificó correctamente el **lag auth V2** en maestros, pero **equiparó indebidamente** un módulo admin especializado con **arquitectura base reutilizable**. Esta revisión **reclasifica ~60 % de los hallazgos P0–P2** de la auditoría v1 a categoría **D**, reduciendo el alcance de actualización maestra a un **núcleo transversal** compatible con la filosofía original del estándar (ORG/INV como referencia, write-once en V2).

### 10.5 Declaración de integridad normativa

- **Mantener intacta** toda normativa ORG/INV, §5.11, plantillas A/B, Gates M0–M2.
- **No modificar** la precedencia OpenAPI > V2 > Baseline > `.cursorrules` > PROMPT.
- **No convertir** decisiones de producto de Active Sessions en MUST para PUR/SLS/FIN.
- **Sí actualizar** el contrato auth observable para alinear maestros con Backend IAM V2 certificado.

---

## Anexo — Matriz de reclasificación auditoría v1 → revisión final

| Hallazgo auditoría v1 | Cat. v1 | Cat. final |
|-----------------------|---------|------------|
| session_id / current_session_id / resolveSessionId | P0 gap | **A / B** |
| IMP UI guard empresa | P1 C-05 | **A / B** (IMP-05) |
| IAM-REF-01 | P0 C-01 | **C** + **B** |
| Provider + Compositors | Vigente | Vigente |
| Admin IAM Tier C / ActiveSessionsPage ref | P0 | **D** |
| SessionDetailDialog en V2 | P1 | **D** (patrón PD-01 → **A**) |
| KPI strip | P1 | **D** (patrón RQ-ADM-01 → **A** opcional) |
| Lista/Cards toggle | P1 | **D** (VPAR-01 → **A**) |
| Desktop First | P1 | **A** (DF-01 política) |
| Relative time sesiones | P3 | **D** / RT-01 **A** |
| sessions/shared en §10 | P2 | **D** (FF-01 **A**) |
| Toolbar monitoring | P2 | **D** |
| Autoauditoría fases | P2 | **A** (AUD-PH-01) |
| Gate IAM-Session completo | P1 | **D** UX / **B** auth subset Gate 1 |
| LR-01 excepción admin | P0 | **D** |
| Testing 107 tests admin | P2 | **D** módulo / TST-FE-01 **A** |
| V2.5 amplio | Recomendado | **V2.5 acotado** |

---

*Fin de la revisión final. Modo READ ONLY respetado: ningún documento maestro fue modificado.*
