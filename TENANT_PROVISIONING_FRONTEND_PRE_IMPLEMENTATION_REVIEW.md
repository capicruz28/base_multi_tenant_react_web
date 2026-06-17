# Revisión pre-implementación — Historia A (Provisionamiento de Tenant)

**Versión:** 1.0  
**Fecha:** 2026-06-08  
**Referencias:** `TENANT_PROVISIONING_AND_FORCE_PASSWORD_CHANGE_FINAL_ARCHITECTURE_REVIEW.md`, `docs/backend_openapi.json`  
**Alcance:** Historia A P0 únicamente (sin PDF, email, regeneración, P1)

---

## 1. Veredicto

La arquitectura aprobada **sigue siendo válida** tras re-auditar el código actual. El flujo puede implementarse con el **alcance reducido** sin modificar `ClientManagementPage`, `useCreateCliente` ni capas core/auth.

| Criterio | Estado |
|----------|--------|
| Backend devuelve `ClienteCreateResponse` con `credenciales_iniciales` | Confirmado en OpenAPI |
| FE descarta credenciales hoy | Confirmado — `createCliente` retorna solo `data.data` |
| Contraseña no recuperable posteriormente | Confirmado — sin endpoint de lectura/regeneración |
| Arquitectura autocontenida en modal + feature hook | Viable |
| Restricciones del usuario (no Auth, no ERP, no storage) | Cumplibles |

**Autorización para implementar P0:** Sí.

---

## 2. Evidencia de auditoría (estado actual)

### 2.1 Punto de pérdida de credenciales

```78:84:src/features/super-admin/clientes/services/cliente.service.ts
  async createCliente(clienteData: ClienteCreate): Promise<Cliente> {
    const { data } = await api.post<ClienteResponse>(`${BASE_URL}/`, clienteData);
    if (data.data) {
      return data.data;
    }
    throw new Error('Respuesta del servidor sin datos del cliente');
  },
```

- Tipa `ClienteResponse` (sin `credenciales_iniciales`)
- Descarta el bloque hermano de `data`

### 2.2 Flujo UI actual

```252:256:src/features/super-admin/clientes/components/CreateClientModal.tsx
    try {
      await createMutation.mutateAsync(dataToSend);
      onSuccess();
      onClose();
```

- Usa `useCreateCliente` (core)
- Cierra inmediatamente tras éxito — sin revelación

### 2.3 Acoplamiento

| Consumidor | Archivo |
|------------|---------|
| `useCreateCliente` | Solo `CreateClientModal.tsx` |
| `CreateClientModal` | Solo `ClientManagementPage.tsx` |

`ClientManagementPage` solo pasa `onSuccess={handleCreateSuccess}` que cierra el modal. **No necesita cambios** si `onSuccess` se invoca tras acknowledgment (comportamiento externo idéntico).

### 2.4 Contrato OpenAPI (extracto validado)

**`ClienteCreateResponse`** — required: `message`, `data`, `credenciales_iniciales`  
**`CredencialesInicialesRead`** — required: `contrasena`; optional: `nombre_usuario` (default `admin`), `requiere_cambio` (default `true`)

---

## 3. Archivos exactos a modificar

| # | Archivo | Cambios P0 |
|---|---------|------------|
| 1 | `src/features/super-admin/clientes/types/cliente.types.ts` | +`CredencialesInicialesRead`, `ClienteCreateResponse`, `ClienteCreateResult` |
| 2 | `src/features/super-admin/clientes/services/cliente.service.ts` | +`provisionCliente()` con parseo completo y validación; `createCliente` **sin cambio** (compat `useCreateCliente`) |
| 3 | `src/features/super-admin/clientes/components/CreateClientModal.tsx` | Fase `form` \| `reveal`; `useProvisionCliente`; deferir `onSuccess`/`onClose` |
| 4 | `src/features/super-admin/clientes/hooks/useProvisionCliente.ts` | **Nuevo** — mutación feature, invalidación RQ, sin toast éxito |
| 5 | `src/features/super-admin/clientes/components/ClientCredentialsRevealModal.tsx` | **Nuevo** — revelación única, clipboard, acknowledgment, confirmación cierre |

**Total: 3 modificados + 2 nuevos**

---

## 4. Archivos nuevos

| Archivo | Responsabilidad |
|---------|-----------------|
| `hooks/useProvisionCliente.ts` | `useMutation<ClienteCreateResult, Error, ClienteCreate>`; `invalidateQueries(['clientes', tenantId])`; errores vía `getErrorMessage` |
| `components/ClientCredentialsRevealModal.tsx` | UI bloqueante post-creación; copiar usuario/contraseña/bloque; checkbox acknowledgment; `ConfirmDialog` si cierre sin confirmar; limpieza al cerrar |

---

## 5. Archivos explícitamente NO modificados

| Archivo | Razón |
|---------|-------|
| `ClientManagementPage.tsx` | `onSuccess` sigue cerrando modal; timing cambia solo dentro de `CreateClientModal` |
| `useCreateCliente` (`core/hooks/useClienteMutations.ts`) | Queda intacto; `CreateClientModal` deja de importarlo |
| `AuthContext`, `ProtectedRoute`, `Login`, `ChangePasswordPage` | Restricción usuario |
| `axios-instances.ts`, `SmartRedirect` | Restricción usuario |
| Módulos ERP | Restricción usuario |
| `cliente.service.test.ts` | P1 — fuera de alcance P0 |

---

## 6. Dependencias entre archivos

```text
cliente.types.ts
    ├── cliente.service.ts (+ provisionCliente)
    │       └── useProvisionCliente.ts
    └── ClientCredentialsRevealModal.tsx
            └── CreateClientModal.tsx (orquesta fases)
                    └── ClientManagementPage.tsx (sin cambios — props iguales)
```

**Dependencias externas:** `useTenant` (tenantId para invalidación RQ — ya usado en `useCreateCliente`), `ConfirmDialog`, `getErrorMessage` / `getValidationErrors`.

**Sin dependencias sobre:** AuthContext, routing global, Zustand nuevo, storage persistente.

---

## 7. Flujo final validado (P0)

```text
Superadmin abre CreateClientModal (fase: form)
        │
        ▼
POST /clientes/ → ClienteCreateResponse
        │
        ▼
provisionCliente() → ClienteCreateResult
        │
        ▼
invalidateQueries clientes (hook)
        │
        ▼
CreateClientModal → fase: reveal
  ClientCredentialsRevealModal
    • muestra credenciales (memoria React)
    • copiar usuario / contraseña / bloque
    • checkbox acknowledgment obligatorio
    • cierre sin ack → ConfirmDialog
        │
        ▼ (ack + cerrar)
limpiar estado credenciales
onSuccess() → ClientManagementPage cierra modal
onClose()
```

---

## 8. Riesgos de regresión

| ID | Riesgo | Prob. | Mitigación P0 |
|----|--------|-------|---------------|
| A-R1 | Toast duplicado | Media | `useProvisionCliente` sin toast en `onSuccess`; toast único al cerrar con ack |
| A-R2 | Modal cierra antes de reveal | Alta | No llamar `onClose`/`onSuccess` hasta acknowledgment |
| A-R3 | Credenciales en logs | Media | Prohibir `console.log` de `contrasena`; no incluir en errores |
| A-R4 | Credenciales en RQ cache | Baja | No almacenar en `queryKey` ni `setQueryData` |
| A-R5 | Credenciales en localStorage | Baja | Solo `useState` efímero; `null` al cerrar |
| A-R6 | Discard dialog en fase reveal | Media | `isDirty=false` cuando `phase==='reveal'`; confirmación propia en reveal |
| A-R7 | `createCliente` legacy sin credenciales | Baja | `provisionCliente` es método nuevo; `useCreateCliente` sin uso en create flow |
| A-R8 | Lista no refresca | Baja | Invalidación RQ en `useProvisionCliente` (misma key que antes) |

**Riesgo cero esperado en:** `ClientManagementPage`, `EditClientModal`, Auth, ERP, routing.

---

## 9. Confirmación: `ClientManagementPage` no requiere cambios

**Confirmado.**

- Props de `CreateClientModal` permanecen: `isOpen`, `onClose`, `onSuccess`, `onDiscardPendingChange`
- `handleCreateSuccess` solo hace `setIsCreateModalOpen(false)` — se ejecutará **después** del acknowledgment
- `handleCreateModalClose` sin cambios — cierre manual del form sigue funcionando
- No hay necesidad de pasar credenciales hacia arriba

---

## 10. Confirmación: `useCreateCliente` puede permanecer intacto

**Confirmado.**

Justificación técnica:

1. Único consumidor actual es `CreateClientModal`, que migrará a `useProvisionCliente`
2. `useCreateCliente` sigue llamando `createCliente()` → `Cliente` — firma sin cambio
3. Nuevo método `provisionCliente()` evita romper el hook core
4. Mantener el hook core facilita rollback y posible reutilización futura (tests, scripts)

No hay evidencia técnica irrefutable que obligue a modificar `useCreateCliente`.

---

## 11. Checklist de validación manual (post-implementación)

### Creación y revelación

- [ ] Crear tenant → aparece modal de credenciales (no cierre automático)
- [ ] Usuario y contraseña visibles
- [ ] Copiar usuario funciona
- [ ] Copiar contraseña funciona
- [ ] Copiar bloque completo funciona
- [ ] Botón cerrar deshabilitado sin acknowledgment
- [ ] Cerrar sin ack → diálogo de confirmación
- [ ] Tras ack + cerrar → modal create cierra; lista refresca

### Seguridad / memoria

- [ ] F5 durante reveal → credenciales no persisten (modal cerrado o vacío)
- [ ] No hay credenciales en Application > Local Storage / Session Storage
- [ ] GET cliente por id no muestra contraseña (regresión backend)

### Regresión

- [ ] Editar cliente sin cambios
- [ ] Error 422 en create → formulario con errores, sin reveal
- [ ] Cancelar form dirty → discard dialog intacto
- [ ] Historia B (force password) sin regresión

---

**Fin de revisión pre-implementación. Proceder a implementación P0.**
