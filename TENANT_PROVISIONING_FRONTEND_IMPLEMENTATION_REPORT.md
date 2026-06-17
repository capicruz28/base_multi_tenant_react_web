# Reporte de implementación — Historia A (Provisionamiento de Tenant)

**Versión:** 1.0  
**Fecha:** 2026-06-08  
**Alcance ejecutado:** Historia A P0 únicamente  
**Referencias:** `TENANT_PROVISIONING_FRONTEND_PRE_IMPLEMENTATION_REVIEW.md`, `TENANT_PROVISIONING_AND_FORCE_PASSWORD_CHANGE_FINAL_ARCHITECTURE_REVIEW.md`

---

## 1. Resumen

Se implementó el flujo de **provisionamiento con revelación única de credenciales** alineado al contrato OpenAPI `ClienteCreateResponse`. El superadmin ve usuario y contraseña temporal inmediatamente tras crear un tenant, con copia al portapapeles, acknowledgment obligatorio y confirmación antes de cerrar sin guardar.

**No se modificó:** AuthContext, ProtectedRoute, Login, ChangePasswordPage, axios-instances, SmartRedirect, ClientManagementPage, useCreateCliente, módulos ERP.

**No se implementó:** PDF, email, regeneración de contraseña, tests de service (P1).

---

## 2. Archivos modificados

| Archivo | Cambios |
|---------|---------|
| `src/features/super-admin/clientes/types/cliente.types.ts` | +`CredencialesInicialesRead`, `ClienteCreateResponse`, `ClienteCreateResult` |
| `src/features/super-admin/clientes/services/cliente.service.ts` | +`provisionCliente()` con validación de `data` + `credenciales_iniciales.contrasena`; `createCliente` **sin cambios** |
| `src/features/super-admin/clientes/components/CreateClientModal.tsx` | Fases `form` \| `reveal`; `useProvisionCliente`; deferir `onSuccess`/`onClose` hasta acknowledgment |

---

## 3. Archivos nuevos

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/features/super-admin/clientes/hooks/useProvisionCliente.ts` | Mutación feature; invalida `['clientes', tenantId]`; sin toast en éxito |
| `src/features/super-admin/clientes/components/ClientCredentialsRevealModal.tsx` | Revelación única; copiar usuario/contraseña/bloque; checkbox ack; `ConfirmDialog` al cerrar sin confirmar; limpieza vía callback |

### Documentación

| Archivo | Estado |
|---------|--------|
| `TENANT_PROVISIONING_FRONTEND_PRE_IMPLEMENTATION_REVIEW.md` | Generado pre-implementación |
| `TENANT_PROVISIONING_FRONTEND_IMPLEMENTATION_REPORT.md` | Este documento |

---

## 4. Decisiones tomadas

### 4.1 Método `provisionCliente` separado

`createCliente` permanece tipado como `ClienteResponse` y retorna solo `Cliente` para no romper `useCreateCliente` (core). El flujo de creación en UI usa exclusivamente `provisionCliente`.

### 4.2 Estado efímero en memoria

`provisionResult` vive en `useState` de `CreateClientModal`. Se limpia en `handleRevealComplete` y cuando `isOpen` pasa a `false`. No hay persistencia en localStorage, sessionStorage ni React Query cache.

### 4.3 Fases internas al modal

En lugar de modificar `ClientManagementPage`, `CreateClientModal` alterna:

- **form** — wizard existente
- **reveal** — `ClientCredentialsRevealModal` a pantalla completa (z-index 60)

`onSuccess()` del page se invoca solo tras cierre confirmado del reveal.

### 4.4 Toast de éxito

`useProvisionCliente` no muestra toast en `onSuccess` (evita duplicado). El toast de éxito se emite al pulsar **Finalizar** con acknowledgment marcado.

### 4.5 Validación de contrato en service

`provisionCliente` lanza error explícito si faltan `data`, `credenciales_iniciales` o `contrasena` vacía — coherente con OpenAPI (`credenciales_iniciales` required; `contrasena` required en schema).

### 4.6 Formato bloque completo

```
Cliente: {razon_social}
Subdominio: {subdominio}
Usuario administrador: {nombre_usuario}
Contraseña temporal: {contrasena}
Nota: El administrador debe cambiar la contraseña en el primer acceso.
```

(solo la nota si `requiere_cambio === true`)

---

## 5. Diferencias respecto a la revisión pre-implementación

| Tema | Revisión | Implementación |
|------|----------|----------------|
| `createCliente` sin cambios | Confirmado | Cumplido — método original intacto |
| `useProvisionCliente` sin toast éxito | Planificado | Cumplido |
| `ClientManagementPage` sin cambios | Confirmado | Cumplido |
| Delegación `createCliente` → `provisionCliente` | No planificada | **No aplicada** — métodos independientes |
| Tests `cliente.service.test.ts` | P1 | No implementados (fuera P0) |

Sin desviaciones funcionales respecto al alcance aprobado.

---

## 6. Riesgos remanentes

| Riesgo | Severidad | Estado |
|--------|-----------|--------|
| Clipboard falla en contexto no-HTTPS | Baja | Toast de error; usuario puede copiar manualmente |
| Usuario cierra con "Cerrar de todos modos" sin guardar | Media | ConfirmDialog advierte; comportamiento esperado |
| `useCreateCliente` huérfano en core | Baja | Sin consumidores tras migración del modal; hook intacto por política |
| Tests de service desactualizados | Baja | P1 — no cubren `provisionCliente` |
| QA E2E no ejecutada en esta sesión | Media | Requiere backend + superadmin |
| Historia B sin regresión | Baja | Sin cambios en archivos auth |

---

## 7. Verificación estática ejecutada

| Prueba | Resultado |
|--------|-----------|
| Linter archivos Historia A | Sin errores |
| TypeScript archivos nuevos/modificados | Sin errores nuevos |
| Restricciones de alcance | Cumplidas |
| OpenAPI alineado (`ClienteCreateResponse`, `CredencialesInicialesRead`) | Tipos reflejan schema |

---

## 8. Checklist de QA manual

### Creación y revelación

- [ ] Crear tenant → aparece modal de credenciales (no cierre automático)
- [ ] Usuario y contraseña visibles (toggle mostrar/ocultar contraseña)
- [ ] Copiar usuario funciona
- [ ] Copiar contraseña funciona
- [ ] Copiar bloque completo funciona
- [ ] Finalizar deshabilitado sin acknowledgment
- [ ] Cerrar sin ack → diálogo de confirmación
- [ ] Tras ack + Finalizar → modal cierra; lista de clientes refresca

### Seguridad / memoria

- [ ] F5 durante reveal → credenciales no persisten
- [ ] No hay credenciales en Local Storage / Session Storage
- [ ] GET cliente por id no devuelve contraseña

### Regresión

- [ ] Error 422/400 en create → errores en formulario, sin reveal
- [ ] Cancelar form con cambios → discard dialog intacto
- [ ] Editar cliente sin cambios
- [ ] Force password change (Historia B) sin regresión

### Exclusiones P0

- [ ] PDF no disponible (esperado)
- [ ] Regenerar contraseña no disponible (esperado)
- [ ] Email no enviado (esperado)

---

## 9. Integración con Historia B

Tras provisionamiento, `credenciales.requiere_cambio: true` alinea con el flujo Force Password Change ya implementado (P0): el admin del tenant deberá cambiar contraseña en primer login. No se requirieron cambios adicionales en auth para esta fase.

---

**Fin del reporte. Historia A P0 completada.**
