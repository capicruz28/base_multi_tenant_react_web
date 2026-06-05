# Auditoría final — Consistencia `ERP_FRONTEND_STANDARDS_V2`

**Fecha:** 31 mayo 2026  
**Estado:** Pre-congelación V2 — **sin** modificar `.cursorrules`, PROMPT ni código  
**Objeto:** [`ERP_FRONTEND_STANDARDS_V2.md`](./ERP_FRONTEND_STANDARDS_V2.md)  
**Referencias cruzadas:** [`.cursorrules`](./.cursorrules) · [`docs/prompts/PROMPT_FRONTEND_MAESTRO.md`](./docs/prompts/PROMPT_FRONTEND_MAESTRO.md) · [`AUDITORIA_FINAL_V2_GAPS.md`](./AUDITORIA_FINAL_V2_GAPS.md)

---

## 1. Veredicto ejecutivo

| Pregunta | Respuesta |
|----------|-----------|
| ¿V2 es internamente coherente? | **Sí, con 3 defectos P1** a corregir antes de congelar |
| ¿Write-once se cumple? | **Sí** en diseño; **redundancia intencional** AP↔ME↔TB aceptable |
| ¿Gates §11 bastan para PUR-M0/M1/M2? | **Sí**, con **matriz sprint→Gate** explícita (§5) y 2 aclaraciones |
| ¿Referencias IAM/ORG/INV consistentes? | **Sí** salvo nombre función AUTH-02 vs código |
| ¿Listo congelar V2 tras micro-fix? | **✅ Sí** — 3 correcciones P1 + 4 simplificaciones opcionales P2 |

**Conclusión:** Proceder a actualizar `.cursorrules` y PROMPT **después** de aplicar los 3 fixes P1 en V2 (5 minutos de edición). No requiere re-auditoría arquitectónica.

---

## 2. Defectos internos (corregir antes de congelar)

### 2.1 P1 — Nombre de función AUTH-02 vs código real

| Ubicación V2 | Texto V2 | Código real |
|--------------|----------|-------------|
| AUTH-02 §4.8 | `resolvePostLoginFromMenu` | **`resolvePostLoginPath`** en `src/core/routing/post-login-path.ts` |
| §10 mapa | `resolvePostLoginFromMenu` | Idem — **no existe** en repo |

**Impacto:** Implementadores y PROMPT v2 citarían símbolo inexistente.  
**Fix:** Unificar AUTH-02 y §10 a `resolvePostLoginPath` (archivo `post-login-path.ts`).

### 2.2 P1 — Fila ME-10 malformada

```272:272:ERP_FRONTEND_STANDARDS_V2.md
| **ME-10** | SHOULD | Hooks GET nuevos usan `useTenantQuery` ...
```

La columna duplica `SHOULD |` (artefacto de redacción).  
**Fix:** Una sola columna nivel + regla, como ME-07…ME-09.

### 2.3 P1 — AP-12 nivel normativo ambiguo

AP-12 vive en tabla **Anti-patrones MUST NOT** (§3.2) pero la regla es **SHOULD** (redirect/403 en rutas legacy).

**Impacto:** Confusión MUST vs SHOULD; Gate 0 no referencia AP-12.  
**Fix (elegir uno):**

| Opción | Acción |
|--------|--------|
| **A (recomendada)** | Mover AP-12 a §9.1 Admin como **AP-12 SHOULD**; quitar de §3.2 |
| B | Renombrar a recomendación en Anexo; §3.2 solo MUST NOT |

---

## 3. Redundancias internas V2

### 3.1 Redundancia intencional (aceptable — no eliminar)

La matriz anti-redundancia (final V2) es **correcta**. Estas triadas son **by design**:

| Tema | Hogar canónico | Eco positivo | Eco anti-patrón |
|------|----------------|--------------|-----------------|
| Sin selector empresa | ME-02 | TB-03 | AP-01 |
| UUID visible | E-ME4-01 | FK-01 texto | AP-03 |
| B.1.1 modal | B11-01 | PA-05 | AP-04 |
| Confirm baja separado | B11-02 | PA-07 | AP-06 |
| No transactional guard en A | CL-05 | PA-06 | — |
| Toast único | ER-02 | — | AP-11 |

**Veredicto:** Mantener. Los ecos permiten lectura por capítulo sin saltar §3.

### 3.2 Redundancia evitable (simplificación P2)

| ID | Duplicación | Propuesta |
|----|-------------|-----------|
| **R-DUP-01** | §4.7 resumen estados + §4.8 detalle AUTH/IMP | Mantener §4.7 como índice 4 filas — OK; no expandir |
| **R-DUP-02** | §12 tabla GAP + `AUDITORIA_FINAL_V2_GAPS.md` | §12 → pointer de 5 líneas + link auditoría GAPs |
| **R-DUP-03** | Índice cruzadas + Matriz anti-redundancia (final) | Fusionar en **un solo apéndice** post-§13 |
| **R-DUP-04** | CL-05 ≡ PA-06 (misma prohibición) | Conservar CL-05 en §2; PA-06 → “ver CL-05” |

### 3.3 Contradicciones internas reales

| ID | Tema | ¿Contradicción? | Resolución |
|----|------|-----------------|------------|
| C-01 | PA-09 **MUST** reset modals vs ME-09 **SHOULD** reset general | **No** — PA-09 acota Plantilla A; ME-09 es capa transversal |
| C-02 | AP-08 prohíbe empty inline A vs PB-06 permite B-L | **No** — plantillas distintas |
| C-03 | PR-01 nivel **SHOULD** con cláusula “hook **MUST**” | **Tensión menor** — reformular: “Si API pagina, PR-01a MUST queryKey; PR-01 es SHOULD adoptar paginación” |
| C-04 | SEC-01 MUST `useInvTransactionalFormGuard` en PUR | **No** — §7.2 ya dice copiar/rename; EXT-02 Anexo |
| C-05 | §2.3 PRC “B-F o A+” | **Ambigüedad**, no contradicción — resolver en auditoría PUR Gate 0 |

**Veredicto:** Ninguna contradicción bloqueante tras fix P1 §2.

---

## 4. Reglas: hogar único V2 vs resumen `.cursorrules`

### 4.1 Debe vivir **solo en V2** (no copiar a `.cursorrules`)

| Bloque | IDs / § | Motivo |
|--------|---------|--------|
| Taxonomía plantillas | §1.2, §2 | Árbol completo + matriz PUR/SLS/FIN/LOG |
| AUTH / IMP | §4.8 | Flujos transversales detallados |
| Gates completos | §11 | Checklist única ecosistema |
| Mapa componentes | §10 | Rutas — write once |
| B.1.1 modal matriz | §7.1 B11-xx | QA 9 casos |
| B-F SEC | §7.2 SEC-xx | Matriz M2 |
| Plantilla B reglas | §6 PB/CD | Contraste vs A |
| Platform | §9.4 PL-xx | Scope especial |
| Anexo deuda | Anexo A | No MUST |
| Referencias módulo | §9.1–9.6 | Qué copiar de IAM/ORG/INV |

### 4.2 Debe **permanecer resumido en `.cursorrules`** (pointer a V2)

| Bloque actual `.cursorrules` | Acción v2 | Pointer V2 |
|------------------------------|-----------|------------|
| Integridad API (deprecated, cabecera+detalle) | **Mantener resumen** (~40 líneas) | §8.1 API-xx |
| Nunca IDs UI | **Mantener 1 párrafo** | E-ME4 §4.6 |
| Manejo errores / toast | **Mantener jerarquía detail** (más operativa que ER-01) | §8.5 ER-xx |
| UX layout toolbar H1 | **Acortar + pointer** | TB-01, §5.2 |
| Loading/error/empty genérico | **Reemplazar nombres** | ES-01, SK-01, §10 |
| Modales “excepto cambios sin guardar” | **1 línea + pointer** | §7.1 B11-xx |
| RBAC no render | **Mantener** | RB-01 |
| Diseño 2 capas | **Mantener completo** | §0.2 (fuera V2) |
| **NUEVO** multiempresa JWT | **~8 líneas MUST** | ME-01…ME-06, §4 |
| **NUEVO** componentes estándar | **Lista nombres** | §10 |
| **NUEVO** precedencia | **1 línea** | §0.3 |
| **ELIMINAR** “Filtros visibles (empresa…” L177 | **Contradice ME-02** | — |

**Tamaño objetivo `.cursorrules` ERP:** ~45–55 líneas nuevas + links; **no** duplicar tablas §5/§7/§11.

### 4.3 Debe vivir **solo en PROMPT** (proceso, no norma)

| Contenido | Mantener en PROMPT | Pointer V2 |
|-----------|-------------------|------------|
| Fase 0 pasos OpenAPI | Sí | Gate 0 §11.1 |
| Bloque 4 paso 4.0 diseño entidad | Sí (procedimiento) | §2 clasificación |
| Orden types→hooks→components | Sí | — |
| Plantilla A/B elección | **Recortar** → tabla §2.3 | §2, §9.5 |
| Gates QA sign-off | **Nuevo** Fase 3.5 | §11 |
| Diseño 2 capas duplicado | **Eliminar** → “ver `.cursorrules`” | §0.2 |

### 4.4 Solapamiento V2 ↔ `.cursorrules` hoy (pre-actualización)

| Tema | V2 | `.cursorrules` | Conflicto |
|------|-----|----------------|-----------|
| Selector empresa toolbar | ME-02 MUST NOT | L177 “Filtros (empresa…” | **🔴 PROMPT/cursorrules obsoletos** |
| Empty genérico | ES-01 `IamTableEmptyState` | “ilustración + mensaje” | **⚠ cursorrules vago** |
| Skeleton | SK-01 `InvTableSkeleton` | “skeleton o spinner” | **⚠ cursorrules permisivo** |
| B.1.1 | §7 completo | 1 línea modales | **OK** — cursorrules debe pointer |
| Cabecera+detalle | CD-01… | Bloque completo | **OK** — duplicación aceptada resumen |
| empresa_id genérico L25 | ME-01/05 | “SIEMPRE incluir empresa_id” | **⚠** — falta “= sesión JWT” |

**Veredicto:** Tras pointers, **precedencia V2 resuelve** conflictos; `.cursorrules` v2 debe **corregir** L177 y L25.

---

## 5. Validación Gates §11 — PUR-M0, PUR-M1, PUR-M2

### 5.1 Alcance por sprint PUR (convención INV)

| Sprint PUR | Alcance típico | Plantillas |
|------------|----------------|------------|
| **PUR-M0** | Infra multiempresa + guards + hooks gate + piloto 1 catálogo | Gate 1 en rutas company |
| **PUR-M1** | Catálogos Plantilla A + UX + B.1.1 modales | Gate 2 por pantalla A |
| **PUR-M2** | B-L (solicitudes/cotizaciones) + B-F (OC/recepciones) + SEC | Gate 3 **por ruta** |

### 5.2 Matriz sprint → Gate

| Gate | PUR-M0 | PUR-M1 | PUR-M2 |
|------|--------|--------|--------|
| **0** Clasificación | ✅ Obligatorio inicio | ✅ Por pantalla nueva | ✅ Por ruta B nueva |
| **1** Multiempresa | ✅ **Núcleo M0** | ✅ Regresión al tocar hooks | ✅ Regresión B-F empresa |
| **2** Plantilla A | ⚪ Solo piloto si A | ✅ **Núcleo M1** | ⚪ Catálogos ya cerrados |
| **3** Plantilla B | ⚪ N/A | ⚪ N/A | ✅ **Núcleo M2** |
| **4** Calidad | ✅ tsc/eslint módulo | ✅ + QA B.1.1 modal | ✅ + QA B-F matrix |

**AUTH-01…04 / IMP-01…03 en Gate 1:** Condicional (“si aplica”) — **correcto** para PUR; no bloquea M0 salvo tocar páginas auth.

### 5.3 Suficiencia y gaps menores

| Aspecto | ¿Suficiente? | Nota |
|---------|--------------|------|
| M0: scope + invalidate + guard | ✅ Gate 1 + §4.5 patrón | Copiar INV M0-b |
| M0: sin selector empresa | ✅ ME-02, AP-01 | — |
| M1: toolbar/empty/skeleton/search | ✅ Gate 2 | SR-03 debounce SHOULD — no en Gate (OK) |
| M1: B.1.1 create+edit | ✅ Gate 2 + B11 + QA INV_M3 | — |
| M1: A+ (producto proveedor extenso) | ⚠ **Gap menor** | Gate 2 lista PA-01…09 pero **no PA+-01…03** explícitos |
| M2: OC/recepciones B-F | ✅ Gate 3 CD + SEC | Matriz INV_M2_SEC |
| M2: solicitudes B-L | ✅ Gate 3 PB-04…08 | PB-06 empty inline MAY — no bloquea |
| M2: `usePurTransactionalFormGuard` | ✅ SEC-01 + EXT-02 | Copiar INV si no extracto |
| Paginación PUR API | ✅ Gate 4 condicional PR | Si OpenAPI pagina |

**Recomendación pre-congelación (P2):** Añadir nota §11.3:

> *Gate 2 en catálogos **A+**: verificar además PA+-01…03.*

**Recomendación §11.4:**

> *Gate 3 se aplica **por ruta** según plantilla B-L / B-F / B-R — no exigir B-F SEC en pantallas B-R.*

### 5.4 Veredicto Gates PUR

| Sprint | Gates mínimos cerrados | Bloqueante |
|--------|------------------------|------------|
| PUR-M0 | 0 + 1 + 4 | **Ninguno** |
| PUR-M1 | 0 + 2 + 4 (por catálogo) | **Ninguno** |
| PUR-M2 | 0 + 3 + 4 (por ruta B) | **Ninguno** |

---

## 6. Consistencia referencias IAM · ORG · INV

### 6.1 IAM (§9.1)

| Afirmación V2 | Evidencia | Estado |
|---------------|-----------|--------|
| Cerrado Sprints A–D + B.1.1 | `TENANT_ADMIN_GLOBAL_UX_AUDIT.md` §3.1 | ✅ |
| Origen B.1.1 `UserManagementPage` | Código + Sprint B | ✅ |
| `IamSearchInput`, `IamTableEmptyState` | §10 rutas admin/iam | ✅ |
| IAM-REF-01 no reabrir | Alineado cierres | ✅ |
| Multiempresa UI pendiente BE | No MUST V2 | ✅ |

### 6.2 ORG (§9.2)

| Afirmación V2 | Evidencia | Estado |
|---------------|-----------|--------|
| Cerrado funcional multiempresa | `ORG_CLOSE_AUDIT.md` | ✅ |
| B.1.1 en **6 páginas** E-SEC | `ORG_SPRINT_CLOSURE_AUDIT.md` QA 6 páginas | ✅ |
| `ParametrosPage` = H | Código + clasificación | ✅ |
| AP-10 no copiar `EmpresaPage` monolito | ORG deuda DT-02 | ✅ |
| ORG-REF-01 DT-xx → Anexo | Anexo A DT-01…12 | ✅ |

### 6.3 INV (§9.3)

| Afirmación V2 | Evidencia | Estado |
|---------------|-----------|--------|
| **CERRADO OFICIAL** | `INV_MODULE_CLOSURE_AUDIT.md` §1.2 | ✅ |
| 5 catálogos A + Productos A+ | §2.1 inventario 13 rutas | ✅ |
| B-F / B-L / B-R referencias | Pantallas listadas §9.3 | ✅ |
| M3 B.1.1 patrón ORG E-SEC | `INV_M3_B11_CATALOGS_AUDIT.md` | ✅ |
| `useInvTransactionalFormGuard` | M2-SEC QA | ✅ |

### 6.4 Inconsistencias referencia ↔ código

| ID | V2 dice | Realidad | Severidad |
|----|---------|----------|-----------|
| **REF-01** | `resolvePostLoginFromMenu` | `resolvePostLoginPath` | **P1** — ver §2.1 |
| REF-02 | §5.9 “UnidadesMedidaPage piloto M3” | M0-b piloto fue **CategoriasPage**; M3 cubrió 5 catálogos | **P3** — imprecisión histórica, no normativa |
| REF-03 | §9.3 “Patrón ORG E-SEC reutilizado M3” | Correcto — INV usa `createOrgDiscardHandlers` | ✅ |

---

## 7. Contradicciones V2 ↔ documentos derivados (pre-actualización)

| # | V2 | `.cursorrules` / PROMPT | Acción derivados |
|---|-----|-------------------------|------------------|
| 1 | ME-02: no filtro empresa | PROMPT L376, L542; cursorrules L177 | Corregir en PROMPT v2 + cursorrules v2 |
| 2 | ME-01: empresa = sesión JWT | PROMPT L36, L191 Zustand genérico | PROMPT Fase 0.2 → `useEmpresaActiva` |
| 3 | ES-01 / SK-01 componentes nombrados | cursorrules genérico | Pointer §10 |
| 4 | §2 clasificación obligatoria | PROMPT sin Fase 0.4 plantilla | Añadir Fase 0.4 → §2.1 |
| 5 | §11 Gates | PROMPT sin Gates | Fase 3.5 checklist §11 |
| 6 | Precedencia OpenAPI > V2 > cursorrules | cursorrules no cita V2 | Header pointer `ERP_FRONTEND_STANDARDS_V2.md` |
| 7 | AUTH-02 función | — | Fix V2 primero (§2.1) |

**Nota:** Estas contradicciones son **esperadas** pre-sync; no invalidan V2.

---

## 8. Simplificaciones recomendadas antes de congelar V2

| Prioridad | Acción | Esfuerzo | Beneficio |
|-----------|--------|----------|-----------|
| **P1** | Fix `resolvePostLoginPath` AUTH-02 + §10 | 2 min | Evita implementación incorrecta |
| **P1** | Fix fila ME-10 | 1 min | Legibilidad normativa |
| **P1** | Resolver AP-12 nivel (§2.3) | 3 min | Claridad MUST/SHOULD |
| P2 | Nota Gate 2 A+ / Gate 3 por ruta §11 | 5 min | PUR-M1/M2 sin ambigüedad |
| P2 | Acortar §12 → pointer auditoría GAPs | 5 min | -15 líneas duplicadas |
| P2 | Fusionar índices finales V2 | 5 min | Documento más legible |
| P2 | PR-01 split SHOULD/MUST cláusula | 3 min | Norma más clara |
| P3 | §5.9 precisión piloto (Categorias M0 / 5 cat M3) | 2 min | Histórico exacto |

**No recomendado antes de congelar:**

- Fusionar capítulos §5/§7 (rompe write-once por plantilla)
- Elevar SR-03, ME-10, PL-03 a MUST
- Duplicar Gates en Anexo A

---

## 9. Checklist pre-congelación V2

- [ ] **P1** AUTH-02 + §10 → `resolvePostLoginPath`
- [ ] **P1** Corregir tabla ME-10
- [ ] **P1** AP-12 nivel normativo
- [ ] **P2** §11 nota A+ y Gate 3 por ruta
- [ ] **P2** §12 acortar (opcional)
- [ ] Banner supersede en V1
- [ ] Luego: `.cursorrules` v2 según §4.2
- [ ] Luego: PROMPT v2 según §4.3 y §7

---

## 10. Veredicto final

| Criterio | Estado |
|----------|--------|
| Contradicciones internas bloqueantes | **0** (3 defectos P1 corregibles) |
| Redundancia AP↔ME | **Intencional — OK** |
| Write-once V2 vs derivados | **Diseño correcto** |
| Gates PUR-M0/M1/M2 | **✅ Suficientes** + 2 notas P2 |
| IAM / ORG / INV | **✅ Consistentes** |
| Listo congelar tras micro-fix | **✅ Sí** |

---

*Auditoría consistencia V2. Sin modificar `.cursorrules`, PROMPT ni código. Sin commit.*
