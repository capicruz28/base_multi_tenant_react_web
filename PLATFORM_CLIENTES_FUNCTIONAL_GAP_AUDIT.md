# PLATFORM_CLIENTES_FUNCTIONAL_GAP_AUDIT.md

**Tema:** Brechas funcionales — Gestión de Clientes (Reactivar + filtros toolbar)  
**Fecha:** 2026-06-02  
**Tipo:** Auditoría técnica focalizada — **sin implementación, sin repair, sin commit**  
**Contexto:** Pruebas manuales post-commit `1c78ce7` (UX-PLAT-C01/C03/C04)  
**Referencias en repo:**

- `src/features/super-admin/clientes/pages/ClientManagementPage.tsx`
- `src/features/super-admin/clientes/services/cliente.service.ts`
- `src/core/hooks/useClienteMutations.ts`
- `src/core/hooks/useClientes.ts`
- `docs/backend_openapi.json` — copia OpenAPI (única fuente de contrato API en este repo)

**Restricción:** No se infiere lógica interna del Backend más allá del texto **documentado** en `docs/backend_openapi.json`.

---

## 1. Resumen ejecutivo

| Hallazgo | Síntoma reportado | Clasificación | Causa probable (evidencia repo) |
|----------|-------------------|---------------|----------------------------------|
| **H1 — Reactivar** | Toast OK; UI/BD `es_activo=0`; 2.º intento «ya está activo» | **Mixto** | Desalineación de **campos** entre endpoints documentados y UI; FE no valida respuesta |
| **H2 — Filtros Plan/Estado** | Selects sin efecto | **Frontend** (hoy) | Estado UI no llega al servicio; OpenAPI listado **no** expone esos query params |

**Veredicto:** C03 (refresh) **no explica H1** si el listado post-`refetch` refleja fielmente la API. Los síntomas encajan con un **contrato API ≠ expectativa UX** en el ciclo soft-delete, documentado en OpenAPI del repo. **C02 sigue abierto** — no fue implementado en `1c78ce7`.

---

## 2. Hallazgo 1 — Flujo Reactivar

### 2.1 Síntomas reportados (QA manual)

1. Toast: «Cliente reactivado exitosamente».
2. Badge/fila siguen **Inactivo** en UI.
3. BD: `es_activo = 0`.
4. Segundo intento: error tipo **«el cliente ya está activo»** (HTTP 400 documentado en OpenAPI).

### 2.2 Diagrama de flujo observable (Frontend)

```mermaid
sequenceDiagram
  participant UI as ClientManagementPage
  participant Hook as useActivateCliente
  participant Svc as cliente.service
  participant API as PUT /clientes/{id}/activar/
  participant RQ as React Query

  UI->>UI: openActiveConfirm (cliente.es_activo === false)
  UI->>Hook: mutate(cliente_id)
  Hook->>Svc: activateCliente(id)
  Note over Svc: Sin body; PUT vacío
  Svc->>API: PUT /clientes/{id}/activar/
  API-->>Svc: 200 ClienteResponse { data: ClienteRead }
  Svc-->>Hook: Cliente (si data.data existe)
  Hook->>RQ: invalidateQueries ['clientes', tenantId]
  Hook->>UI: toast.success reactivado
  UI->>RQ: await refetch()
  RQ->>Svc: getClientes(...)
  Svc-->>UI: lista con es_activo del API
  Note over UI: Badge usa cliente.es_activo
```

### 2.3 Trazabilidad por capa

#### UI — `ClientManagementPage.tsx`

| Aspecto | Evidencia | Líneas |
|---------|-----------|--------|
| Condición «inactivo» | `cliente.es_activo` falsy → botón Reactivar | L133–136, L411–419 |
| Badge estado | `cliente.es_activo ? 'Activo' : 'Inactivo'` | L369–374 |
| Confirm Reactivar | `activeAction === 'reactivate'` | L504–519 |
| Post-mutación | `closeActiveConfirm()` + `await refetch()` | L144–154 |
| Campo **no** usado para toggle | `estado_suscripcion` solo en columna Plan/Estado | L357–359 |

**Conclusión UI:** Toda la semántica visual de Reactivar/Desactivar en listado depende de **`es_activo`**, no de `estado_suscripcion`.

#### Hook — `useActivateCliente` (`useClienteMutations.ts`)

| Aspecto | Evidencia |
|---------|-----------|
| Mutación | `clienteService.activateCliente(id)` |
| Éxito | `invalidateQueries` + toast **sin inspeccionar** `Cliente` retornado |
| Validación `es_activo` post-API | **Ausente** |
| Copy | «reactivado» (C04 aplicado) |

```67:75:src/core/hooks/useClienteMutations.ts
  return useMutation<Cliente, Error, string>({
    mutationFn: (id) => clienteService.activateCliente(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['clientes', tenantId],
        refetchType: 'active',
      });
      toast.success('Cliente reactivado exitosamente');
```

#### Service — `activateCliente` vs `deactivateCliente`

| Operación UX | Método FE | HTTP | Body | Retorno FE |
|--------------|-----------|------|------|------------|
| **Desactivar** | `deactivateCliente` | `DELETE /clientes/{id}/` | — | `{ message }` |
| **Reactivar** | `activateCliente` | `PUT /clientes/{id}/activar/` | **ninguno** | `Cliente` vía `data.data` |

```94:106:src/features/super-admin/clientes/services/cliente.service.ts
  async activateCliente(id: string): Promise<Cliente> {
    const { data } = await api.put<ClienteResponse>(`${BASE_URL}/${id}/activar/`);
    if (data.data) {
      return data.data;
    }
    throw new Error('Respuesta del servidor sin datos del cliente');
  },

  async deactivateCliente(id: string): Promise<{ message: string }> {
    const { data } = await api.delete<{ success: boolean; message: string; cliente_id: string }>(
      `${BASE_URL}/${id}/`,
```

**Alternativa documentada no usada para Reactivar:** `updateCliente(id, { es_activo: true })` — `ClienteUpdate` en OpenAPI **incluye** `es_activo`.

#### React Query — `useClientes.ts`

| Aspecto | Valor |
|---------|-------|
| `queryKey` | `['clientes', tenantId, pagina, limite, filtros]` |
| Invalidación toggle | Prefijo `['clientes', tenantId]` — **cubre** query activa |
| `staleTime` | `0` (post-C03) |
| Refetch página | `await refetch()` en handler confirm |

**Conclusión RQ:** La cadena invalidate + refetch está ** cableada correctamente**. Si tras refetch la fila sigue inactiva, la lista está reflejando **`es_activo` del API**, no un cache obsoleto por defecto.

#### Contrato OpenAPI (repo) — desalineación documentada

| Endpoint | Texto documentado en `docs/backend_openapi.json` |
|----------|--------------------------------------------------|
| `DELETE /api/v1/clientes/{cliente_id}/` | «Eliminación lógica — **marca como inactivo**» |
| `PUT /api/v1/clientes/{cliente_id}/activar/` | «Reactiva un cliente cambiando su **estado de suscripción a 'activo'**» |
| `PUT /api/v1/clientes/{cliente_id}/activar/` resp. 400 | «**Cliente ya está activo**» |
| `ClienteRead.es_activo` | «Si está inactivo, bloquea acceso a todos los usuarios del cliente» |
| `ClienteRead.estado_suscripcion` | «Estado actual: 'trial', 'activo', 'suspendido', …» (**campo distinto**) |

**Observación clave (solo texto OpenAPI, sin inferir implementación):**

- **Desactivar** (DELETE) se describe como marcar **inactivo** → coherente con `es_activo=0` en BD reportado.
- **Reactivar** (`/activar/`) se describe como cambiar **`estado_suscripcion`**, no `es_activo`.
- El error 400 «ya está activo» en segundo intento es **coherente** si `/activar/` idempotencia/validación usa criterio distinto a `es_activo` (p. ej. `estado_suscripcion === 'activo'` ya aplicado en 1.er intento).

### 2.4 Reconciliación síntoma ↔ evidencia

| Síntoma QA | Explicación compatible con evidencia repo |
|------------|-------------------------------------------|
| Toast éxito | HTTP 200 + `data.data` presente → hook dispara toast **sin** comprobar `es_activo` |
| UI sigue Inactivo | Badge lee `es_activo`; refetch devuelve fila con `es_activo=false` |
| BD `es_activo=0` | DELETE desactivó `es_activo`; `/activar/` documentado no menciona restaurar `es_activo` |
| 2.º intento «ya activo» | OpenAPI documenta 400 «Cliente ya está activo» en `/activar/` |

### 2.5 Clasificación H1

| Capa | Rol | Clasificación |
|------|-----|---------------|
| Expectativa UX / UI | Reactivar = `es_activo true` | **Frontend** (modelo mental y binding) |
| Endpoint elegido | `PUT /activar/` vs `PUT` update `{ es_activo: true }` | **Frontend** (elección de API) |
| Texto contrato `/activar/` | Modifica `estado_suscripcion`, no declara `es_activo` | **Mixto** — contrato documentado ≠ UI |
| Persistencia `es_activo` tras `/activar/` | No demostrable solo desde FE | **No demostrable** / validar con Network+BD |
| Comportamiento 400 2.º intento | Documentado en OpenAPI | **Mixto** — coherente con campo distinto |

**Veredicto H1:** **Mixto (primario)** — no es un fallo de refresh C03; es **inconsistencia funcional entre el par DELETE↔`/activar/` documentado y el par es_activo que usa la UI**. El Frontend **agrava** el problema al declarar éxito sin validar `es_activo` en la respuesta.

### 2.6 Rutas de remediación (solo diseño — fuera alcance)

| Opción | Tipo | Notas |
|--------|------|-------|
| **A** | BE | `/activar/` también pone `es_activo=true` (alinear con DELETE) |
| **B** | FE | Reactivar → `updateCliente(id, { es_activo: true })` (OpenAPI `ClienteUpdate` lo permite) |
| **C** | FE | Tras `/activar/`, validar `data.es_activo`; si false → toast error / no éxito |
| **D** | FE+UX | Cambiar badge a `estado_suscripcion` — **incompatible** con soft-delete DELETE |

**Recomendación auditoría:** Validar en DevTools **Response** del 1.er `PUT …/activar/` (`data.es_activo`, `data.estado_suscripcion`) antes de escalar BE. Eso clasifica A vs B con evidencia runtime.

### 2.7 Riesgos H1

| Riesgo | Sev. |
|--------|------|
| Usuario cree que reactivó tenant pero acceso sigue bloqueado (`es_activo`) | **P0** |
| Segundo intento confunde («ya activo» vs badge Inactivo) | **P0** |
| Fix solo FE refresh no resuelve | **Alto** — ya demostrado en QA |

---

## 3. Hallazgo 2 — Filtros Plan y Estado de suscripción (UX-PLAT-C02)

### 3.1 Síntoma

Selects **Plan de suscripción** y **Estado de suscripción** en toolbar no alteran la lista.

### 3.2 Trazabilidad

#### UI — toolbar (`ClientManagementPage.tsx` L220–243)

| Control | State | Handler |
|---------|-------|---------|
| Plan | `filters.plan_suscripcion` | `handleFilterChange('plan_suscripcion', …)` |
| Estado | `filters.estado_suscripcion` | `handleFilterChange('estado_suscripcion', …)` |

Valores estado alineados a `SubscriptionStatus` (`activo`, `trial`, `suspendido`) — `src/core/constants/subscription.types.ts`.

#### Query — `useClientes` (L71)

```typescript
filtros: { ...filters, activeFilter, buscar: debouncedSearchTerm || undefined },
```

`plan_suscripcion` y `estado_suscripcion` **entran** al objeto `filtros` en React Query key.

#### Service — `getClientes` (`cliente.service.ts` L30–66)

**Solo consume:**

- `filtros.activeFilter` → `solo_activos`
- `filtros.buscar` → `buscar`

**No lee:** `plan_suscripcion`, `estado_suscripcion`, `tipo_instalacion`.

#### OpenAPI — `GET /api/v1/clientes/`

Query params documentados: `skip`, `limit`, `solo_activos`, `buscar`.

**Ausentes:** `plan_suscripcion`, `estado_suscripcion`.

#### DTO respuesta

Cada `Cliente` / `ClienteRead` **incluye** `plan_suscripcion` y `estado_suscripcion` — filtrado **client-side** sería posible en FE sobre datos ya recibidos (no implementado).

### 3.3 Clasificación H2

| Pregunta | Respuesta |
|----------|-----------|
| ¿Por qué no hay efecto hoy? | **Frontend** — wiring roto entre state y servicio |
| ¿Puede cerrarse 100% FE sin BE? | **Parcial** — filtro client-side sobre página/lote cargado (mismas limitaciones que C01 Inactivos interim) |
| ¿Filtro server-side documentado? | **No** — requeriría **desarrollo Backend** + OpenAPI |
| ¿C02 cerrado en `1c78ce7`? | **No** — explícitamente fuera de ese commit |

### 3.4 Opciones remediación C02 (diseño)

| Opción | Tipo | Trade-off |
|--------|------|-----------|
| **Ocultar** selects hasta BE | FE | Elimina UI engañosa (plan P0 P1) |
| **Filtro client-side** en página | FE | Rápido; paginación/total incorrectos si filtro reduce filas |
| **Query params BE** | BE + FE | Solución definitiva con paginación server |

### 3.5 Riesgos H2

| Riesgo | Sev. |
|--------|------|
| Confianza en toolbar | **P1** |
| Filtro client-side da totales erróados | **P2** |

---

## 4. Matriz consolidada

| ID | Problema | FE | BE | Mixto | No demostrable FE |
|----|----------|----|----|-------|-------------------|
| **H1a** | UI/Reactizar atado a `es_activo` | ✓ | | | |
| **H1b** | Reactivar llama `/activar/` (doc: `estado_suscripcion`) | ✓ | | ✓ contrato | |
| **H1c** | Toast éxito sin validar `es_activo` respuesta | ✓ | | | |
| **H1d** | Refresh post-mutación insuficiente como causa | | | | ✗ descartado como causa raíz |
| **H1e** | BD `es_activo=0` tras éxito | | | ✓ | ✓ requiere Network/BD |
| **H1f** | 400 «ya activo» 2.º intento | | | ✓ (doc OpenAPI) | |
| **H2a** | Plan/Estado no enviados al servicio | ✓ | | | |
| **H2b** | Params listado no en OpenAPI | | ✓ | | |
| **H2c** | C02 no implementado | ✓ | | | |

---

## 5. Estado de cierre Gestión de Clientes

| Ticket | Estado post-`1c78ce7` | Bloqueo cierre |
|--------|----------------------|----------------|
| UX-PLAT-C01 | Parcial | Inactivos interim OK; Todos depende semántica `solo_activos=false` |
| UX-PLAT-C03 | Implementado | **No explica H1** |
| UX-PLAT-C04 | Implementado | — |
| UX-PLAT-C02 | **Abierto** | H2 |
| **H1 Reactivar funcional** | **Abierto** | Mixto contrato + validación FE |

**Gestión de Clientes no puede considerarse cerrada** hasta resolver **H1** y **C02**.

---

## 6. Checklist diagnóstico runtime (para siguiente iteración)

Ejecutar en browser (DevTools → Network), **sin asumir BE**:

| # | Request | Verificar en Response |
|---|---------|------------------------|
| 1 | `DELETE /clientes/{id}/` (desactivar) | Cuerpo; luego GET fila: `es_activo`, `estado_suscripcion` |
| 2 | `PUT /clientes/{id}/activar/` (1.er reactivar) | `data.es_activo`, `data.estado_suscripcion`, `message` |
| 3 | `GET /clientes/?…` post-refetch | Misma fila: `es_activo` |
| 4 | `PUT /clientes/{id}/activar/` (2.º intento) | Status 400 + `detail` |
| 5 | *(opcional)* `PUT /clientes/{id}/` `{ es_activo: true }` | Si prueba manual de opción B |

---

## 7. Orden recomendado de corrección (post-auditoría)

| Prioridad | Acción | Tipo |
|-----------|--------|------|
| **P0** | Diagnosticar Response paso 2 (tabla §6) | QA |
| **P0** | Alinear Reactivar con `es_activo` (opción A o B) | BE o FE |
| **P0** | Validar éxito solo si `es_activo === true` (opción C mínima) | FE |
| **P1** | C02: ocultar filtros **o** wire-up client-side **o** ticket BE | FE / BE |
| **P2** | Documentar en UI copy que `/activar/` ≠ checkbox «Cliente activo» en edit | FE |

---

## 8. Archivos clave

| Archivo | Relevancia H1 / H2 |
|---------|-------------------|
| `ClientManagementPage.tsx` | UI toggle, filtros, refetch |
| `cliente.service.ts` | activate/deactivate/getClientes |
| `useClienteMutations.ts` | Toast, invalidate |
| `useClientes.ts` | queryKey, staleTime |
| `cliente.types.ts` | `Cliente`, `ClienteFilters` |
| `docs/backend_openapi.json` | Contrato DELETE, `/activar/`, GET list |
| `EditClientModal.tsx` | `es_activo` editable vía `updateCliente` (alternativa B) |

---

*Fin — PLATFORM_CLIENTES_FUNCTIONAL_GAP_AUDIT.md*
