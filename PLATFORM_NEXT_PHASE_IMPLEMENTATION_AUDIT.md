# PLATFORM_NEXT_PHASE_IMPLEMENTATION_AUDIT.md

**Tema:** Viabilidad de implementación — fase operativa Platform (post-cierre Clientes/Catálogos)  
**Fecha:** 2026-06-02  
**Tipo:** Auditoría de viabilidad — **sin implementación, sin repair, sin commit**  
**Entrada:** `PLATFORM_FINAL_SURFACE_AUDIT.md` (PLAT-SURF-001, 002, 003/004/005)  
**Alcance excluido por decisión de producto:** convergencia visual (toolbars IAM, skeletons, empty states) — **no evaluado aquí**

**Premisa:** Backend en repositorio separado. Conclusiones basadas en código FE + `src/reference_backend/*` (documentación de referencia, no garantía de despliegue).

---

## 1. Resumen ejecutivo

| Hallazgo | ¿Implementable FE solo? | ¿Depende BE? | Viabilidad | Esfuerzo estimado |
|----------|-------------------------|--------------|------------|-------------------|
| **PLAT-SURF-001** Auditoría Global | **Parcial → Sí (MVP)** | Endpoints **documentados**; validar en entorno | **Alta** | 2–4 días (MVP auth) · +2–3 días (sync + stats) |
| **PLAT-SURF-002** Dashboard | **Parcial** | KPIs compuestos sí; alertas/actividad rica **parcial** | **Media** | 1–2 días (MVP honesto) · +3–5 días (dashboard completo) |
| **PLAT-SURF-003** ConfirmDialog Módulos | **Sí** | No (API ya usada) | **Alta** | 0.5–1 día |
| **PLAT-SURF-004** Reactivar copy Módulos | **Sí** | No | **Alta** | &lt; 2 h |
| **PLAT-SURF-005** B11 modales Módulos | **Sí** | No | **Alta** | 1.5–2.5 días |

**Orden recomendado:** **003 + 004** → **005** → **001 (MVP)** → **002 (MVP)** → ampliaciones 001/002 según BE validado.

---

## 2. PLAT-SURF-001 — Auditoría Global

### 2.1 Problema actual

- Menú activo incluye «Auditoría Global» → **`/super-admin/auditoria`**.
- `super-admin/routes.tsx` **no define** `path: 'auditoria'` → cae en `*` → redirect a dashboard.
- Existe implementación parcial: `ClientAuditTab` (detalle cliente) + `superadminAuditoriaService` (solo autenticación).

### 2.2 Contrato Backend observable (referencia)

| Endpoint (referencia) | Propósito | En servicio FE hoy |
|---------------------|-----------|-------------------|
| `GET /superadmin/auditoria/autenticacion/` | Logs auth paginados; **`cliente_id` opcional** (todos los clientes) | ✅ `getAuthLogsByCliente` |
| `GET /superadmin/auditoria/autenticacion/{log_id}/` | Detalle log | ✅ `getAuthLogDetalle` |
| `GET /superadmin/auditoria/sincronizacion/` | Logs sync paginados | ❌ no implementado FE |
| `GET /superadmin/auditoria/estadisticas/` | Stats agregadas auth + sync | ❌ no implementado FE |

**Nota contrato:** referencia BE usa `cliente_id: Optional[int]` en Query; FE usa **UUID string** en tipos y en `ClientAuditTab` (funciona si BE real acepta UUID — **validar en QA** antes de producción).

### 2.3 Qué puede hacer solo Frontend

| Entregable | Descripción | Reutilización |
|------------|-------------|---------------|
| **Ruta + página** | `AuditoriaGlobalPage` en `/super-admin/auditoria` | Patrón `routes.tsx` existente |
| **MVP — tab Autenticación** | Listado global sin `cliente_id` + mismos filtros que tab cliente | **Extraer** lógica de `ClientAuditTab.tsx` (~550 líneas) |
| **Filtro cliente opcional** | Combo clientes vía `useClientes` / `clienteService.getClientes` | Ya usado en Platform |
| **Detalle log** | `Dialog` ya usado en `ClientAuditTab` | Copiar tal cual |
| **Refactor DRY** | `AuthAuditLogPanel({ clienteId?: string })` compartido tab + global | Reduce duplicación |

### 2.4 Qué depende de Backend

| Necesidad | Bloqueante MVP auth | Bloqueante vista completa |
|-----------|--------------------|---------------------------|
| `GET .../autenticacion/` sin `cliente_id` | **Validar 200** en entorno | — |
| Permisos super-admin (nivel 5) | Sí (403 si no) | Igual |
| Tab **Sincronización** | No para MVP | **Sí** — extender servicio + tipos |
| **Estadísticas** header/cards | No para MVP | **Sí** — `AuditoriaEstadisticasResponse` no tipado en FE |
| Volumen / performance listados globales | No bloquea; puede requerir límites default | Operativo |

**Sin cambios BE** se puede cerrar **P0 funcional** con MVP de autenticación global, asumiendo endpoints desplegados como en referencia.

### 2.5 Componentes reutilizables

```
ClientAuditTab.tsx          →  extraer núcleo listado/detalle
superadminAuditoriaService  →  ampliar (sync, stats) sin romper API actual
getErrorMessage             →  errores (patrón post-FIX-ERR Clientes)
useDebounce                 →  filtros evento
Dialog (shadcn)             →  detalle log
useClientes                 →  filtro cliente opcional
ConfirmDialog               →  N/A en auditoría (solo lectura)
```

### 2.6 Riesgos y dependencias

| ID | Riesgo | Severidad | Mitigación |
|----|--------|-----------|------------|
| R-001-01 | BE no desplegado o ruta distinta a `/superadmin/auditoria/*` | Alta | Smoke test Network en staging; no asumir OpenAPI en repo FE |
| R-001-02 | `cliente_id` int vs UUID | Media | Probar filtro por cliente; alinear Query con BE real |
| R-001-03 | `usuario_id` filtro numérico vs UUID en tipos FE | Media | Alinear con respuesta real en QA |
| R-001-04 | Duplicar 500+ líneas si no se extrae componente | Baja | Refactor `AuthAuditLogPanel` en mismo ticket |
| R-001-05 | Menú DB apunta a URL distinta de `/super-admin/auditoria` | Media | Validar ítem menú platform vs ruta registrada |

### 2.7 Recomendación

| Fase | Alcance | BE |
|------|---------|-----|
| **P0 — MVP** | Ruta + página + logs autenticación global + filtro cliente opcional + detalle | Solo consumo endpoints existentes |
| **P1** | Tab sincronización + tipos + servicio | Consumo `.../sincronizacion/` |
| **P2** | Cards stats período (`.../estadisticas/`) | Consumo stats |

**Veredicto:** **Viable FE-first** para cerrar el hueco P0 del menú. Vista «Auditoría Global completa» requiere **extensión servicio FE**, no necesariamente cambios BE.

---

## 3. PLAT-SURF-002 — Dashboard

### 3.1 Problema actual

`SuperAdminDashboard.tsx` usa **datos estáticos** (`totalClientes: 5`, actividad y alertas ficticias). No hay llamadas API.

### 3.2 Contrato Backend observable

| Dato UI actual | Endpoint dedicado Platform dashboard | Alternativa FE (APIs existentes) |
|----------------|--------------------------------------|----------------------------------|
| Total clientes / activos | ❌ no encontrado en referencia | `GET /clientes/` → `total_clientes` + filtro `solo_activos` |
| Total usuarios / activos | ❌ no dashboard | `GET /superadmin/usuarios/` (referencia BE) — **FE service incompleto** |
| Total módulos / activos | ❌ | `moduloV2Service.getModulos` → `total` + filtro `es_activo` |
| Conexiones activas | ❌ global | ❌ no hay agregado global evidente; solo por cliente |
| Actividad reciente | ❌ | `GET /superadmin/auditoria/autenticacion/?limit=5` (sin cliente_id) |
| Alertas (licencia, errores conexión) | ❌ | Requiere reglas de negocio agregadas o **nuevo endpoint** |

### 3.3 Qué puede hacer solo Frontend

| Entregable | Viabilidad | Notas |
|------------|------------|-------|
| **Eliminar datos falsos** | Obligatorio | Empty/loading por card |
| **KPI Clientes** | ✅ | 1–2 llamadas `clienteService.getClientes` |
| **KPI Módulos** | ✅ | `moduloV2Service.getModulos({ limit: 1, es_activo })` × 2 |
| **KPI Usuarios** | ⚠️ | Añadir `getUsuariosGlobales` a `superadmin-usuario.service.ts` (BE referenciado, **no expuesto en FE**) |
| **Actividad reciente (auth)** | ✅ | Reutilizar auditoría service; enlaces a Auditoría Global |
| **Stats auditoría (cards)** | ⚠️ | Nuevo método `getEstadisticas()` en auditoría service |
| **Alertas licencia / conexión** | ❌ FE solo | Necesita BE o scan manual de lista clientes (frágil, N+1) |

### 3.4 Qué depende de Backend

| Capacidad | MVP dashboard | Dashboard «como diseño actual» |
|-----------|---------------|--------------------------------|
| Listados paginados clientes/módulos | ✅ | ✅ |
| Listado global usuarios | ⚠️ validar despliegue | ✅ |
| Logs auth recientes | ⚠️ validar | ✅ |
| Stats auditoría agregadas | Opcional MVP | ✅ |
| **Alertas operativas** (licencia, conexión módulo) | ❌ | **Requiere BE** o scope reducido |
| **Conexiones activas** contador global | ❌ | **Requiere BE** o heurística costosa |

### 3.5 Componentes reutilizables

| Componente / hook | Uso en dashboard |
|-------------------|------------------|
| `useClientes` / `clienteService` | KPI clientes |
| `moduloV2Service` | KPI módulos |
| `superadminAuditoriaService` | Actividad + stats |
| `superadminUsuarioService` (+ método nuevo) | KPI usuarios |
| Layout cards actual | Mantener estructura visual; cambiar fuente de datos |
| `getErrorMessage` + estados error por card | Resiliencia parcial (una card falla, otras OK) |

### 3.6 Riesgos y dependencias

| ID | Riesgo | Severidad | Mitigación |
|----|--------|-----------|------------|
| R-002-01 | Paridad con mock actual imposible sin BE | Alta | Redefinir MVP: KPIs reales + actividad auth; quitar alertas ficticias |
| R-002-02 | Múltiples requests al cargar (4–6) | Media | `Promise.allSettled`; loading por card |
| R-002-03 | `modulo-v2.service` aún propaga errores con wrap parcial | Baja | Alinear a FIX-ERR patrón Clientes en ticket aparte |
| R-002-04 | Usuarios globales no en FE service | Media | Añadir wrapper en mismo ticket dashboard |
| R-002-05 | Dependencia de PLAT-SURF-001 para link «Ver todo» actividad | Baja | Implementar 001 MVP antes o link temporal a tab cliente |

### 3.7 Recomendación

| Fase | Alcance | Tipo |
|------|---------|------|
| **MVP (FE)** | KPIs Clientes + Módulos + (Usuarios si API OK) + últimos 5 logs auth; **sin alertas inventadas** | FE + consumo BE existente |
| **MVP+** | Stats `/estadisticas/` en cards secundarias | FE extiende auditoría service |
| **Completo** | Alertas licencia/conexión, conexiones activas, feed unificado | **Ticket BE** `/superadmin/dashboard/resumen` recomendado |

**Veredicto:** **Viable parcialmente en FE** para dejar de mentir al usuario. **No** replicar fielmente el dashboard mock sin backend adicional.

---

## 4. PLAT-SURF-003 / 004 / 005 — Módulos

### 4.1 PLAT-SURF-003 — ConfirmDialog activar/desactivar

**Estado:** `handleToggleActivation` llama `activateModulo` / `deactivateModulo` **sin confirmación**.

| Aspecto | Detalle |
|---------|---------|
| **FE only** | ✅ 100% |
| **BE** | Endpoints ya integrados: `PATCH /modulos-v2/{id}/activar|desactivar/` |
| **Patrón** | Copiar `ClientManagementPage`: `activeTarget`, `activeAction`, `ConfirmDialog`, `loading` |
| **Archivos** | `ModuleManagementPage.tsx` (+ opcional tipos locales) |
| **Coexistencia** | Si luego hay B11 (005), guard `discardPending === null` en `isOpen` (mismo B11-02 Clientes) |

**Esfuerzo:** 0.5–1 día incl. QA tabla + vista grid.

**Riesgo:** Bajo. Misma mutación; solo UX interrumpible.

---

### 4.2 PLAT-SURF-004 — Vocabulario Reactivar

**Estado:** tooltips/toasts usan **«Activar»**; V2 UX-01 pide **«Reactivar»** para baja lógica.

| Aspecto | Detalle |
|---------|---------|
| **FE only** | ✅ strings en `ModuleManagementPage` (+ toasts en `handleToggleActivation`) |
| **BE** | Sin cambio |
| **Alcance** | Título ConfirmDialog (003), `title` botón, `confirmText`, toasts éxito |
| **Dependencia** | Ideal **junto con 003** en un solo PR |

**Esfuerzo:** &lt; 2 horas.

**Riesgo:** Ninguno funcional.

---

### 4.3 PLAT-SURF-005 — B.1.1 modales Create/Edit

**Estado:** `CreateModuleModal` (~347 LOC) y `EditModuleModal` (~345 LOC) — cierre directo sin dirty guard.

| Aspecto | Detalle |
|---------|---------|
| **FE only** | ✅ |
| **BE** | Sin cambio |
| **Complejidad vs Clientes** | **Menor** — formulario single-panel (no tabs); dirty más simple |
| **Reutilización directa** | `OrgDiscardConfirmDialog`, `OrgDiscardPending`, patrón `useClienteModalDiscard` |
| **Implementación sugerida** | 1) `modulo-form-dirty.ts` (defaults + `isCreateDirty` / `isEditDirty`) 2) `useModuloModalDiscard.ts` (copia adaptada de `useClienteModalDiscard`) 3) Integrar en ambos modales 4) `ModuleManagementPage`: `moduloDiscardPending` + `pageActionsLocked` (patrón Clientes P1-01) |
| **ER-02** | Opcional mismo ticket: quitar doble toast create (modal + `handleCreateSuccess`) — alineación Clientes FIX-ERR-02 |

**No reutilizar literalmente** `cliente-form-dirty.ts` (dominio distinto); **sí** el hook/patrón ORG.

**Esfuerzo:** 1.5–2.5 días (2 modales + página + QA M-01..M-05 adaptados de B11).

**Riesgos:**

| ID | Riesgo | Mitigación |
|----|--------|------------|
| R-005-01 | `IconSelector` / campos generan falso dirty | Snapshot normalizado como Clientes |
| R-005-02 | Export/menu en toolbar durante discard | `pageActionsLocked` en página |
| R-005-03 | Checkbox `es_activo` en create modal | Fuera 005; backlog UX-03 aparte |

---

### 4.4 Matriz consolidada Módulos (003/004/005)

| ID | Implementable FE | BE | Reutilización clave | Esfuerzo | Riesgo |
|----|------------------|-----|---------------------|----------|--------|
| 003 | ✅ | No | `ConfirmDialog`, patrón Clientes/Catálogos | 0.5–1 d | Bajo |
| 004 | ✅ | No | Copy V2 UX-01 | &lt; 2 h | Nulo |
| 005 | ✅ | No | `OrgDiscardConfirmDialog`, hook discard Clientes | 1.5–2.5 d | Bajo–medio |

**Recomendación:** Ticket único **「Platform Módulos — confirm + B11」**: 003+004+005 en un release; 003/004 primero para valor inmediato.

---

## 5. Matriz de viabilidad consolidada (todas las fases)

| ID | Hallazgo | FE solo | BE requerido | Reutilización principal | Esfuerzo | Riesgo global | Prioridad sugerida |
|----|----------|---------|--------------|-------------------------|----------|---------------|-------------------|
| **001** | Auditoría Global | MVP auth: **Sí** · Completa: **Parcial** | Validar endpoints; sync/stats consumo | `ClientAuditTab`, `superadminAuditoriaService` | 2–4 d (MVP) | Medio (contrato IDs) | **1** (P0 menú roto) |
| **002** | Dashboard | **Parcial** (KPIs + actividad) | Alertas/conexiones globales; opcional dashboard API | `useClientes`, `moduloV2Service`, auditoría | 1–2 d (MVP) | Medio (expectativas vs mock) | **3** (tras 001 MVP para links) |
| **003** | ConfirmDialog Módulos | **Sí** | No | `ClientManagementPage` / Catálogos | 0.5–1 d | Bajo | **2** (rápido) |
| **004** | Reactivar Módulos | **Sí** | No | V2 UX-01 | &lt; 2 h | Nulo | **2** (con 003) |
| **005** | B11 Módulos | **Sí** | No | P1-01 Clientes, `OrgDiscardConfirmDialog` | 1.5–2.5 d | Bajo–medio | **2** (tras 003) |

---

## 6. Plan de fases propuesto (sin convergencia visual)

```
Fase A (1–2 d)     PLAT-SURF-003 + 004          Módulos confirm + Reactivar
Fase B (2–3 d)     PLAT-SURF-005                  Módulos B11 + pageActionsLocked
Fase C (2–4 d)     PLAT-SURF-001 MVP             Auditoría Global (auth) + ruta
Fase D (1–2 d)     PLAT-SURF-002 MVP             Dashboard KPIs reales + actividad auth
Fase E (opcional)  001 P1/P2 + 002 completo      Sync tab, stats, alertas (BE si aplica)
```

**Dependencias cruzadas:**

- **002** actividad reciente → mejor con **001** ruta destino.
- **005** no bloquea **003**; conviene **003 antes** para no re-trabajar handlers toggle.
- **Clientes/Catálogos cerrados** — no reabrir; Módulos converge hacia mismo patrón confirm/B11.

---

## 7. Validaciones previas obligatorias (QA staging)

Antes de estimar cierre definitivo, ejecutar en entorno con super-admin real:

| # | Prueba | Afecta |
|---|--------|--------|
| V-01 | `GET /superadmin/auditoria/autenticacion/` sin `cliente_id` → 200 + paginación | 001, 002 |
| V-02 | Filtro `cliente_id` UUID en auditoría | 001 |
| V-03 | `GET /superadmin/usuarios/?limit=1` → total usuarios | 002 |
| V-04 | `PATCH /modulos-v2/{id}/desactivar/` + reactivar | 003 |
| V-05 | Ítem menú Auditoría → URL exacta vs ruta FE | 001 |

---

## 8. Conclusión

| Área | ¿Abrir ticket FE? | Condición |
|------|-------------------|-----------|
| **Módulos 003/004/005** | **Sí, ya** | 100% FE; alto retorno / bajo riesgo |
| **Auditoría 001** | **Sí, MVP** | Cierra P0 menú; validar BE en staging |
| **Dashboard 002** | **Sí, MVP acotado** | No prometer alertas/conexiones sin BE; eliminar mock |

**No se requiere** convergencia visual (IAM toolbar, skeletons, empty) para abordar estos hallazgos.

---

## 9. Referencias

| Documento / código | Uso |
|--------------------|-----|
| `PLATFORM_FINAL_SURFACE_AUDIT.md` | Origen hallazgos |
| `src/features/super-admin/clientes/components/ClientAuditTab.tsx` | Plantilla auditoría |
| `src/services/superadmin-auditoria.service.ts` | Servicio a extender |
| `src/reference_backend/endpoints.md` | Contratos superadmin auditoría/usuarios |
| `src/features/super-admin/clientes/pages/ClientManagementPage.tsx` | Plantilla ConfirmDialog |
| `src/features/super-admin/clientes/hooks/useClienteModalDiscard.ts` | Plantilla B11 |
| `PLATFORM_CLIENTES_B11_CLOSURE_AUDIT.md` | Matriz QA B11 adaptable a Módulos |

---

*Fin — PLATFORM_NEXT_PHASE_IMPLEMENTATION_AUDIT.md*
