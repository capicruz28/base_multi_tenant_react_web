# PLATFORM_CLIENTES_FE_ONLY_FEASIBILITY_AUDIT.md

**Tema:** Viabilidad 100% Frontend — UX-PLAT-C01, C03, C04 (Gestión de Clientes)  
**Fecha:** 2026-06-02  
**Tipo:** Auditoría de factibilidad — **sin código, sin repair, sin commit**  
**Referencias:**

- `PLATFORM_CLIENTES_P0_P1_REMEDIATION_PLAN.md`
- `PLATFORM_UX_CONSISTENCY_AUDIT.md`
- Evidencia en repo: tipos TS, servicio, página, hooks, `docs/backend_openapi.json`

**Restricciones de este informe:**

- No se infiere comportamiento interno del Backend más allá de lo **documentado en `docs/backend_openapi.json`** (copia en este repo).
- No se asumen endpoints ni params no presentes en ese OpenAPI.
- No se propone implementación; solo factibilidad.

---

## 1. Resumen ejecutivo

| ID | ¿100% FE? | Veredicto breve |
|----|-----------|-----------------|
| **UX-PLAT-C04** | **Sí** | Ajuste de copy en `useClienteMutations.ts` (2 strings). UI listado ya alineada. |
| **UX-PLAT-C03** | **Sí** | `refetch()` explícito + ajustes React Query; sin dependencia BE. |
| **UX-PLAT-C01 — Activos** | **Sí*** | Corregir mapeo a `solo_activos=true` (*param documentado en OpenAPI). |
| **UX-PLAT-C01 — Todos** | **Parcial** | FE puede enviar `solo_activos=false`; **semántica de `false` no descrita** en OpenAPI → validación BE. |
| **UX-PLAT-C01 — Inactivos** | **Parcial** | FE puede filtrar por `Cliente.es_activo` en datos recibidos; **paginación server-side correcta requiere BE**. |

**Conclusión:** C03 y C04 pueden cerrarse **sin ticket Backend**. C01 puede avanzar en FE con **solución interim** para los tres modos; la solución **completa y escalable** de «Inactivos» (y confirmación de «Todos») **requiere validación o desarrollo Backend**.

---

## 2. Evidencia observable en el repositorio Frontend

### 2.1 Contrato TypeScript — DTOs Gestión de Clientes

**Archivo:** `src/features/super-admin/clientes/types/cliente.types.ts`

| Tipo | Campo `es_activo` | Uso en listado |
|------|-------------------|----------------|
| `Cliente` | `es_activo: boolean` (L28) | ✅ Cada fila de lista |
| `ClienteListResponse` | `clientes: Cliente[]` (L111) | ✅ Payload listado |
| `ClienteFilters` | `es_activo?: boolean` (L122) | ⚠️ Estado UI filtro; **no** se envía como query `es_activo` |
| `ClienteUpdate` | `es_activo?: boolean` (L87) | Edición (fuera alcance C01 listado) |
| `ClienteCreate` | *(ausente)* | Create no expone toggle activo |

**OpenAPI en repo** — schema de ítem de lista:

- `PaginatedClienteResponse.clientes[]` → `app__modules__tenant__presentation__schemas__ClienteRead`
- `ClienteRead.es_activo`: `{ type: "boolean", default: true }` — **presente en respuesta documentada**

**Conclusión punto 1:** El contrato TS **sí contempla `es_activo`** en el DTO de fila (`Cliente`) y en filtros de UI (`ClienteFilters`). **No existe** en TS ni en OpenAPI un query param `es_activo` para el listado.

### 2.2 OpenAPI documentado — `GET /api/v1/clientes/` (copia en repo)

**Archivo:** `docs/backend_openapi.json`

| Query param | Tipo | Default | Descripción en OpenAPI |
|-------------|------|---------|------------------------|
| `skip` | integer | 0 | Paginación |
| `limit` | integer | 100 (max 1000) | Límite registros |
| `solo_activos` | boolean | **true** | «Filtrar solo clientes activos» |
| `buscar` | string \| null | — | Búsqueda texto |

**Ausente en OpenAPI:** `es_activo`, `solo_inactivos`, `plan_suscripcion`, `estado_suscripcion`.

### 2.3 Servicio FE — qué se envía hoy

**Archivo:** `src/features/super-admin/clientes/services/cliente.service.ts` (L32–40)

```typescript
if (filtros.es_activo !== undefined) {
  params.append('solo_activos', filtros.es_activo.toString());
}
// ...
} else {
  params.append('solo_activos', 'true');
}
```

| UI (`ClientManagementPage`) | `filters.es_activo` | Query enviado | Observable |
|-----------------------------|---------------------|---------------|------------|
| Activos | `true` | `solo_activos=true` | Param documentado |
| Inactivos | `false` | `solo_activos=false` | Param documentado; **no** significa «solo inactivos» en OpenAPI |
| Todos | `undefined` | *(ninguno)* | OpenAPI default `solo_activos=true` |

### 2.4 UI — consumo de `es_activo` en listado

**Archivo:** `src/features/super-admin/clientes/pages/ClientManagementPage.tsx`

| Uso | Líneas | Evidencia |
|-----|--------|-----------|
| Badge Activo/Inactivo | L369–374 | `cliente.es_activo ? 'Activo' : 'Inactivo'` |
| Acción Desactivar vs Reactivar | L402–419 | `cliente.es_activo ? Trash2 : RefreshCw` |
| Confirm dialog acción | L132–135, L504–519 | `openActiveConfirm` usa `cliente.es_activo` |
| Filtro select | L236–245 | Escribe `filters.es_activo`; **no** filtra filas en cliente |

**Conclusión punto 2:** El flujo **ya recibe y consume** `es_activo` por fila en tabla, badges y acciones. El **filtro de listado no usa** `es_activo` client-side; delega erróneamente a `solo_activos` vía servicio.

### 2.5 Precedente FE en el mismo repo (catálogos)

**Archivo:** `src/features/super-admin/catalogos/pages/PaisesPage.tsx`

- API: `solo_activos: !showInactivos` (L39)
- Filtro client-side adicional: `.filter(row => soloActivos ? row.es_activo !== false : true)` (L221–222)

Demuestra que el codebase **ya aplica** filtrado por `es_activo` en cliente sobre datos del API cuando el param server no distingue «solo inactivos».

---

## 3. UX-PLAT-C01 — Filtro Activos / Inactivos / Todos

### 3.1 Diagnóstico (solo evidencia repo)

| Modo UI deseado | Comportamiento actual observable | Causa en FE |
|-----------------|----------------------------------|-------------|
| **Activos** | Coherente en práctica | `solo_activos=true` |
| **Todos** | Muestra solo activos | «Todos» no envía param → default OpenAPI `true` |
| **Inactivos** | Mezcla activos+inactivos | `solo_activos=false` + sin filtro client-side |

### 3.2 ¿Puede FE implementar los tres modos sin cambios Backend?

#### Modo **Activos**

| Aspecto | Detalle |
|---------|---------|
| **Enfoque FE** | Enviar explícitamente `solo_activos=true`; paginación server vía `skip`/`limit` existentes |
| **Datos necesarios** | Ya en contrato OpenAPI |
| **100% FE** | **Sí** — corrige mapeo; no requiere nuevo param |
| **Validación BE** | Opcional smoke test: respuesta solo filas con `es_activo === true` |

#### Modo **Todos**

| Aspecto | Detalle |
|---------|---------|
| **Enfoque FE** | Enviar `solo_activos=false` cuando UI = Todos |
| **OpenAPI** | Documenta `solo_activos=true` como «filtrar solo activos»; **no describe** qué ocurre con `false` |
| **100% FE** | **Parcial** — FE controla el param; **resultado depende de BE** |
| **Validación BE** | **Requerida** — confirmar que `false` incluye activos e inactivos (no vacío, no solo inactivos) |
| **Riesgo** | Si `false` no devuelve mezcla, FE no puede compensar sin fetch alternativo costoso |

#### Modo **Inactivos** (solo `es_activo === false`)

| Enfoque | 100% FE | Paginación correcta | Escalabilidad |
|---------|---------|---------------------|---------------|
| **A. Filtrar solo página actual** (`clientes.filter(!es_activo)` sin cambiar request) | Técnicamente | ❌ | ❌ — filas activas en otras páginas |
| **B. `solo_activos=false` + filtro client-side en página actual** | Parcial | ❌ | ❌ — mismo defecto |
| **C. Fetch amplio + filtro + paginación en memoria** | **Interim FE** | ✅ local | ⚠️ `limit` max **1000** (OpenAPI) |
| **D. Query param server `es_activo=false` / `solo_inactivos`** | No (no en OpenAPI) | ✅ server | ✅ — **requiere desarrollo BE** |

**Enfoque C (interim) — observable y viable en repo:**

1. Modo Inactivos (y opcionalmente Todos+Inactivos): `getClientes` con `solo_activos=false`, `limit=1000`, `skip=0`.
2. Filtrar: `clientes.filter(c => c.es_activo === false)`.
3. Paginar en FE sobre array filtrado (`slice` por `limitPerPage=10`).
4. Recalcular `total_clientes`, `total_paginas` localmente.
5. Búsqueda `buscar`: puede seguir en API antes del filtro client-side (param documentado).

**Límite observable:** OpenAPI `limit` maximum **1000**. Si `total_clientes` real > 1000, el subconjunto inactivo puede estar **incompleto** sin paginación server dedicada.

### 3.3 Matriz C01 — Clasificación final

| Entrega | 100% FE | Validación BE | Desarrollo BE |
|---------|---------|---------------|---------------|
| Activos correcto | ✅ | Smoke opcional | ❌ |
| Todos correcto | ⚠️ Parcial | ✅ **Requerida** | ❌ si `false` = todos |
| Inactivos correcto (UX aceptable super-admin) | ⚠️ Interim (enfoque C) | Recomendada | ❌ interim |
| Inactivos + paginación server + >1000 clientes | ❌ | — | ✅ **Requerida** |

### 3.4 Riesgos alternativas C01

| Alternativa | Riesgo | Severidad |
|-------------|--------|-----------|
| Solo corregir Activos/Todos, posponer Inactivos | Usuario sigue sin modo Inactivos fiable | Media |
| Enfoque C (fetch 1000) | Clientes totales > 1000 → inactivos omitidos | Media (baja si volumen super-admin pequeño) |
| Enviar param no documentado `es_activo=false` | BE puede ignorar o 422; comportamiento impredecible | Alta — **no recomendado** sin acuerdo BE |
| Filtrar solo página actual | Falso «Inactivos» con activos visibles | **P0** — peor que status quo |
| Mantener mapeo `es_activo` → `solo_activos` para Inactivos | Sigue roto | P0 |

---

## 4. UX-PLAT-C03 — Refresco post-mutación

### 4.1 Estado observable

| Componente | Evidencia |
|------------|-----------|
| `ClientManagementPage` L138–145 | `onSuccess` solo `closeActiveConfirm()` — **sin `refetch()`** |
| `useClientes` L66 | `refetch` **disponible** pero no usado en toggle |
| `useActivateCliente` / `useDeactivateCliente` L70–73, L92–94 | `invalidateQueries({ queryKey: ['clientes', tenantId] })` |
| `useClientes` L40–43 | `queryKey: ['clientes', tenantId, pagina, limite, filtros]` — prefijo compatible con invalidate |
| `useClientes` L43 | `staleTime: 2 * 60 * 1000` |
| `@tanstack/react-query` | `^5.66.9` en `package.json` |

**Endpoints mutación (documentados / usados en servicio):**

- Desactivar: `DELETE /clientes/{id}/` — respuesta `{ message }`, no devuelve fila completa
- Reactivar: `PUT /clientes/{id}/activar/` — respuesta `ClienteResponse` con `data?: Cliente` (incluye `es_activo`)

### 4.2 ¿100% resoluble en FE?

**Sí.** No falta dato del API para refrescar: el listado se re-obtiene con `GET /clientes/` existente.

**Cambios FE suficientes (sin BE):**

| Capa | Acción |
|------|--------|
| Página | `onSuccess` async: `closeActiveConfirm(); await refetch();` |
| Hooks | `await queryClient.invalidateQueries({ queryKey: ['clientes', tenantId], refetchType: 'active' })` |
| Opcional | `staleTime: 0` o reducido en `useClientes` para super-admin |
| Opcional | `setQueryData` optimista sobre `es_activo` del row afectado |

**Interacción con C01:** Parte del síntoma «Reactivar no refresca» es **filtro Inactivos roto** (fila reactivada debería desaparecer de vista Inactivos). C03 solo no basta si C01 no filtra; **orden recomendado: C01 + C03 juntos**.

### 4.3 Riesgos C03

| Riesgo | Mitigación FE |
|--------|---------------|
| Doble request (invalidate + refetch) | Aceptable; o usar solo `await refetch()` |
| Lag visual breve | Optimistic update opcional |
| `refetch` con filtros desactualizados | `queryKey` incluye `filtros` — refetch usa estado actual ✅ |
| C01 roto enmascara fix C03 | Implementar C01 interim en mismo PR |

---

## 5. UX-PLAT-C04 — Vocabulario Reactivar / Desactivar

### 5.1 Inventario copy (alcance listado + hooks de toggle)

| Ubicación | Texto actual | ¿Cumple convención? |
|-----------|--------------|---------------------|
| `ClientManagementPage` tooltips | Desactivar / Reactivar | ✅ |
| `ConfirmDialog` | Desactivar / Reactivar | ✅ |
| `useDeactivateCliente` toast | «desactivado exitosamente» | ✅ |
| `useActivateCliente` toast success L73 | «Cliente **activado** exitosamente» | ❌ → «**reactivado**» |
| `useActivateCliente` toast error L77 | «Error al **activar** el cliente» | ❌ → «**reactivar**» |
| `useActivateCliente` nombre hook / `activateCliente` servicio | `activate` / `/activar/` | N/A — identificadores técnicos, no copy usuario |
| `EditClientModal` L871 | «Cliente activo» (checkbox estado) | ⚠️ Estado booleano, no acción «Activar» — **fuera alcance estricto C04** |

**Búsqueda grep** en `src/features/super-admin/clientes/pages/` + `useClienteMutations.ts`: copy usuario incorrecto **solo en hook activate** (2 strings).

### 5.2 ¿100% FE?

**Sí.** Únicamente ajuste de strings en `src/core/hooks/useClienteMutations.ts`. Sin BE, sin cambio de endpoint, sin cambio OpenAPI.

### 5.3 Riesgos C04

| Riesgo | Sev. |
|--------|------|
| Inconsistencia residual en tabs detalle (`ClientModulesTab` «Activar Módulo») | Baja — dominio distinto |
| Renombrar hook `useActivateCliente` | Innecesario — no visible al usuario |

---

## 6. Tabla consolidada — Qué requiere qué

| ID | 100% Frontend | Validación Backend | Desarrollo Backend |
|----|---------------|--------------------|--------------------|
| **C04** | ✅ Copy hooks (2 líneas) | ❌ | ❌ |
| **C03** | ✅ `refetch` + invalidate async | ❌ | ❌ |
| **C01 Activos** | ✅ Mapeo `solo_activos=true` | Smoke opcional | ❌ |
| **C01 Todos** | ⚠️ Enviar `solo_activos=false` | ✅ Confirmar semántica `false` | ❌ si confirmado |
| **C01 Inactivos (interim)** | ⚠️ Fetch + filter + paginación local | Recomendada (volumen, semántica `false`) | ❌ interim |
| **C01 Inactivos (definitivo)** | ❌ | — | ✅ Param filtro server-side inactivos |

---

## 7. Plan de implementación recomendado (solo FE, sin BE)

Orden sugerido **sin esperar Backend**:

| Paso | ID | Acción | Archivos |
|------|-----|--------|----------|
| 1 | C04 | Cambiar toasts activate → reactivar | `useClienteMutations.ts` |
| 2 | C03 | `await refetch()` en `handleActiveConfirm`; invalidate async en hooks | `ClientManagementPage.tsx`, `useClienteMutations.ts` |
| 3 | C01a | Introducir `ClienteActiveFilter: 'active' \| 'inactive' \| 'all'`; corregir mapeo servicio | `cliente.types.ts`, `cliente.service.ts`, `ClientManagementPage.tsx` |
| 4 | C01b | **Activos:** `solo_activos=true` + paginación server | servicio + página |
| 5 | C01c | **Todos:** `solo_activos=false` + paginación server | servicio + página |
| 6 | C01d | **Inactivos (interim):** rama query con `limit=1000`, filtro `!es_activo`, paginación local | `cliente.service.ts`, `ClientManagementPage.tsx`, posible extensión `useClientes` |
| 7 | QA | Matriz §8 | Manual |

**Ticket Backend (paralelo, no bloqueante para C03/C04):**

- Validar semántica `solo_activos=false`.
- Solicitar `es_activo` o `solo_inactivos` en listado para paginación server de inactivos.

---

## 8. QA mínimo post-implementación FE-only

| ID | Caso | Modo |
|----|------|------|
| Q-C04-01 | Toast reactivar dice «reactivado» | C04 |
| Q-C03-01 | Desactivar → badge Inactivo sin F5 | C03 |
| Q-C03-02 | Reactivar → badge Activo sin F5 | C03 |
| Q-C01-01 | Activos → 0 filas Inactivo | C01 |
| Q-C01-02 | Todos → presencia activos e inactivos | C01 + validación BE |
| Q-C01-03 | Inactivos → 0 filas Activo | C01 interim |
| Q-C01-04 | Inactivos + reactivar → fila desaparece | C01 + C03 |
| Q-C01-05 | Paginación Inactivos coherente con conteo local | C01 interim |

---

## 9. Respuestas directas a los objetivos

### 1. ¿TS contempla `es_activo` en DTOs del listado?

**Sí.** `Cliente.es_activo: boolean` en respuesta; `ClienteFilters.es_activo` en filtros UI (mapeo incorrecto a API).

### 2. ¿El listado ya consume `es_activo` en UI?

**Sí** en badges y acciones; **no** en filtro de listado (solo mal mapeo server-side).

### 3. ¿FE puede implementar Activos / Inactivos / Todos sin cambios BE?

| Modo | Respuesta |
|------|-----------|
| Activos | **Sí** (100% FE) |
| Todos | **Parcial** — FE envía param; validar BE |
| Inactivos | **Interim sí** (filtro client-side + paginación local, límite 1000); **definitivo no** sin BE |

### 4. ¿C03 resoluble 100% en FE?

**Sí** — `refetch` explícito y/o invalidate async; evidencia en hooks y página actuales.

### 5. ¿C04 es solo copy?

**Sí** — 2 strings en `useActivateCliente`; UI listado ya conforme.

---

## 10. Decisión sugerida antes de pedir cambios al Backend

| Prioridad | Acción |
|-----------|--------|
| **Inmediata** | Implementar C03 + C04 en FE (0 dependencias) |
| **Inmediata** | C01 Activos + mapeo Todos/Inactivos interim en FE |
| **Paralela (1 pregunta BE)** | «¿`solo_activos=false` devuelve activos+inactivos?» |
| **Ticket BE (no bloqueante corto plazo)** | Param filtro solo inactivos con paginación server |
| **Post-BE** | Reemplazar interim Inactivos por paginación server; retirar fetch 1000 |

---

*Fin — PLATFORM_CLIENTES_FE_ONLY_FEASIBILITY_AUDIT.md*
