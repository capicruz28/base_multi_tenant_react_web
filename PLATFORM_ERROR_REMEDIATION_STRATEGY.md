# PLATFORM_ERROR_REMEDIATION_STRATEGY.md

**Tema:** Estrategia de remediación FIX-ERR-01, FIX-ERR-02, FIX-ERR-03  
**Fecha:** 2026-06-02  
**Tipo:** Análisis técnico y recomendación — **sin implementación, sin repair, sin commit**  
**Entrada:** `PLATFORM_ERROR_EXPERIENCE_AUDIT.md` (aceptada; UX-PLAT-ERR-01 confirmado como causa raíz)

**Alcance de este documento:** únicamente los tres fixes mínimos del §11.1 de la auditoría. FIX-ERR-04+ quedan fuera.

---

## 1. Resumen de la recomendación

| Decisión | Elección |
|----------|----------|
| **FIX-ERR-01** | **Estrategia A** — propagar `AxiosError` sin wrap desde `cliente.service.ts` (patrón ORG), con ajuste obligatorio en banner de lista |
| **FIX-ERR-02** | **Misma fase / mismo release que FIX-ERR-01** (no posponer) |
| **FIX-ERR-03** | **Misma fase que FIX-ERR-01** (esfuerzo trivial, cero beneficio funcional si se retrasa) |
| **Estrategia B** | **No adoptar como solución principal**; solo como complemento acotado para errores de contrato FE (`Error` sin Axios) si se desea |

---

## 2. Contexto — cadena rota actual

```
API (Axios 4xx/5xx + detail)
  → cliente.service: getErrorMessage(axios) → throw new Error(msg)   ← 1ª resolución
    → hook onError / Create catch: getErrorMessage(Error) → genérico ← 2ª resolución (pierde detail/status)
```

**Excepción hoy:** `ClientManagementPage` lista usa `queryError.message` del `throw`, por eso el banner de carga **sí** puede mostrar texto útil mientras los toasts de mutación **no**.

---

## 3. FIX-ERR-01 — Comparativa técnica A vs B

### 3.1 Estrategia A — Propagar `AxiosError` (patrón ORG)

**Descripción:** Eliminar en `cliente.service.ts` los bloques `catch` que hacen `throw new Error(getErrorMessage(error).message)` en operaciones HTTP. Dejar que Axios rechace la promesa con `AxiosError` intacto, igual que `empresaService` en `org.service.ts`.

**Cambios típicos:**

| Área | Cambio |
|------|--------|
| `cliente.service.ts` | Quitar `try/catch` envolvente en `getClientes`, `getClienteById`, `createCliente`, `updateCliente`, `activateCliente`, `deactivateCliente`, `suspendCliente`, diagnósticos |
| `getClienteStats` | **Mantener** `catch` selectivo por `status === 404/500` (lógica de negocio); en otros casos **re-lanzar** `error` sin convertir a `Error` plano |
| Errores de contrato FE | p. ej. `throw new Error('Respuesta del servidor sin datos del cliente')` — siguen siendo `Error` plano (ver §3.4) |
| `ClientManagementPage` | **Obligatorio:** sustituir `queryError.message` por `getErrorMessage(queryError).message` en banner de error |
| Hooks / modales | Sin cambio de API si ya usan `getErrorMessage` en `onError` / `catch` |
| `getValidationErrors` | Queda **habilitado** en fase posterior (FIX-ERR-04) sin rediseñar el servicio |

**Consumidores directos de `cliente.service` (super-admin Platform):**

| Consumidor | Import |
|------------|--------|
| `ClientManagementPage` | `useClientes`, `useActivateCliente`, `useDeactivateCliente` |
| `CreateClientModal` | `clienteService.createCliente` (hasta FIX-ERR-02) |
| `EditClientModal` | vía `useUpdateCliente` |
| `ClientDetailPage` | `getClienteById`, `getClienteStats` (fuera alcance P1 error UX, mismo servicio) |
| `core/hooks/useClientes.ts`, `useClienteMutations.ts` | reexportan el mismo servicio |

No hay otros módulos ERP importando `features/super-admin/clientes/services/cliente.service.ts` (el `clienteService` de SLS es otro archivo).

---

### 3.2 Estrategia B — Mantener wrap + extender `getErrorMessage`

**Descripción:** Dejar `cliente.service.ts` como está y, antes del fallback genérico en `getErrorMessage`, añadir algo equivalente a:

```typescript
if (error instanceof Error && error.message.trim()) {
  return { message: error.message.trim(), status: 0 };
}
```

**Efecto:**

| Aspecto | Resultado |
|---------|-----------|
| Toast create/edit/activate/deactivate | **Se corrige** el texto mostrado al usuario (mensaje ya resuelto en el service) |
| `detail` / status HTTP en capa UI | **Perdidos** en segunda pasada (`status: 0` siempre) |
| `getValidationErrors` | **Sigue roto** para errores envueltos (no hay `response.data`) |
| ER-01 (jerarquía `detail` en un solo lugar) | **Violación suave** — la jerarquía real ocurre en el service, no donde V2 indica (UI/hooks) |
| ER-02 | Sin cambio |
| Lista `queryError.message` | Sin regresión (sigue igual) |
| `console.error` “Error no manejado por Axios” | Deja de dispararse para `Error` con message (mejora ruido consola) |
| Alcance global | Beneficia **cualquier** módulo que use el mismo anti-patrón (`conexion.service.ts`, etc.) sin tocar cada servicio |

---

### 3.3 Matriz de evaluación A vs B

| Criterio | A — Axios sin wrap | B — `Error.message` en `getErrorMessage` |
|----------|-------------------|----------------------------------------|
| **ER-01** (`detail` / API en `getErrorMessage`) | **Cumple** — una sola resolución en hook/UI | Cumple texto toast; **no** cumple status/`detail` en UI |
| **ER-02** | Neutral (no resuelve solo) | Neutral |
| **Alineación ORG / Catálogos** | **Alta** — mismo contrato de servicio | Baja — patrón legacy encapsulado |
| **CreateClientModal** | `catch` + `getErrorMessage` funciona; migración a hook (ERR-02) simplifica | Igual corrección de toast sin migrar |
| **EditClientModal** | `onError` hook funciona con Axios | `onError` funciona vía message copiado |
| **useClienteMutations** | `getErrorMessage(error)` recibe Axios | Recibe `Error` con message |
| **ClientManagementPage** | **Requiere cambio** en banner lista | Sin cambio en lista |
| **Riesgo regresión lista** | **Medio** si no se actualiza banner (ver §3.5) | Bajo en lista |
| **Riesgo regresión mutaciones** | Bajo | Bajo |
| **FIX-ERR-04 futuro (422 campos)** | **Desbloqueado** | Bloqueado sin des-wrap adicional |
| **Reutilización Platform** | Plantilla clara para nuevos servicios super-admin | Parche central que enmascara deuda en N servicios |
| **Esfuerzo** | Medio (~1 archivo servicio + 1 línea página + pruebas) | Bajo (~15 líneas `error.service.ts`) |
| **Riesgo técnico global** | Bajo acotado a `cliente.service` | Medio — cualquier `Error` con message oculta fallos no-API |

---

### 3.4 Matiz — errores que no son Axios

Con **A**, siguen existiendo `throw new Error(...)` locales (respuesta vacía, validaciones de contrato en servicio). Para esos casos, `getErrorMessage` hoy devuelve genérico.

**Recomendación acotada (compatible con A, no sustituto de A):**

- Añadir en `getErrorMessage` un ramo **después** de Axios y **antes** del genérico:

  `if (error instanceof Error && error.message.trim()) return { message, status: 0 }`

- Documentar que ese ramo es solo para **errores de contrato FE**, no para compensar wrap de HTTP.

**No confundir** esto con la estrategia B completa: B como “solución principal” mantiene el doble procesamiento HTTP y bloquea `getValidationErrors`.

---

### 3.5 Regresión crítica si se aplica A sin adjuncto

Si se elimina el wrap y **no** se cambia el banner:

```typescript
// ClientManagementPage — hoy
const error = queryError ? queryError.message : null;
```

Con `AxiosError`, `error.message` suele ser `"Request failed with status code 409"`, **peor** que el mensaje de negocio actual.

**Adjunto obligatorio de FIX-ERR-01-A:**

```typescript
const error = queryError ? getErrorMessage(queryError).message : null;
```

---

## 4. Impacto por componente (estrategia A recomendada)

### 4.1 `cliente.service.ts`

| Método | Hoy | Tras A |
|--------|-----|--------|
| CRUD / list / activate / deactivate | catch + wrap | Axios rechaza → consumidor maneja |
| `getClienteStats` | catch 404/500 → `null`; otros → wrap | Mantener 404/500 → `null`; **rethrow** Axios en otros |
| `validateSubdominio` | sin API real | Sin cambio |
| `console.error` en service | En cada catch | **Eliminar** o reducir a DEV (ER-01 no exige log en servicio; ORG no loguea) |

**Impacto:** archivo ~10 bloques `catch` simplificados.

### 4.2 `useClienteMutations` (`@/core/hooks`)

| Hook | Cambio tras A |
|------|----------------|
| `useCreateCliente` | `onError` recibe Axios → toast con `detail` / fallback HTTP correcto |
| `useUpdateCliente` | Igual |
| `useActivateCliente` / `useDeactivateCliente` | Igual |

**Sin cambio de firma.** Tipado `useMutation<..., Error, ...>` sigue válido (AxiosError extiende Error).

### 4.3 `CreateClientModal`

| Aspecto | Tras A solo | Tras A + FIX-ERR-02 |
|---------|-------------|---------------------|
| Submit | `clienteService` + catch toast | `useCreateCliente().mutate` / `mutateAsync` |
| Error UX | Toast correcto en catch | Toast solo en hook `onError` (ER-02) |
| Éxito | Toast local + hook duplicaría si se migra mal | Un solo toast en hook `onSuccess` |
| `loading` | `useState` local | `createMutation.isPending` |
| `validateSubdominio` | Sin cambio (ERR-01 no lo cubre) | Sin cambio |

### 4.4 `EditClientModal`

Ya usa `useUpdateCliente` con comentario “error en mutación”. Tras **A**, el toast de error en `onError` del hook **pasa a mostrar mensaje de negocio** sin cambios en el modal.

Opcional en la misma fase: eliminar comentarios obsoletos; **no** es bloqueante.

### 4.5 `ClientManagementPage`

| Flujo | Cambio |
|-------|--------|
| Lista error | **Adjunto obligatorio** `getErrorMessage(queryError)` |
| Activar / desactivar | Beneficio automático vía hooks |
| Modales hijos | Beneficio indirecto (Edit); Create tras ERR-02 |

### 4.6 Efectos colaterales fuera del ticket (informativo)

| Archivo | Efecto de A en `cliente.service` |
|---------|----------------------------------|
| `ClientDetailPage` | `getErrorMessage(err)` en catch deja de recibir wrap → **mejora** sin editar si se despliega A |
| `conexion.service.ts` | **No incluido** en FIX-ERR-01; mantiene anti-patrón hasta ticket aparte |

---

## 5. FIX-ERR-02 — Unificación create → hook

### 5.1 Estado actual

| Regla | Create | Edit |
|-------|--------|------|
| ER-02 (toast error en hook) | **Incumple** — toast en `catch` del modal | **Cumple** — `useUpdateCliente.onError` |
| ER-02 éxito | Toast en modal **y** hook si se usara `useCreateCliente` | Toast solo en hook |
| Mutación | Llama `clienteService` directo | `updateMutation.mutate` |

`useCreateCliente` existe en `@/core/hooks/useClienteMutations` pero **no** lo importa `CreateClientModal`.

### 5.2 Cambios previstos (FIX-ERR-02)

1. Importar `useCreateCliente` en `CreateClientModal`.
2. Reemplazar `await clienteService.createCliente` por `createMutation.mutateAsync` (o `mutate` + callbacks).
3. Eliminar `catch` con `toast.error` (dejar `onError` del hook).
4. Eliminar `toast.success` local; confiar en `onSuccess` del hook (evitar AP-11).
5. Alinear `loading` con `createMutation.isPending` (y `isSubmitting` de discard).
6. Mantener preparación `dataToSend` y `validateForm` en el modal (ER-03).

### 5.3 Dependencia con FIX-ERR-01

| Orden | Resultado |
|-------|-----------|
| **ERR-02 antes de ERR-01 (B no aplicada)** | Sigue toast genérico en `onError` |
| **ERR-01 A, luego ERR-02** | ER-02 + mensaje correcto — **orden recomendado** |
| **ERR-02 sin ERR-01 (solo B)** | Corrige toast sin alinear arquitectura ni 422 futuro |

**Conclusión:** FIX-ERR-02 debe ir **en el mismo release que FIX-ERR-01-A**, inmediatamente después o en el mismo PR.

### 5.4 ¿Fase posterior?

| Posponer ERR-02 | Consecuencia |
|-----------------|--------------|
| Sí | ERR-01-A arregla toast en create vía `catch`, pero ER-02 sigue incumplido; riesgo de doble toast si alguien conecta el hook sin quitar catch |
| No | Un solo PR cierra causa raíz + estándar V2 en create |

**Recomendación:** **no posponer** FIX-ERR-02.

---

## 6. FIX-ERR-03 — Deduplicación de hooks

### 6.1 Inventario

| Archivo | Usado por |
|---------|-----------|
| `src/core/hooks/useClienteMutations.ts` | `ClientManagementPage`, `EditClientModal` |
| `src/features/super-admin/clientes/hooks/useClienteMutations.ts` | **Nadie** (duplicado línea a línea) |
| `src/core/hooks/useClientes.ts` | `ClientManagementPage` |
| `src/features/super-admin/clientes/hooks/useClientes.ts` | **Nadie** |

### 6.2 Acción recomendada

- Eliminar `super-admin/clientes/hooks/useClienteMutations.ts`.
- Eliminar o convertir en re-export de `@/core/hooks/useClientes` el duplicado en feature (misma decisión para consistencia).
- Buscar imports rotos (`grep useClienteMutations`).

### 6.3 Dependencia y fase

| Criterio | Valor |
|----------|-------|
| Dependencia ERR-01 / ERR-02 | **Ninguna** funcional |
| Riesgo | **Muy bajo** (código muerto) |
| Beneficio | Evita divergencia futura; clarifica `@/core/hooks` como única fuente |

**Recomendación:** mismo PR que FIX-ERR-01 y FIX-ERR-02 (coste &lt; 15 min). Posponer solo si el equipo quiere un PR “solo limpieza” separado — **no es necesario** esperar fase 2.

---

## 7. Recomendación única consolidada

### 7.1 Estrategia FIX-ERR-01

**Adoptar A (propagar AxiosError)** como estrategia principal, con:

1. Refactor de `cliente.service.ts` (sin wrap HTTP).
2. Ajuste de banner en `ClientManagementPage` (`getErrorMessage(queryError)`).
3. Ramo opcional en `getErrorMessage` para `Error` de contrato FE (complemento, no reemplazo de A).

**Rechazar B como estrategia principal** porque:

- Perpetúa doble procesamiento y deuda en cada servicio Platform similar.
- Impide `getValidationErrors` en modales sin trabajo extra.
- Desalinea con ORG/Catálogos y §8.5 V2 (una fuente de verdad en consumidor).
- Enmascara `status` HTTP en la capa UI.

### 7.2 Justificación (negocio + técnica)

La auditoría confirmó que el backend enviaba `detail` correcto y el usuario veía genérico: eso coincide exactamente con **pérdida del AxiosError**, no con ausencia de utilidades. A restaura el mismo contrato que ya funciona en ORG y explica por qué Catálogos globales no sufren ERR-01.

### 7.3 Esfuerzo estimado

| Ítem | Esfuerzo | Archivos |
|------|----------|----------|
| FIX-ERR-01-A + adjuncto lista | **0.5–1 día** (incl. QA manual 409/422/create/edit/toggle/lista) | `cliente.service.ts`, `ClientManagementPage.tsx`, opcional `error.service.ts` (ramo FE) |
| FIX-ERR-02 | **2–4 h** | `CreateClientModal.tsx` |
| FIX-ERR-03 | **&lt; 1 h** | eliminar 1–2 hooks duplicados |
| **Total fase 1** | **~1 día dev + QA** | 4–5 archivos |

### 7.4 Riesgo

| Nivel | Descripción | Mitigación |
|-------|-------------|------------|
| **Medio** | Banner lista peor si se olvida adjuncto | Checklist QA: forzar error de listado |
| **Bajo** | Mutaciones / modales | Repetir C-06 / E-05 de cierre B11 |
| **Bajo** | `getClienteStats` | Verificar 404/500 siguen retornando `null` |
| **Muy bajo** | ERR-03 | grep imports |

---

## 8. Plan de fases propuesto

### Fase 1 — Un solo ticket / PR (recomendado)

| ID | Incluir | Orden sugerido |
|----|---------|----------------|
| FIX-ERR-01-A | Servicio sin wrap + banner lista + (opcional) ramo `Error` FE en `getErrorMessage` | 1 |
| FIX-ERR-02 | Create → `useCreateCliente` | 2 |
| FIX-ERR-03 | Borrar hooks duplicados en feature | 3 (paralelo) |

**Criterios de aceptación fase 1:**

- POST create con 409 → toast con mensaje de `detail` (no genérico).
- PUT edit con 422 → toast con mensaje útil; modal abierto.
- Activar / desactivar con error API → toast útil.
- Lista con fallo de red / 403 → banner con `getErrorMessage`, no “Request failed with status code …”.
- Cero toast de error en `CreateClientModal` catch.
- Un solo toast de éxito al crear.
- `grep` sin imports a hooks duplicados en feature.

### Fase 2 — Posterior (fuera de este documento)

- FIX-ERR-04 `getValidationErrors` en modales + navegación a tab.
- FIX-ERR-05 `toastPlatformApiError`.
- `conexion.service.ts` alinear a estrategia A.
- FIX-ERR-07 subdominio silencioso.

---

## 9. Qué no hacer

| Anti-patrón | Motivo |
|-------------|--------|
| Solo B sin A | Cierra síntoma, no arquitectura; bloquea 422 por campo |
| A sin cambiar banner lista | Regresión UX en carga |
| ERR-02 en PR separado semanas después | ER-02 sigue roto; riesgo doble toast al integrar hook |
| Aplicar wrap + A simultáneamente | Redundante |
| Incluir `conexion.service` en mismo PR sin acuerdo | Amplía alcance; mejor ticket Platform-ERR-02 |

---

## 10. Tabla decisión ejecutiva

| Pregunta | Respuesta |
|----------|-----------|
| ¿A o B? | **A** (+ adjuncto lista; ramo `Error` FE opcional) |
| ¿ERR-02 junto o después? | **Junto** (mismo release que ERR-01) |
| ¿ERR-03 junto o después? | **Junto** (mismo PR, trivial) |
| ¿B tiene rol? | Solo parche transitorio global si A se retrasa — **no recomendado** como objetivo |
| ¿Próximo paso tras fase 1? | Ticket implementación UX-PLAT-ERR-REM-01 referenciando este doc |

---

## 11. Referencias cruzadas

| Documento | Relación |
|-----------|----------|
| `PLATFORM_ERROR_EXPERIENCE_AUDIT.md` | Hallazgos UX-PLAT-ERR-01..08, FIX-ERR-01..07 |
| `ERP_FRONTEND_STANDARDS_V2.md` | §8.5 ER-01/02/03, AP-11 |
| `org.service.ts` / `org-api-error.ts` | Patrón referencia A |
| `PLATFORM_CLIENTES_B11_CLOSURE_AUDIT.md` | QA C-06 / E-05 para validar fase 1 |

---

*Fin — PLATFORM_ERROR_REMEDIATION_STRATEGY.md*
