# PLATFORM_NEXT_PRIORITY_RECOMMENDATION.md

**Fecha:** 2026-06-02  
**Tipo:** Recomendación priorizada — **sin código, sin commits, sin implementación**  
**Referencias:** `PLATFORM_FINAL_SURFACE_AUDIT.md`, `PLATFORM_NEXT_PHASE_IMPLEMENTATION_AUDIT.md`  
**Revalidación:** estado actual del repositorio Frontend (post-cierre Módulos PLAT-SURF-003/004/005 y MODAL-UX-011)

---

## 1. Resumen ejecutivo

| Recomendación | **Siguiente bloque: Auditoría Global (PLAT-SURF-001) — MVP autenticación + ruta** |
|---------------|-------------------------------------------------------------------------------------|

**Motivo principal:** es la única superficie activa del menú Platform que **no existe como pantalla**; la deuda es **P0 funcional** (navegación rota). El Dashboard **sí existe** pero presenta deuda **P1 de veracidad de datos** (mock estático), no ausencia de funcionalidad.

---

## 2. Revalidación de estado actual

### 2.1 `/super-admin/auditoria` — Auditoría Global

| Aspecto | Estado actual (código FE) | Evidencia |
|---------|---------------------------|-----------|
| Ruta registrada | **No** | `src/features/super-admin/routes.tsx` no define `path: 'auditoria'`; `*` redirige a `/super-admin/dashboard` |
| Página dedicada | **No** | No existe `AuditoriaGlobalPage` ni equivalente en `super-admin/` |
| Ítem en menú activo | **Sí** (declarado) | `PLATFORM_ACTIVE_SURFACE_AUDIT.md`, `PLATFORM_FINAL_SURFACE_AUDIT.md` — «Auditoría Global» en menú Platform |
| Comportamiento al navegar | **Redirect silencioso al dashboard** | Misma causa que PLAT-SURF-001 |
| Servicio FE | **Parcial** | `src/services/superadmin-auditoria.service.ts` — solo `GET .../autenticacion/` y detalle |
| UI reutilizable | **Parcial** | `ClientAuditTab.tsx` (~550 LOC) en detalle cliente; requiere `clienteId` obligatorio hoy |
| Endpoints BE (referencia) | **Documentados** | `src/reference_backend/endpoints.md` — autenticación, sincronización, estadísticas bajo `/superadmin/auditoria/*` |
| Tabs sync / stats en FE | **No** | No hay métodos en servicio ni tipos para sincronización/estadísticas globales |

**Clasificación de deuda:** **funcional rota (P0)** — la capacidad anunciada en menú no está entregada.

---

### 2.2 `/super-admin/dashboard` — Dashboard Platform

| Aspecto | Estado actual (código FE) | Evidencia |
|---------|---------------------------|-----------|
| Ruta registrada | **Sí** | `path: 'dashboard'` en `routes.tsx` |
| Página | **Sí** | `SuperAdminDashboard.tsx` |
| Rol en shell | **Landing** | `index` → redirect `dashboard`; `post-login-path`, `ProtectedRoute`, wildcard `*` → dashboard |
| Datos mostrados | **100 % estáticos / ficticios** | Objeto `stats` hardcodeado (`totalClientes: 5`, etc.); arrays `actividadReciente` y `alertas` inventados; comentario «Datos de ejemplo» |
| Llamadas API | **Ninguna** | Sin `useEffect` fetch, sin React Query, sin servicios |
| Acciones rápidas | **Solo UI** | Botones sin navegación programática observable |
| Guard super-admin | **Sí** | Mensaje si `!isSuperAdmin` |

**Clasificación de deuda:** **P1 veracidad / expectativa** — la pantalla **carga**, pero **no informa el estado real** del sistema. No es un hueco de ruta.

---

## 3. Comparativa: ¿cuál tiene mayor deuda funcional real?

| Criterio | Auditoría Global | Dashboard |
|----------|------------------|-----------|
| Severidad histórica (auditorías) | **P0** (PLAT-SURF-001) | **P1** (PLAT-SURF-002) |
| ¿Existe la superficie? | **No** | **Sí** |
| ¿El menú miente al usuario? | **Sí** (lleva a otra pantalla) | **Parcial** (muestra KPIs falsos en destino por defecto) |
| ¿Bloquea una tarea operativa? | **Sí** — consulta global de logs auth imposible desde menú | **No** — operador puede ir a Clientes/Catálogos/Módulos |
| ¿BE listo para MVP FE? | **Parcial** — auth global consumible si endpoint validado en staging | **Parcial** — KPIs vía APIs existentes (clientes, módulos); alertas/conexiones globales **no** sin BE adicional |
| Esfuerzo MVP FE estimado | 2–4 días (ruta + extraer `ClientAuditTab`) | 1–2 días (KPIs reales + quitar mock) |
| Riesgo de confianza operativa | Alto (función ausente) | Alto (datos ficticios en home) |

**Veredicto comparativo:** **Auditoría Global concentra mayor deuda funcional real** porque combina **ausencia de implementación** + **ítem de menú activo** + **redirect engañoso**. El Dashboard tiene deuda seria de **calidad de información**, pero no de **existencia**.

---

## 4. Contexto Platform post-trabajo reciente (no reabrir)

Cerrado o alineado desde las auditorías de referencia:

| Área | Estado |
|------|--------|
| Clientes (listado + modales B11 + ConfirmDialog) | Referencia madura — **no reabrir** en esta prioridad |
| Catálogos ×5 (Desactivar/Reactivar + ConfirmDialog) | Operativos — deuda P2 (B11, UX-03/04) **fuera** de este bloque |
| Módulos PLAT-SURF-003/004/005 | **Cerrado** (`ConfirmDialog`, vocabulario Reactivar, B11) |
| Módulos MODAL-UX-011 | **Cerrado** (footer fijo Create/Edit) |

Quedan en superficie activa del menú, sin cerrar en este ciclo:

1. **Auditoría Global** — P0  
2. **Dashboard** — P1  
3. Mejoras transversales P2 (skeletons, IAM toolbar, etc.) — explícitamente fuera del foco de `PLATFORM_NEXT_PHASE_IMPLEMENTATION_AUDIT.md`

---

## 5. Recomendación priorizada (única)

### Bloque recomendado: **PLAT-SURF-001 — Auditoría Global MVP**

**Alcance sugerido del bloque (solo planificación; no implementar aquí):**

| Fase | Entregable | Dependencia BE |
|------|------------|----------------|
| **MVP (obligatorio)** | Ruta `auditoria` + `AuditoriaGlobalPage` + listado logs autenticación **sin** `cliente_id` obligatorio + filtros alineados a `ClientAuditTab` + detalle en `Dialog` + filtro cliente opcional (`useClientes`) | Validar `GET /superadmin/auditoria/autenticacion/` sin `cliente_id` (QA staging V-01/V-02) |
| **Refactor DRY** | Extraer `AuthAuditLogPanel({ clienteId?: string })` compartido tab cliente + global | No |
| **Post-MVP (siguiente iteración)** | Tab sincronización + `getEstadisticas()` | Consumo endpoints ya referenciados en BE |

**Por qué antes que Dashboard:**

1. Cierra el **único P0** restante en menú activo Platform.  
2. Restaura **navegación honesta** (URL ↔ menú ↔ pantalla).  
3. Aprovecha **~80 % del trabajo UI** ya escrito en `ClientAuditTab` y servicio auth existente.  
4. Habilita después un Dashboard MVP **honesto** que enlace actividad reciente a `/super-admin/auditoria` (dependencia cruzada documentada en PLAT-SURF-002 / Fase D del plan de fases).  
5. Alinea con el orden ya propuesto en `PLATFORM_NEXT_PHASE_IMPLEMENTATION_AUDIT.md` (Fase C antes que Fase D).

**Qué NO incluir en el mismo bloque (evitar scope creep):**

- Dashboard KPIs (bloque separado PLAT-SURF-002).  
- Tabs sincronización/estadísticas (P1 de 001).  
- Convergencia visual IAM / skeletons (P2).  
- Catálogos B11 o UX-03/04.  
- Clientes (explícitamente excluido por producto).

---

### Bloque secundario (inmediatamente después): **PLAT-SURF-002 — Dashboard MVP honesto**

| Entregable MVP | Notas |
|----------------|-------|
| Eliminar números y listas ficticias | Obligatorio ético/UX |
| KPIs Clientes + Módulos vía APIs existentes | FE-only viable |
| KPI Usuarios | Validar V-03 staging |
| Actividad reciente | Últimos logs auth vía `superadminAuditoriaService` → enlace a Auditoría Global |
| **No** prometer alertas licencia / conexiones globales | Requiere BE o scope reducido |
| Acciones rápidas | Deben navegar (`Link`/`navigate`) o retirarse |

**Razón de segundo lugar:** reduce daño de confianza en la **home**, pero no repara un **enlace de menú roto** ni entrega una capacidad nueva ausente.

---

## 6. Validaciones previas obligatorias (antes de estimar cierre)

Reutilizar matriz de `PLATFORM_NEXT_PHASE_IMPLEMENTATION_AUDIT.md` §7:

| # | Prueba | Bloque |
|---|--------|--------|
| V-01 | `GET /superadmin/auditoria/autenticacion/` sin `cliente_id` → 200 | 001, 002 |
| V-02 | Filtro `cliente_id` UUID | 001 |
| V-03 | `GET /superadmin/usuarios/` (total) | 002 |
| V-05 | URL menú «Auditoría Global» = `/super-admin/auditoria` | 001 |

---

## 7. Alternativa descartada como prioridad #1

**Dashboard primero** sería razonable solo si el criterio fuera «impacto visual en landing» exclusivamente. Bajo el criterio **deuda funcional real** (capacidad prometida vs entregada), **no supera** Auditoría Global:

- El Dashboard **no está roto** como ruta.  
- Su remedio MVP **no desbloquea** el ítem de menú Auditoría.  
- Seguiría existiendo P0 en paralelo tras publicar KPIs reales.

**Opción de mitigación mínima si se necesita alivio temporal en Dashboard sin bloque completo:** banner «Datos de demostración» + deshabilitar cifras — **no sustituye** PLAT-SURF-001 como prioridad estructural.

---

## 8. Conclusión en una frase

**Implementar primero Auditoría Global MVP (PLAT-SURF-001)** porque es la brecha **P0** de superficie inexistente con menú activo; el Dashboard (PLAT-SURF-002) debe ser el **segundo bloque** para sustituir datos ficticios en la landing, idealmente apoyándose en la ruta de auditoría ya creada.

---

*Fin — PLATFORM_NEXT_PRIORITY_RECOMMENDATION.md*
