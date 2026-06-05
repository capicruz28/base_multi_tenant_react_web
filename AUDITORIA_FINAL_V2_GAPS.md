# Auditoría final — GAPs y validación arquitectónica V2

**Fecha:** 31 mayo 2026  
**Estado:** Validación pre-redacción — **sin** `ERP_FRONTEND_STANDARDS_V2` completo  
**Base:** Outline V2 acordado · Cierres IAM · ORG · INV  
**Sin código · sin modificar `.cursorrules` · sin modificar PROMPT · sin commit**

---

## 1. Veredicto ejecutivo

| Pregunta | Respuesta |
|----------|-----------|
| ¿El outline V2 es arquitectónicamente suficiente para PUR/SLS/FIN/LOG? | **Sí**, con **8 reglas normativas nuevas** (§3) y **4 extensiones menores** al outline |
| ¿Los 12 GAP deben entrar todos en V2 MUST? | **No** — 4 normativos, 5 SHOULD, 3 solo Anexo/deuda |
| ¿§2 cubre escenarios ERP previstos? | **Sí** para dominio operativo ERP; **extensión documentada** para Platform y flujos auth |
| ¿§9 + §10 bastan para bootstrap sin auditoría arquitectónica extra? | **Sí para patrones**; **no sustituyen** auditoría contrato OpenAPI por módulo (PROMPT Fase 0) |

**Conclusión:** Proceder a redactar V2 incorporando las reglas de §3. No bloqueante para arrancar PUR-M0.

---

## 2. Disposición de los 12 GAP del outline

Leyenda de destino en V2:

| Destino | Significado |
|---------|-------------|
| **MUST** | Regla normativa obligatoria en cuerpo V2 |
| **SHOULD** | Regla recomendada en cuerpo V2 |
| **Anexo A** | Deuda / backlog; no Gate checklist |
| **Doc externo** | Cross-ref mínima en V2; detalle fuera del estándar ERP operativo |

### 2.1 Tabla de disposición

| ID | Vacío (outline §12) | Severidad | Destino V2 | ID regla propuesta | Justificación |
|----|---------------------|-----------|------------|-------------------|---------------|
| **GAP-01** | Platform / Super Admin sin módulo cerrado | Media | **SHOULD** + Anexo | **PL-01…PL-04** (§9.4) | Operativo en prod; no QA formal B.1.1; no bloquea PUR |
| **GAP-02** | Auth / Selección empresa / Onboarding | Media | **MUST** (mínimo) + Doc externo | **AUTH-01…AUTH-05** (§4.8) | Flujos transversales; sin norma = regresión multiempresa |
| **GAP-03** | Paginación server-side | Baja | **SHOULD** | **PR-01…PR-03** (§8.7) | Patrón existe (super-admin clientes); ORG/INV mayoría sin page |
| **GAP-04** | Debounce búsqueda | Baja | **SHOULD** (ya outline) | **SR-03** | IAM referencia; no MUST hasta adopción ORG |
| **GAP-05** | Empty B-L inline vs IAM | Baja | **SHOULD** (ya outline) | **PB-06** + Anexo **ES-B** | Comportamiento válido B; mejora cosmética |
| **GAP-06** | `useTenantQuery` obligatoriedad | Baja | **SHOULD** | **ME-10** | INV/PUR hooks ya lo usan; ORG mezclado |
| **GAP-07** | Impersonation + guards | Media | **MUST** (mínimo) | **IMP-01…IMP-04** (§4.8) | Flujo productivo platform→ERP; riesgo scope |
| **GAP-08** | Workflow dirty (motivo anular) | Baja | **Anexo A** | R-06 (existente) | Excluido M2-SEC; SEC-10 MAY en §7.3 |
| **GAP-09** | PUR/SLS/FIN sin plantilla propia | N/A | **No GAP** | — | Cubierto por §2 A/B |
| **GAP-10** | Legacy admin (`MenuManagementPage`) | Baja | **SHOULD** | **AP-12** | Ruta huérfana; no patrón nuevo |
| **GAP-11** | FormSection / DialogBody cosmético | Opcional | **Anexo A** | M3-R01 | Sin impacto funcional |
| **GAP-12** | Tests unitarios form-dirty | Calidad | **Anexo A** | R-10 | Calidad, no operación |

### 2.2 Resumen cuantitativo

| Destino | Cantidad |
|---------|----------|
| MUST (nuevas reglas cuerpo V2) | **9** (AUTH×5 + IMP×4) |
| SHOULD (cuerpo V2) | **11** (PL×4 + PR×3 + ME-10 + AP-12 + existentes SR-03/PB-06) |
| Solo Anexo A | **4** (GAP-08, 11, 12 + ES-B) |
| Cerrado / no acción | **1** (GAP-09) |

---

## 3. Reglas normativas nuevas a incorporar en V2 (pre-redacción)

### 3.1 §4.8 — Flujos Auth y sesión (GAP-02 + GAP-07)

> Nuevo subcapítulo bajo §4 Multiempresa. No duplica PROMPT; define MUST transversales.

| ID | Nivel | Regla |
|----|-------|-------|
| **AUTH-01** | MUST | Si `requiereSeleccionEmpresa`, redirect a selección; MUST NOT queries company-scoped |
| **AUTH-02** | MUST | Post-login / post-selección: resolver destino vía menú JWT (`resolvePostLoginFromMenu` / equivalente), no hardcode módulo |
| **AUTH-03** | MUST | Onboarding primera empresa (`?onboarding=true`): B.1.1 en modal create; flujo T, no company-scoped hasta empresa creada |
| **AUTH-04** | MUST | `SeleccionarEmpresaPage`: elección persiste en JWT; MUST NOT operar listados company sin empresa activa |
| **AUTH-05** | SHOULD | Empty / error en selección empresa con CTA claro (logout, reintentar) |

| ID | Nivel | Regla |
|----|-------|-------|
| **IMP-01** | MUST | Impersonación activa (`is_impersonation` JWT): MUST NOT `savePlatformParentSession` bypass guards company |
| **IMP-02** | MUST | Tras impersonate con selección pendiente: mismo flujo AUTH-01 que login multiempresa |
| **IMP-03** | MUST | Salir impersonación: restaurar sesión platform parent; invalidar queries tenant/empresa |
| **IMP-04** | SHOULD | UI visible “modo soporte” sin exponer tokens ni UUID cliente |

**Referencias código (solo §9/§10, no repetir en regla):** `AuthContext`, `useImpersonation`, `SeleccionarEmpresaPage`, `OnboardingEmpresaPage`, `post-login-path.ts`.

**Doc externo sugerido:** `docs/FLUJO_AUTH_MULTIEMPRESA_FE.md` — V2 §0.3 cross-ref.

### 3.2 §9.4 — Platform / Super Admin (GAP-01)

| ID | Nivel | Regla |
|----|-------|-------|
| **PL-01** | MUST NOT | Aplicar scope company JWT (`scopeEmpresaId`) en rutas `/super-admin/*` |
| **PL-02** | MUST | Platform usa scope **tenant/cliente objetivo** vía JWT impersonation o admin platform, no `OrgCompanyRouteGuard` |
| **PL-03** | SHOULD | Modales CRUD platform: B.1.1 cuando formulario multi-campo (deuda actual: sin implementar) |
| **PL-04** | SHOULD | Reutilizar `IamSearchInput`, `IamTableEmptyState`, paginación patrón super-admin clientes |

**Estado real:** ~32 pantallas `super-admin/`; **sin** `discardPending` / `createOrgDiscardHandlers` en grep. **No elevar PL-03 a MUST** hasta sprint Platform-SEC dedicado.

### 3.3 §8.7 — Paginación (GAP-03)

| ID | Nivel | Regla |
|----|-------|-------|
| **PR-01** | SHOULD | Si OpenAPI expone `page`/`limit` (o `pagina`/`limite`): hook MUST incluir params en queryKey |
| **PR-02** | SHOULD | UI: controles paginación visibles; MUST NOT cargar todo en memoria si API pagina |
| **PR-03** | MAY | Client-side pagination solo si API no pagina y volumen documentado < umbral |

**Referencia:** `super-admin/clientes/hooks/useClientes.ts` (pagina/limite). ORG/INV listados actuales: mayoría sin paginación API → PR-01 no aplica MUST global.

### 3.4 §4.4 — Extensión scope hooks (GAP-06)

| ID | Nivel | Regla |
|----|-------|-------|
| **ME-10** | SHOULD | Hooks GET nuevos MUST usar `useTenantQuery` (tenant en queryKey) además de gate empresa cuando aplique |

### 3.5 §3.2 — Anti-patrón legacy (GAP-10)

| ID | Nivel | Regla |
|----|-------|-------|
| **AP-12** | SHOULD | Rutas admin legacy no alineadas (`/admin/menus`, `/admin/areas`): redirect documentado o 403; MUST NOT usar como plantilla |

### 3.6 Extracciones Erp* (tema especial outline)

| Concepto | Destino V2 | Nivel | Notas |
|----------|------------|-------|-------|
| **`useErpCompanyScope`** | §4.4 ME-07 + Anexo **EXT-01** | SHOULD | Generalización `useOrgSessionScope` / `useInvSessionScope`. **PUR-M0 puede copiar INV/ORG literal**; extracción no bloqueante |
| **`useErpTransactionalFormGuard`** | §7.2 SEC-01 + Anexo **EXT-02** | SHOULD antes PUR-M2 | Hoy: `useInvTransactionalFormGuard`. V2 MUST referenciar nombre **actual** + nota sucesor Erp*. **PUR-M2 SHOULD** usar guard extraído si existe; si no, copiar INV con rename module-local |

**Veredicto:** No crear MUST “solo Erp*” en V2.0; ME-07 + SEC-01 + Anexo EXT-xx suficientes.

---

## 4. GAPs que permanecen deuda / Anexo A (no norma MUST)

| ID | Permanece como | Razón |
|----|----------------|-------|
| GAP-08 | Anexo **R-06**; §7.3 **SEC-10** MAY | Alcance excluido M2-SEC; confirm one-shot |
| GAP-11 | Anexo **M3-R01** | Cosmética ORG FormSection |
| GAP-12 | Anexo **R-10** | Tests; no Gate operativo |
| GAP-05 (parte) | Anexo **ES-B** | Migrar empty B-L a IAM — backlog UX |

---

## 5. Validación árbol de clasificación §2 — módulos futuros

### 5.1 Cobertura PUR · SLS · FIN · LOG

| Módulo | Pantallas previstas (catálogo producto) | Plantilla §2 | Referencia bootstrap §9 |
|--------|----------------------------------------|--------------|-------------------------|
| **PUR** | Proveedores, contactos, productos/proveedor | **A** | ORG `DepartamentosPage` / INV `UnidadesMedidaPage` |
| **PUR** | Solicitudes, cotizaciones (estados) | **B-L** | INV `MovimientosPage` |
| **PUR** | OC, recepciones (líneas) | **B-F** | INV `MovimientoFormPage` |
| **SLS** | Clientes, contactos, direcciones | **A** | Idem PUR catálogos |
| **SLS** | Cotizaciones, pedidos | **B-F** / **B-L** | INV movimientos / OC pattern |
| **FIN** | Plan de cuentas, periodos | **A** | ORG centros costo |
| **FIN** | Asientos contables | **B-F** | INV `MovimientoFormPage` (líneas debe/haber) |
| **LOG** | Transportistas, vehículos, rutas | **A** | INV almacenes |
| **LOG** | Guías remisión, despachos | **B-L** + **B-F** | INV IF / movimientos |

**Vacío para PUR/SLS/FIN/LOG:** **Ninguno normativo.** Todos mapean a A / B-L / B-F / B-R existentes.

### 5.2 Extensiones al árbol §2 (incorporar en redacción V2)

Escenarios ERP **fuera** de los cuatro módulos objetivo pero previstos en catálogo producto:

| Escenario | Plantilla | Acción outline |
|-----------|-----------|----------------|
| **H** Parámetros GLOBAL/OVERRIDE | **H** | Ya en §2 — OK |
| **T** Admin empresas tenant | **T** | Ya en §2 — OK |
| **Admin** IAM usuarios/roles | **Admin** (§9.1) | OK — no confundir con A |
| **Platform** super-admin | **Platform** (§9.4) | Añadir nodo explícito en §2.1: “¿Ruta `/super-admin`? → Platform” |
| **PRC** listas precio (líneas) | **B-F** o **A+** | Árbol: si líneas embebidas POST → B-F |
| **INV_BILL** comprobantes | **B-L** + workflow | Árbol: documento fiscal + estados; no nueva plantilla |
| **CRM** pipeline | **B-L** | Kanban/lista con estados |
| **POS** terminal | **Fuera V2.0** | UI especial; §0.2 “qué no cubre” |
| **Reportes / dashboards** | **B-R** | Extender §6.4 B-R a reportes exportables |

**Regla propuesta:** **CL-06** — MUST NOT crear plantilla ad hoc por código módulo; MUST mapear a A/A+/B-L/B-F/B-R/T/H/Admin/Platform.

### 5.3 Veredicto árbol §2

| Criterio | Estado |
|----------|--------|
| PUR/SLS/FIN/LOG | ✅ Cubierto |
| INV + ORG actuales | ✅ Cubierto |
| Platform | ⚠ Añadir nodo **Platform** en §2.1 (no GAP bloqueante) |
| Auth pre-app | ⚠ Cubierto por §4.8 AUTH-xx, no por árbol plantilla |
| POS / BI avanzado | ✅ Excluido explícito §0.2 |

---

## 6. Validación §9 Referencias módulo + §10 Mapa componentes

### 6.1 ¿Suficiente para bootstrap PUR sin auditoría arquitectónica adicional?

| Capa bootstrap | §9 + §10 | ¿Suficiente? |
|----------------|----------|--------------|
| Elegir Plantilla A vs B | §2 + §9.5 | ✅ |
| Copiar archivo patrón | §9.1–9.3 tablas | ✅ |
| Importar componentes | §10 | ✅ |
| Multiempresa hooks/guards | §4 + §10 + INV/ORG refs | ✅ |
| B.1.1 modal | §7.1 + §10 | ✅ |
| B.1.1 B-F | §7.2 + §9.3 | ✅ |
| Contrato API deprecated | — | ❌ **Requiere PROMPT Fase 0** (OpenAPI) |
| Clasificación archivos existentes PUR | — | ❌ **Requiere auditoría módulo** (`AUDITORIA_FRONTEND_PUR.md`) |
| Platform / Auth | §4.8 + §9.4 | ✅ mínimo |

**Veredicto:** §9 + §10 **eliminan auditoría arquitectónica de patrones** (no hace falta nuevo doc tipo `ERP_MODULE_PATTERN_AUDIT` por módulo). **No eliminan** auditoría **contrato + inventario código** por módulo (PROMPT Fase 0–1).

### 6.2 Gaps menores en §9 / §10 (incorporar al redactar V2)

| ID | Gap | Acción |
|----|-----|--------|
| **REF-01** | §10 sin `useInvSessionScope` / `useOrgSessionScope` | Añadir fila hooks scope §10 |
| **REF-02** | §9 sin fila **PUR** (código parcial existente) | §9.6 “Módulos en migración” — PUR hooks usan `useTenantQuery`; company scope pendiente M0 |
| **REF-03** | §9 sin **PRC** / **LOG** parcial | Referencia INV+ORG suficiente; una línea “módulos con código legacy pre-M0” |
| **REF-04** | Auth pages no en §9 | §4.8 pointer basta |

---

## 7. Revisión temas especiales

### 7.1 Platform / Super Admin (§9.4)

| Aspecto | Estado código | Norma V2 recomendada |
|---------|---------------|---------------------|
| Scope | JWT platform / impersonation | PL-01, PL-02 MUST |
| B.1.1 modales | No implementado | PL-03 SHOULD → Anexo Platform-SEC |
| Tabla/lista | Mezcla patrones | PL-04 SHOULD |
| Cierre formal | No equivalente IAM/ORG/INV | **No declarar Platform “cerrado”** en V2 |

### 7.2 Auth / Selección / Onboarding

| Flujo | Página | Norma |
|-------|--------|-------|
| Login multiempresa | `SeleccionarEmpresaPage` | AUTH-01, AUTH-04 |
| Sin empresas | Onboarding | AUTH-03 |
| Post-login path | `post-login-path.ts` | AUTH-02 |
| Header empresa | `EmpresaSelector` | ME-01–ME-03 |

**Vacío restante:** wizard post-onboarding (ORG-07) — **Anexo ORG DT**, no MUST V2.

### 7.3 Paginación server-side

- **Normativo:** PR-01…PR-03 SHOULD suficiente.
- **No MUST global:** ORG/INV APIs listas mayormente sin paginación.
- **PUR/SLS:** validar por endpoint en Fase 0; aplicar PR-01 cuando API lo exponga.

### 7.4 Impersonation

- Cuatro reglas IMP-xx MUST mínimas evitan mezclar scope platform/company.
- Complementa ME-04 (guards) sin duplicar flujo JWT completo.

### 7.5 useErpCompanyScope / useErpTransactionalFormGuard

| Utilidad | En V2.0 | PUR |
|----------|---------|-----|
| `useErpCompanyScope` | ME-07 SHOULD + EXT-01 Anexo | M0: copiar `useInvSessionScope` pattern |
| `useErpTransactionalFormGuard` | SEC-01 referencia `useInvTransactionalFormGuard` + EXT-02 | M2: copiar o usar extracto si existe |

**No bloquea PUR-M0.**

---

## 8. Matriz de redundancia interna V2 (validación final)

Tras incorporar §3, verificar en redacción:

| Riesgo duplicación | Mitigación |
|--------------------|------------|
| AUTH + ME overlap | AUTH = flujos página; ME = operación company-scoped |
| IMP + AUTH overlap | IMP solo impersonation; AUTH selección normal |
| PL + ME | PL MUST NOT company scope en super-admin |
| PR + SR | PR paginación; SR búsqueda — capítulos distintos |
| SEC + B11 | §7 unificado — sin cambio |
| §9 + §4.8 Auth | §9 no repite AUTH; solo pointer |

**Veredicto:** Sin redundancia interna nueva si §4.8 es el único hogar AUTH/IMP.

---

## 9. Checklist pre-redacción V2 (acciones al escribir documento)

- [ ] Añadir §4.8 AUTH-xx + IMP-xx
- [ ] Añadir §8.7 PR-xx
- [ ] Añadir ME-10, AP-12, CL-06
- [ ] Expandir §9.4 PL-xx; §9.6 módulos en migración (PUR)
- [ ] Expandir §10 hooks scope
- [ ] Añadir nodo **Platform** en §2.1
- [ ] §0.2 excluir POS / BI dedicado
- [ ] §0.3 cross-ref `docs/FLUJO_AUTH_MULTIEMPRESA_FE.md`
- [ ] Anexo A: GAP-08, 11, 12, ES-B, EXT-01, EXT-02
- [ ] No elevar PL-03 ni EXT-02 a MUST

---

## 10. Veredicto final

| Pregunta | Respuesta |
|----------|-----------|
| ¿12 GAP revisados? | ✅ Disposición en §2 |
| ¿Cuáles norma V2? | **9 MUST** (AUTH+IMP) + **11 SHOULD** (PL, PR, ME-10, AP-12, etc.) |
| ¿Cuáles deuda? | **4** en Anexo A |
| ¿Vacío PUR/SLS/FIN/LOG? | **Ninguno** |
| ¿§2 suficiente? | **Sí** + nodo Platform + CL-06 |
| ¿§9+§10 bootstrap? | **Sí patrones**; Fase 0 OpenAPI sigue obligatoria |
| ¿Listo redactar V2? | **✅ Sí** |

---

*Auditoría final GAPs V2. Sin redacción STANDARDS_V2. Sin cambios .cursorrules / PROMPT. Sin commit.*
