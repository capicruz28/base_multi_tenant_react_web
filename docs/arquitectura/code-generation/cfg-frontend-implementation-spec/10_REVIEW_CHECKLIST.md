# CFG — Review Checklist por Wave

**Versión:** 1.0  
**Uso:** reviewer marca antes de aprobar PR

---

## Review — Wave 0

- [ ] Types sin `cliente_id` en Read
- [ ] `CFG_PERMISSIONS` códigos exactos
- [ ] `SECUENCIAS_LIST_CONFIG.forcePagination === true`
- [ ] `ERP_MODULES` entrada CFG correcta
- [ ] `ERP_ROUTE_SEGMENTS` incluye `cfg`
- [ ] `app-route-tree`: path `cfg/*` + `PermissionGuard module="cfg" action="ver"`
- [ ] Stub page sin fetch Axios
- [ ] Sin imports FCE
- [ ] tsc OK

---

## Review — Wave 1

- [ ] 6 métodos service + operationIds
- [ ] Paths bajo `/api/v1/cfg/secuencias`
- [ ] update no acepta/documenta `es_activo`
- [ ] preview sin body
- [ ] form utils dirty-only payload
- [ ] error utils mapea códigos contrato
- [ ] display nunca muestra UUID
- [ ] Tests P0 service/utils verdes
- [ ] Page/hooks aún no consumen service desde UI (salvo que W1 no toque page)

---

## Review — Wave 2

- [ ] Keys según Spec/Blueprint
- [ ] List usa `useErpListQuery` + config
- [ ] Sin company query gate
- [ ] Mutations toast onSuccess/onError (ER-02)
- [ ] Preview **no** invalida list
- [ ] `invalidateCfgQueries` en 3 archivos auth (junto ORG/INV)
- [ ] Hook tests P0 verdes
- [ ] No JSX en hooks

---

## Review — Wave 3

- [ ] Sin botón Crear
- [ ] Sin filtro `empresa_id` / “Todas las empresas”
- [ ] Toolbar + empty + skeleton + pagination
- [ ] Badges correcta semántica
- [ ] Gate `consultar` → unauthorized
- [ ] Sin dialogs edit/preview aún (según Spec W3)
- [ ] Tokens Capa 1; brand solo si hubiera CTA (no hay create)
- [ ] Page test smoke

---

## Review — Wave 4

- [ ] Edit dialog GET detail on open
- [ ] Readonly si !canUpdate o locked
- [ ] PATCH solo campos formato
- [ ] Dirty B11 + OrgDiscard
- [ ] B11-10/11: cerrar Edit antes Confirm
- [ ] RB-ROW Desactivar/Reactivar
- [ ] Vocabulario correcto
- [ ] Field errors 422
- [ ] Dialog permanece tras save OK
- [ ] Tests P1

---

## Review — Wave 5

- [ ] Preview disclaimer siempre
- [ ] Copy no promete reserva
- [ ] Preview not allowed → hide
- [ ] Inactive hint
- [ ] No list invalidate on preview
- [ ] a11y aria-labels acciones
- [ ] Responsive overflow tabla
- [ ] Checklist contrato FE 07 A–J revisado
- [ ] DoD módulo

---

## Riesgos de implementación (reviewer alerta)

| Riesgo | Señales en PR |
|--------|---------------|
| Company gate copiado | `useInvCompanyQueryGate` en cfg |
| FCE acoplado | import `@/core/codigo` |
| Create UI | botón Nuevo / POST create |
| Toast duplicado | toast en page catch + hook |
| UUID UI | `secuencia_id` en celda/title |
| Preview invalidate | invalidate en usePreview onSuccess |
