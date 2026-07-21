# Plan de implementación — Alineación conservadora Ola 1 ORG

**Objetivo:** Cumplir contrato Backend **sin refactor**, **sin cambio arquitectural**, **sin PR amplio**.  
**Estrategia:** Compatible dual (manual + auto) — Fase 1 del contrato §4.  
**Fecha:** 2026-07-12

---

## 1. Principios de ejecución

1. **Un PR = un propósito** — preferir PR-1 mergeable antes de UX polish.  
2. **Solo tocar CREATE** — no mezclar cambios en UPDATE/listados.  
3. **Backend desplegado Ola 1** en staging antes de QA auto-sin-código.  
4. **Sin util nueva** salvo necesidad demostrada — lógica inline en `handleCreate`.  
5. **Rollback trivial** — revertir guards + tipos restaura comportamiento legacy.

---

## 2. Fases de implementación

### Fase PR-1 — Alineación mínima obligatoria (MUST SHIP)

**Objetivo:** O-01, O-02, O-07  
**Riesgo:** Bajo  
**Estimación:** 1 sesión dev + smoke QA

| Paso | Tarea | Archivo |
|------|-------|---------|
| 1.1 | Marcar `codigo?` / `codigo_empresa?` en interfaces Create | `org.types.ts` |
| 1.2 | Eliminar guard `codigo*.trim()` en `handleCreate` | 5 páginas |
| 1.3 | Quitar `required` HTML en input código **solo CREATE** | 4 páginas company-scoped |
| 1.4 | Cambiar label `Código *` → `Código` o añadir hint opcional | 5 páginas CREATE |
| 1.5 | Antes de `mutateAsync`: `delete payload.codigo` si vacío (o `codigo_empresa`) | 5 páginas |
| 1.6 | Mantener validaciones no relacionadas (RUC 11 dígitos, `nombre`, `tipo_centro_costo`, `scopeEmpresaId`) | Según página |

**Criterio de aceptación PR-1:**

- [ ] CREATE empresa con solo `{ razon_social, ruc }` → 201  
- [ ] CREATE sucursal con `{ empresa_id, nombre }` → 201  
- [ ] CREATE departamento / CC / cargo sin código → 201  
- [ ] CREATE con código manual único → 201 (regresión legacy)  
- [ ] UPDATE con código → sin cambio comportamiento  
- [ ] Listados muestran código tras refetch  
- [ ] Onboarding `?onboarding=true` permite crear sin código  

**No incluir en PR-1:** ocultar inputs, toasts enriquecidos, field errors 409.

---

### Fase PR-2 — Feedback post-201 (SHOULD)

**Objetivo:** O-03, P-04  
**Riesgo:** Bajo  
**Depende de:** PR-1 mergeado

| Opción | Descripción | Archivos | Preferencia |
|--------|-------------|----------|-------------|
| A (conservadora) | Toast en `handleCreate` tras `mutateAsync` | 5 páginas | ✅ Recomendada |
| B | Toast en `onSuccess` de hooks | 5 hooks | Evitar — toca hooks compartidos |

**Ejemplo opción A (EmpresaPage):**

```typescript
const created = await createEmpresa.mutateAsync(payload);
toast.success(`Empresa creada (${created.codigo_empresa}).`);
```

**Onboarding:** Reemplazar o complementar toast genérico L332 con código asignado.

**Criterio de aceptación PR-2:**

- [ ] Usuario ve código asignado tras alta exitosa  
- [ ] No duplicar toast (hook + página — desactivar uno)  

**Implementación:** Si se enriquece toast en página, **no cambiar** el toast del hook; o viceversa. Evitar doble notificación.

---

### Fase PR-3 — UX objetivo (COULD)

**Objetivo:** P-01, P-02, P-03 del contrato  
**Riesgo:** Bajo-medio (expectativas UX)  
**Depende de:** PR-1

| Tarea | Detalle |
|-------|---------|
| Ocultar input código en CREATE estándar | Mantener en DOM colapsado o `display:none` según política implantación |
| Badge informativo | Texto: «El código se asignará automáticamente al guardar» |
| Sección avanzada | «Código manual (implantación)» colapsada — envía manual si usuario escribe |
| Feature flag | Opcional `ORG_MANUAL_CODE_OVERRIDE` — solo si negocio lo pide |

**No hacer en PR-3:**

- Preview correlativo local (P-05 prohibido — confunde con Backend)  
- Cambiar UPDATE a solo lectura (Fase 3 contrato — futuro BR-M-30)

---

### Fase PR-4 — Errores 409 en campo (COULD)

**Objetivo:** O-05, O-06  
**Riesgo:** Medio  
**Depende de:** PR-1

| Entidad | Mensaje Backend esperado | Campo UI |
|---------|--------------------------|----------|
| Empresa | Código duplicado tenant | `codigo_empresa` |
| Empresa | RUC duplicado | `ruc` |
| Resto | Código duplicado empresa | `codigo` |

**Enfoque conservador:**

1. En `catch` de `handleCreate`, si `axios.isAxiosError` && `status === 409`.  
2. Parsear `detail` string del Backend (mensajes documentados en contrato §03).  
3. `setFieldErrors({ codigo: detail })` — **sin** segundo toast si el error ya se muestra inline.  
4. Revisar norma ER-02: toast solo en `onError` del hook **o** field error en componente — no ambos para mismo error.

**Opción mínima:** Mantener toast global (estado actual) — cumple contrato parcialmente.

---

## 3. Secuencia de QA por entidad

Usar casos del contrato `02_ENTITY_CONTRACTS.md`:

| ID | Entidad | Request | Verificar en UI |
|----|---------|---------|-----------------|
| EMP-01 | Empresa | Sin `codigo_empresa` | 201, código en listado |
| EMP-03 | Empresa | Código dup manual | 409 visible |
| EMP-04 | Empresa | RUC dup | 409 en RUC |
| SUC-01 | Sucursal | Sin código | 201 SUC00N |
| DEP-01 | Departamento | Sin código | 201 |
| CC-01 | Centro costo | Sin código | 201 |
| CAR-01 | Cargo | Sin código + `moneda_salarial` | 201 |
| X-02 | Todas | Manual único | 201 legacy |
| X-04 | Todas | Dos autos seguidos | Correlativos distintos |

**Regresión obligatoria:**

- Editar código en UPDATE  
- Desactivar / reactivar fila  
- Cambio empresa sesión → contador independiente (X-05)  
- Búsqueda `buscar` por código en listado  

---

## 4. Despliegue y coordinación

| Paso | Responsable | Acción |
|------|-------------|--------|
| 1 | Backend | Confirmar Ola 1 en staging/prod target |
| 2 | Frontend PR-1 | Merge tras review mínimo 6 archivos |
| 3 | QA | Casos EMP-01, SUC-01, X-02 |
| 4 | Frontend PR-2+ | Opcional iterativo |

**Coexistencia legacy:** Clientes cuyo FE antiguo envía código manual siguen funcionando — no breaking change.

---

## 5. Definition of Done (Ola 1 Frontend)

### Must (PR-1)

- [ ] 5 formularios CREATE permiten submit sin código  
- [ ] 5 tipos `*Create` reflejan optional  
- [ ] Payload omite clave código cuando vacío  
- [ ] Sin regresión UPDATE/listados/RBAC/rutas  
- [ ] Diff acotado a archivos §2 de `02_FILES_TO_MODIFIY.md`

### Should (PR-2)

- [ ] Código 201 visible al usuario  

### Could (PR-3/4)

- [ ] UX auto-código / manual colapsado  
- [ ] 409 mapeado a campo  

---

## 6. Anti-patrones explícitos (NO hacer)

| Anti-patrón | Razón |
|-------------|-------|
| Refactor común `OrgCreateCodeField` shared | Expande alcance |
| Modificar `org.service.ts` para strip código | Lógica pertenece a página |
| Hacer `codigo` optional en Read types | Contrato Read sin cambio |
| Reservar EMP001 en FE | Bootstrap Backend |
| Pre-calcular SUC001/CAR001 localmente | Motor asigna en 201 |
| Tocar ParametrosPage | MANUAL_ONLY |
| Regenerar OpenAPI en este epic | Fuera de alcance user |

---

## 7. Estimación de esfuerzo

| Fase | Dev | QA |
|------|-----|-----|
| PR-1 | 2–4 h | 1–2 h |
| PR-2 | 1 h | 30 min |
| PR-3 | 2–3 h | 1 h |
| PR-4 | 2–4 h | 1 h |

**Total mínimo viable:** ~ medio día dev + QA smoke.

---

*Riesgos: [`04_RISK_ANALYSIS.md`](04_RISK_ANALYSIS.md)*
