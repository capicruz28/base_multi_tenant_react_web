# Plan Oficial de Actualización — Documentos Maestros Frontend

**Documento:** `FRONTEND_MASTER_DOCUMENTS_UPDATE_PLAN.md`  
**Versión:** 1.0.0  
**Fecha:** 2026-06-24  
**Modo:** READ ONLY — plan documental; **sin ejecución** sobre maestros  
**Alcance:** contenido de `.cursorrules`, `docs/prompts/PROMPT_FRONTEND_MAESTRO.md`, `ERP_FRONTEND_STANDARDS_V2.md`  
**Restricción:** no renombrar archivos · no crear copias físicas (V2.5.md, V3.md, etc.) · no modificar código  

**Antecedentes revisados:**

| Documento | Rol |
|-----------|-----|
| `FRONTEND_MASTER_DOCUMENTS_V2_REVIEW_FINAL.md` | Clasificación transversal vs módulo |
| Revisión normativa Comité (pre V2.5) | Filtrado MUST/SHOULD/RECHAZADA |
| `IAM_SESSION_MANAGEMENT_V2_BACKEND_SPECIFICATION.md` v1.0.0 | Contrato auth |
| `FRONTEND_IAM_V2_COMPLIANCE_CERTIFICATE.md` | Cierre FE-01…FE-25 |
| `FRONTEND_ACTIVE_SESSIONS_ENTERPRISE_UX_DESIGN_V1_2.md` | Solo módulo — **no** fuente maestra |
| ORG / INV (código + V2 §9.2–§9.3) | Referencia arquitectónica intacta |

---

## 1. Resumen ejecutivo

Los tres documentos maestros permanecen **válidos como estándar ERP** con referencia canónica **ORG e INV**. El lag detectado es **acotado y transversal**: identidad de sesión IAM V2 en capa auth, guard de impersonación al cambiar empresa, y metadatos §9.1 desactualizados.

**No se incorporará** ningún artefacto, componente, layout, KPI ni decisión UX de **Active Sessions Enterprise** al estándar global.

**Paquete aprobado para actualización (contenido acumulativo mínimo):**

- Nueva subsección **§4.8.4** en `ERP_FRONTEND_STANDARDS_V2.md` (6 reglas AUTH-V2)
- **IMP-05** MUST en §4.8.2; **IMP-06** SHOULD (comportamiento)
- Glosario §1.1 + pointers §10 (utils auth, no UI sesiones)
- Actualización §9.1 (metadatos + alcance; eliminar IAM-REF-01 literal)
- Gate §11.2 condicional auth V2
- Pointers en `.cursorrules` y nota alcance en PROMPT

**Volumen estimado:** ~120–180 líneas netas en V2; ~15–25 líneas en `.cursorrules`; ~10–15 líneas en PROMPT. **Cero** cambios en §5, §5.11, §6, §9.2, §9.3, Gates 2–4.

**Nota de versionado interno:** al ejecutar el plan, actualizar el campo **Versión/Fecha** en el encabezado de `ERP_FRONTEND_STANDARDS_V2.md` y la línea de versión en PROMPT **dentro del mismo archivo** (p. ej. 2.4 → 2.5, 4.2 → 4.3). **No** crear archivos nuevos.

---

## 2. Estado actual

| Documento | Versión interna | Última revisión | Alineación ORG/INV | Lag auth IAM V2 |
|-----------|----------------|-----------------|--------------------|-----------------|
| `ERP_FRONTEND_STANDARDS_V2.md` | 2.4 (2026-06-19) | Baseline Phase-09 | ✅ Completa | ❌ §4.8 sin identidad V2 |
| `.cursorrules` | Operativo | Sync v2.4 | ✅ Completa | ❌ Sin pointers session_id |
| `PROMPT_FRONTEND_MAESTRO.md` | v4.2 | Módulos ERP Fase 0–3.5 | ✅ ORG/INV matriz 0.5 | ❌ Sin nota epic auth |

**Lo que sigue correcto sin tocar:** ME-01…ME-10, plantillas §2, §5 Plantilla A, §5.11 PERF, §6 B-*, §7 B.1.1, §8 RBAC/errores, §9.2 ORG, §9.3 INV, §11 Gates 0–4 estructura, diseño 2 capas, Baseline §4.8.3.

**Lo que está desactualizado:** §9.1 cierre IAM (solo Sprints A–D); ausencia §4.8.4; IMP sin bloqueo cambio empresa; glosario sin `session_id`/`token_id` semántica V2.

---

## 3. Cambios aprobados (categoría A — incorporar)

Solo reglas **transversales** validadas por revisión normativa.

### A.1 Identidad sesión IAM V2 — §4.8.4 (nuevo)

| ID | Nivel | Regla | Justificación transversal |
|----|-------|-------|---------------------------|
| **AUTH-V2-01** | MUST | Identificador canónico de sesión = `session_id` (JWT `sid`, listados, revoke) | Contrato Backend global; cualquier feature que toque sesiones debe alinearse |
| **AUTH-V2-02** | MUST NOT | No usar `token_id` como ID de sesión en UI, keys de dominio ni revoke | `token_id` = refresh vigente (RTR); error RC1 afecta toda la plataforma |
| **AUTH-V2-03** | MUST | `current_session_id` desde `GET /auth/me/`; fallback `current_token_id` solo RC1 | Contexto auth consumido por todos los módulos vía `useAuth()` |
| **AUTH-V2-04** | SHOULD | Prioridad `is_current`: flag backend → `session_id` === `current_session_id` → fallback token | MUST solo si el módulo lista sesiones |
| **AUTH-V2-05** | MUST* | Revoke: path param = `resolveSessionId(target)` | *Aplica cuando exista API revoke de sesión |
| **AUTH-V2-06** | SHOULD | Pointer: `IAM_SESSION_MANAGEMENT_V2_BACKEND_SPECIFICATION.md` + `FRONTEND_IAM_V2_COMPLIANCE_CERTIFICATE.md` | Trazabilidad sin duplicar certificado |

### A.2 Impersonation — §4.8.2 (extensión)

| ID | Nivel | Regla | Justificación |
|----|-------|-------|---------------|
| **IMP-05** | MUST | En impersonación: MUST NOT `POST /auth/empresa/cambiar/`; selector empresa readonly; sesión impersonada permanece | Shell global (`EmpresaSelector`); afecta soporte en cualquier módulo |
| **IMP-06** | SHOULD | Bloqueo in-place con guard en provider; UI refleja `canSwitchEmpresa` | Comportamiento observable transversal; detalle wiring en doc auxiliar impersonation fix |

### A.3 Patrones transversales (mínimos)

| ID | Nivel | Regla | Documento |
|----|-------|-------|-----------|
| **FF-01** | SHOULD | Primitivos de dominio reutilizables bajo `features/{mod}/components/.../shared/`; plataforma en `@/shared` | V2 §10 nota estructural |
| **RT-01** | SHOULD | Timestamps operativos en listados: formato relativo en celda + tooltip/fecha absoluta | V2 §8 UX (una línea; util por módulo) |

### A.4 Metodología (fuera de norma UX producto)

| ID | Nivel | Regla | Documento |
|----|-------|-------|-----------|
| **AUD-PH-01** | SHOULD | Epics multi-fase: tabla «fases congeladas intactas» antes de sign-off | PROMPT Fase 3 / Fase E — no V2 §11 Gate obligatorio |

### A.5 Pointers §10 (no componentes UI)

| Util | Ruta | Alcance |
|------|------|---------|
| `resolveSessionId` | `@/features/admin/utils/iam-session-id.utils.ts` | Revoke/keys cuando aplique sesión |
| `isCurrentSession` | `@/features/admin/utils/iam-current-session.ts` | Match sesión actual |

*Nota:* ubicación actual en admin; futura extracción a `core/auth` es refactor opcional — el estándar documenta **semántica**, no obliga mover archivos en esta actualización.

---

## 4. Cambios rechazados (no incorporar al estándar)

Validados por Comité normativo — **permanecen fuera** de maestros.

| Propuesta | Motivo rechazo |
|-----------|----------------|
| **PD-01** Progressive Disclosure como ID nuevo | **Duplicidad** — ya cubierto: §6.3.1 ERP-BL-ACT-01, §7.1 B11-10, `DialogBody` |
| **DF-01** Desktop First MUST | **Política producto**, no arquitectura; riesgo WMS/móvil/field |
| **VPAR-01** Paridad Lista/Cards MUST | **Específico** dual-view; ORG/INV = tabla única |
| **RQ-ADM-01** React Query KPI pattern | **Dashboard admin**; no catálogo PUR/SLS |
| **TST-FE-01** Tests MUST auth V2 en todo módulo | Pertenece **certificado IAM** / Gate condicional |
| Subtipo plantilla Admin-C | Taxonomía innecesaria; Admin genérico §2 basta |
| Excepción §5.11 LR-01 admin sessions | Debilitaría PERF global |
| Gate «IAM-Session» con checks UX sesiones | QA de módulo Active Sessions |
| Cualquier componente/página Active Sessions | Ver §6 categoría D |

---

## 5. Cambios eliminados (categoría C)

Texto a **retirar o sustituir** en maestros (no existe equivalente RC1 explícito en maestros hoy; eliminación = reglas obsoletas o literales incorrectos).

| ID | Documento | Sección | Texto a eliminar | Motivo |
|----|-----------|---------|------------------|--------|
| **C-01** | `ERP_FRONTEND_STANDARDS_V2.md` | §9.1 | `**IAM-REF-01:** No reabrir IAM salvo multiempresa FE/BE o LBAC ampliado.` | Contradice cierre IAM Session V2 certificado; bloquea documentar §4.8.4 |
| **C-02** | `.cursorrules` | L10 | `CONGELADO` (mantener «Normativo») | Semántica bloquea revisión auth acotada |
| **C-03** | `PROMPT` | L13 | `CONGELADO` (igual que C-02) | Idem |

**No eliminar:** IMP-01…04, AUTH-01…05, ME-*, plantillas, §5.11, referencias ORG/INV, §4.8.3 Baseline.

**IAM Session V1:** los maestros **no contienen** referencias explícitas a RC1/`token_id` como ID de sesión — no hay texto V1 que borrar; la actualización es **aditiva** (§4.8.4) más C-01.

---

## 6. Categoría D — NO incorporar (Active Sessions y módulo)

Permanecen **exclusivamente** en documentación del módulo (`FRONTEND_ACTIVE_SESSIONS_*`, reports de fase, certificados IAM de implementación).

| Elemento | Por qué no va al estándar |
|----------|---------------------------|
| `ActiveSessionsPage`, `MySessionsPage` | Página de módulo admin; PUR/SLS no la copian |
| `SessionDetailDialog` | UX/detalle forense sesiones; B-L ya tiene patrón Hub propio |
| `ActiveSessionsKpiStrip`, tiles Web/Mobile | Métricas dominio sesiones |
| `ActiveSessionsToolbarMonitoring`, auto-refresh select | Monitoreo operativo del módulo |
| `ActiveSessionsUserFilter`, sort presets, filters summary | Filtros API admin sessions |
| `ActiveSessionsTableView`, `ActiveSessionsCardsView` | Layout 5 columnas / grid del módulo |
| `SessionAdminCard`, `SessionSelfCard` | Cards compactas del módulo |
| `sessions/shared/*` (SessionIpLine, etc.) | Primitivos UI del módulo; FF-01 documenta **patrón**, no estos archivos |
| Eye + LogOut, click fila MAY | Acciones dominio sesiones; PB-15 B-L es distinto |
| IP mismatch, `user_agent` diagnóstico | Forense sesiones |
| Toggle Lista/Cards, `localStorage` view mode | Preferencia producto del módulo |
| Copy dual KPI/paginación, nota búsqueda empresa | Copy API módulo |
| Viewports 1920–1366 QA, Desktop First sesiones | QA/producto módulo |
| `useActiveSessionsKpiSummary`, hook listado dedicado | Implementación módulo; no excepción §5.11 en V2 |
| Wireframes, D-01…D-32 decisiones UX v1.2 | Diseño congelado del módulo |

---

## 7. Análisis de patrones (transversalidad)

| Patrón | Veredicto | Justificación |
|--------|-----------|---------------|
| **Progressive Disclosure** | **Parcialmente transversal** (ya normado) | Abstracto sí; **no** nuevo ID. V2 ya exige lista + modal detalle en B-L (PB-15…21) y B11-10. Incorporar PD-01 duplicaría norma. |
| **Feature Shared (FF-01)** | **Transversal** | PUR/SLS/CRM pueden extraer primitivos bajo `features/.../shared/`. SHOULD, no MUST. |
| **Relative Time (RT-01)** | **Transversal** | Fechas operativas en SLS órdenes, FIN vencimientos, LOG entregas. SHOULD genérico; utils por módulo. |
| **Desktop First** | **Específico de módulo** (como política MUST) | Active Sessions declaró desktop-first admin; no es decisión arquitectónica ERP global. |
| **View Parity** | **Específico de módulo** | Solo si hay dual view; ORG/INV no lo requieren. |
| **Autoauditoría por fases** | **Parcialmente transversal** | Metodología de proceso para epics; **PROMPT**, no V2 Gate M1. |
| **React Query KPI Pattern** | **Específico de módulo** | Paneles con agregados separados del listado; no patrón catálogo A ni B-L estándar. |

---

## 8. Revisión documento por documento

### 8.1 `ERP_FRONTEND_STANDARDS_V2.md`

| Acción | Detalle |
|--------|---------|
| **Agregar** | §4.8.4 AUTH-V2-01…06; IMP-05 MUST, IMP-06 SHOULD en §4.8.2; entradas glosario §1.1; filas §10 utils; línea §8 SHOULD RT-01; nota §10 FF-01; referencias §0.3 certificado IAM |
| **Actualizar** | Encabezado versión/fecha/changelog §13; §9.1 estado y alcance (ver B-03, B-04 abajo); §11.2 Gate 1 ítem condicional AUTH-V2 |
| **Eliminar** | C-01 IAM-REF-01 literal |
| **No tocar** | §2, §4.2–§4.7, §5, §5.11, §6, §7, §8.3–§8.9 (salvo 1 línea RT-01), §9.2, §9.3, §9.4, §9.5 matriz ORG/INV, §11.3–§11.5, Anexo A |

#### B-01 — Nueva §4.8.4

| Campo | Contenido |
|-------|-----------|
| **Sección** | Tras §4.8.3, antes de §5 |
| **Texto actual** | *(ausente)* |
| **Texto propuesto** | Subsección `#### §4.8.4 Identidad de sesión IAM V2` con tabla AUTH-V2-01…06 (texto según §3 de este plan) + alcance: «Aplica a código que consume API `/auth/sessions*` o identidad en `/auth/me/`; no aplica a módulos PUR/SLS/CRM sin superficie de sesión.» |
| **Motivo** | Backend V2 certificado; FE certificado FA01 |
| **Impacto** | Nulo en PUR catálogo; positivo en auth/core |

#### B-02 — IMP-05 / IMP-06

| Campo | Contenido |
|-------|-----------|
| **Sección** | §4.8.2 tabla IMP |
| **Texto actual** | IMP-01…IMP-04 únicamente |
| **Texto propuesto** | Añadir filas IMP-05 (MUST) e IMP-06 (SHOULD) según §3 A.2 |
| **Motivo** | P0 post-cert impersonation; spec Backend §13.5 |
| **Impacto** | Shell global; sin cambio plantillas ORG/INV |

#### B-03 — §9.1 metadatos

| Campo | Contenido |
|-------|-----------|
| **Sección** | §9.1 encabezado «Estado» |
| **Texto actual** | `Cerrado Sprints A–D + B.1.1 overlay. QA RBAC V1 validado.` |
| **Texto propuesto** | `Cerrado Sprints A–D + B.1.1. Transporte sesión IAM V2: §4.8.4 (certificado FE jun 2026). Catálogo Admin: componentes §10. Paneles admin especializados: documentación de módulo (no §9.5).` |
| **Motivo** | Reflejar cierre auth sin abrir §9.5 a Active Sessions |
| **Impacto** | Metadato; cero cambio Gates ORG/INV |

#### B-04 — Sustituir IAM-REF-01 (C-01)

| Campo | Contenido |
|-------|-----------|
| **Sección** | §9.1 |
| **Texto actual** | `IAM-REF-01: No reabrir IAM salvo...` |
| **Texto propuesto** | `**IAM-REF-01:** §9.1 cubre catálogo IAM Admin (componentes tabla, B.1.1 origen). Reglas transporte sesión: §4.8.4. MUST NOT replicar reglas IAM/LBAC en módulos ERP operativos (§8.3.2). UX de paneles admin especializados: docs de módulo.` |
| **Motivo** | Alcance acotado sin prohibir §4.8.4 |
| **Impacto** | Clarifica frontera IAM vs PUR |

#### B-05 — Glosario §1.1

| Campo | Contenido |
|-------|-----------|
| **Texto propuesto** | Tres filas: `session_id`, `current_session_id`, `token_id` (refresh vigente, no ID sesión) |
| **Impacto** | Documentación; sin cambio código ORG/INV |

#### B-06 — §10 pointers

| Campo | Contenido |
|-------|-----------|
| **Texto propuesto** | 2 filas utils auth (§3 A.5) + nota FF-01 bajo encabezado §10 |
| **Impacto** | Descubribilidad; no catalogar componentes sesión |

#### B-07 — §11.2 Gate 1

| Campo | Contenido |
|-------|-----------|
| **Texto actual** | `IMP-01 … IMP-03 si ruta accesible en impersonation` |
| **Texto propuesto** | Añadir: `- [ ] **AUTH-V2-01…05**, **IMP-05** si el módulo consume API de sesión o revoke` |
| **Impacto** | Gate condicional; PUR M0 no obligado |

#### B-08 — Changelog §13

| Campo | Contenido |
|-------|-----------|
| **Texto propuesto** | Entrada con fecha ejecución: §4.8.4, IMP-05/06, §9.1, glosario, RT-01/FF-01 SHOULD |
| **Impacto** | Trazabilidad |

---

### 8.2 `.cursorrules`

| Acción | Detalle |
|--------|---------|
| **Agregar** | Pointer §4.8.4 en bloque Auth; ítem evaluación código condicional sesión; IMP-05 recordatorio |
| **Actualizar** | L10 «CONGELADO» → «Normativo» (C-02) |
| **Eliminar** | Literal «CONGELADO» |
| **No tocar** | Integridad API, ME-*, plantillas A/B, §5.11, diseño 2 capas, Baseline, orden precedencia, checklist ítems 1–12 |

#### B-09 — Norma ERP L10

| **Texto actual** | `(CONGELADO — única fuente normativa UX/plataforma)` |
| **Texto propuesto** | `(Normativo — única fuente UX/plataforma; revisión §4.8.4 auth V2)` |

#### B-10 — Bloque ERP MULTIEMPRESA / Auth (~L175)

| **Texto propuesto** | Añadir bullet: `- Identidad sesión V2: V2 §4.8.4 AUTH-V2-*; IMP-05 impersonación empresa` |

#### B-11 — Checklist evaluación (~L99)

| **Texto propuesto** | Ítem 13: `¿Código de sesión usa session_id (no token_id como ID) vía V2 §4.8.4?` — solo si aplica API sesiones. Ítem 14: `¿Impersonación bloquea cambio empresa (IMP-05)?` |

---

### 8.3 `docs/prompts/PROMPT_FRONTEND_MAESTRO.md`

| Acción | Detalle |
|--------|---------|
| **Agregar** | Nota alcance auth epic; AUD-PH-01 opcional Fase 3 |
| **Actualizar** | L13 CONGELADO; versión interna 4.2→4.3 en título al ejecutar |
| **Eliminar** | CONGELADO literal |
| **No tocar** | Fase 0–3.5 flujo, matriz 0.5 ORG/INV, Gates §11 referencia, Fase E, reglas absolutas, verificación ítems 1–22 |

#### B-12 — CONTEXTO alcance

| **Texto propuesto** | Tras L19: `**Auth / sesión IAM V2:** cambios transversales → V2 §4.8.4 + epic dedicado; **no** parte del bootstrap Fase 0–3.5 de módulos operativos PUR/SLS/…` |

#### B-13 — Fase 3 verificación

| **Texto propuesto** | Ítem 23 (opcional): `Epic multi-fase: tabla fases congeladas (AUD-PH-01)`. **No** añadir checks Active Sessions. |

#### B-14 — Matriz 0.5

| **Acción** | **No tocar** — sin fila ActiveSessionsPage |

---

## 9. Riesgos

| Riesgo | Mitigación en plan |
|--------|-------------------|
| Contaminar estándar con Active Sessions | Lista categoría D explícita; §9.1 no abre §9.5 |
| Romper ORG referencia | §9.2, ORG-REF-*, sin cambios |
| Romper INV referencia | §9.3, INV-REF-*, §6 B-L intactos |
| Romper §5.11 PERF | Sin excepción LR-01; sin hooks sesión en norma |
| Romper plantillas §2 | Sin Admin-C; sin DF-01 MUST |
| Romper Gates M1/M2 | Gate 1 solo ítem **condicional** auth |
| Romper Baseline L9 | §4.8.3 sin cambio; IMP-06 detalle en auxiliar |
| Duplicidad normativa | PD-01 rechazado |
| Sobreingeniería PUR | AUTH-V2 alcance condicional; FF-01/RT-01 SHOULD |
| Confusión PB-15 vs Admin click fila | No normar click fila admin; D-05 queda en módulo |

**Confirmación:** las modificaciones aprobadas **no alteran** reglas MUST de ORG, INV, §5.11, plantillas oficiales ni estructura Gates 2–4.

---

## 10. Checklist previo a la actualización (ejecución futura)

### Gobernanza

- [ ] Aprobación Arquitectura de este plan (`FRONTEND_MASTER_DOCUMENTS_UPDATE_PLAN.md`)
- [ ] Confirmación: **ningún** ítem categoría D en el diff
- [ ] Confirmación: no crear archivos `*_V2.5.md` ni renombrar maestros

### Contenido V2

- [ ] §4.8.4 AUTH-V2-01…06 con alcance condicional explícito
- [ ] IMP-05 MUST + IMP-06 SHOULD en §4.8.2
- [ ] C-01 eliminado; B-04 IAM-REF-01 reemplazado
- [ ] Glosario + §10 pointers (utils, no UI sesión)
- [ ] §9.2, §9.3, §5.11: diff vacío
- [ ] Changelog §13 actualizado **en el mismo archivo**

### Satélites

- [ ] `.cursorrules`: CONGELADO→Normativo; pointers auth
- [ ] PROMPT: nota epic auth; sin filas Active Sessions

### Validación post-escritura (READ ONLY)

- [ ] `rg ActiveSessions|SessionDetail|KpiStrip` en maestros → 0 matches
- [ ] `rg IAM-REF-01` → texto nuevo sin «No reabrir»
- [ ] Trazabilidad AUTH-V2 → certificado FE (pointer only)
- [ ] `tsc`/lint no aplica (solo docs)

---

## 11. Dictamen final

### **A) Listo para actualizar los documentos oficiales**

**Justificación:**

1. El alcance está **filtrado** tras dos revisiones (arquitectónica + normativa Comité); los rechazos están documentados (§4).
2. El paquete es **mínimo, acumulativo y compatible** con ORG/INV — no replantea plantillas ni §5.11.
3. Active Sessions queda **explícitamente fuera** (§6); el error de enfoque de la auditoría inicial está corregido.
4. No se requiere **C)** (no modificar): el lag auth V2 en maestros es real y transversal.
5. No se requiere **D)** (replantear): el Comité ya depuró la propuesta; ejecutar **exactamente** este plan.

**Condición de ejecución:** aplicar únicamente ítems §3 (aprobados) y §8 (B-01…B-14); **no** recuperar hallazgos rechazados de `FRONTEND_MASTER_DOCUMENTS_V2_AUDIT.md` v1.0.

**Orden de ejecución recomendado (cuando se autorice):**

1. `ERP_FRONTEND_STANDARDS_V2.md` (núcleo)
2. `.cursorrules` (pointers)
3. `PROMPT_FRONTEND_MAESTRO.md` (nota alcance)
4. Auditoría READ ONLY de cierre (grep + diff review)

---

*Plan oficial READ ONLY. Ningún documento maestro fue modificado en esta entrega.*
