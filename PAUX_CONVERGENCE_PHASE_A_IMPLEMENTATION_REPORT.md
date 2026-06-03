# PAUX_CONVERGENCE_PHASE_A_IMPLEMENTATION_REPORT.md

**Fase:** PAUX-Convergence Phase A (alcance aprobado post-auditoría de filtros)  
**Fecha:** 2026-06-03  
**Baseline:** `PAUX_CONVERGENCE_PHASE_A_IMPLEMENTATION_PLAN.md`, `PAUX_PHASE_A_FILTERS_DECISION_AUDIT.md`

---

## 1. Resumen

Implementación acotada según decisiones confirmadas:

| Ítem | Alcance | Estado |
|------|---------|--------|
| P1-01 | Ocultar filtros Plan y Estado en listado Clientes | ✅ |
| P1-02 | Clientes Todos\|Activos\|Inactivos sin cambios; Catálogos sin cambios; Módulos deferidos | ✅ (sin diff en P1-02) |
| P1-03 | Botón **Editar** en `ClientDetailPage` → `EditClientModal` | ✅ |
| P1-04 | Errores 422 por campo vía `getValidationErrors()` | ✅ |
| P1-05 | Alinear mensajes ER-03 en `error.service.ts` | ✅ |

**Sin cambios:** Dashboard, Auditoría Global, Backend, componentes shared nuevos.

---

## 2. Archivos modificados

| Archivo | Ítem | Cambio |
|---------|------|--------|
| `src/core/services/error.service.ts` | P1-05 | Fallbacks 400/422 sin «rojo»; copy coherente en `getValidationErrors` |
| `src/core/services/__tests__/error.service.test.ts` | P1-05 | +4 tests `getValidationErrors`; asserts ER-03 |
| `src/features/super-admin/clientes/pages/ClientManagementPage.tsx` | P1-01 | Eliminados `<select>` Plan y Estado; mantiene Todos\|Activos\|Inactivos |
| `src/features/super-admin/clientes/pages/ClientDetailPage.tsx` | P1-03 | `EditClientModal` + `onClick` Editar + refresh post-guardado |
| `src/features/super-admin/clientes/components/CreateClientModal.tsx` | P1-04 | `getValidationErrors` en catch de `mutateAsync` |
| `src/features/super-admin/clientes/components/EditClientModal.tsx` | P1-04 | Idem en edición |
| `src/features/super-admin/modulos/components/CreateModuleModal.tsx` | P1-04 | `fieldErrors` + toast desde `getValidationErrors` |
| `src/features/super-admin/modulos/components/EditModuleModal.tsx` | P1-04 | Idem |
| `src/features/super-admin/catalogos/pages/PaisesPage.tsx` | P1-04 | `fieldErrors` / `editFieldErrors` + `border-error` |
| `src/features/super-admin/catalogos/pages/MonedasPage.tsx` | P1-04 | Idem |
| `src/features/super-admin/catalogos/pages/DepartamentosPage.tsx` | P1-04 | Idem |
| `src/features/super-admin/catalogos/pages/ProvinciasPage.tsx` | P1-04 | Idem |
| `src/features/super-admin/catalogos/pages/DistritosPage.tsx` | P1-04 | Idem |

**No modificados (confirmado):** `src/features/super-admin/dashboard/**`, `src/features/super-admin/auditoria/**`, backend, `cliente.service.ts` (sin snapshot FE).

---

## 3. QA ejecutado

| ID | Verificación | Resultado |
|----|--------------|-----------|
| QA-01 | Unit tests `error.service.test.ts` | ✅ 11/11 |
| QA-02 | Typecheck/lint archivos tocados | ✅ Sin errores TS nuevos |
| QA-03 | Revisión estática wiring Editar detalle | ✅ Modal montado con `cliente` actual |
| QA-04 | Revisión estática ocultación filtros | ✅ Solo queda select Registro |
| QA-05 | Patrón 422 alineado a `EmpresaPage.tsx` | ✅ Misma función `getValidationErrors` |

**Pendiente manual (runtime con API):** simular 422 en crear/editar cliente y catálogo para validar borde rojo en campo real.

---

## 4. Casos 422 validados

### 4.1 Automatizado (unit)

| Caso | Entrada | Expectativa | Resultado |
|------|---------|-------------|-----------|
| V-01 | 422 + `detail[]` con `loc` | `fieldErrors.contacto_email` poblado | ✅ |
| V-02 | 422 sin `detail` | Mensaje `'Los datos enviados no son válidos.'` | ✅ |
| V-03 | 422 + item con `loc` | `fieldErrors.razon_social` + mensaje Pydantic | ✅ |
| V-04 | 400 sin detail | `'Los datos enviados son incorrectos.'` | ✅ |
| V-05 | 400/422 fallback | Sin substring «rojo» | ✅ |

### 4.2 Integración FE (patrón aplicado)

| Superficie | Handler | UI campo |
|------------|---------|----------|
| CreateClientModal | catch → `setErrors` merge | `border-error` existente |
| EditClientModal | catch → `setErrors` merge | `border-error` existente |
| CreateModuleModal / EditModuleModal | catch → `setErrors` | `errors[name]` existente |
| Catálogos ×5 | catch → `fieldErrors` / `editFieldErrors` | `inputClass(key)` → `border-error` |

---

## 5. Validación botón Editar (P1-03)

| Paso | Comportamiento esperado | Implementación |
|------|-------------------------|----------------|
| 1 | Botón Editar en header detalle tiene acción | `onClick={() => setIsEditModalOpen(true)}` |
| 2 | Abre `EditClientModal` con cliente cargado | `cliente={cliente}` |
| 3 | Tras guardar exitoso cierra modal y refresca | `handleEditSuccess` → `fetchClienteData()` |
| 4 | Reutiliza modal existente de listado | Mismo componente `EditClientModal` |

---

## 6. Confirmación ocultación Plan y Estado (P1-01)

En `ClientManagementPage.tsx`:

- **Eliminados:** selects «Todos los planes» y «Todos los estados».
- **Conservado:** select Registro `Todos | Activos | Inactivos` (`activeFilter`).
- **Sin snapshot FE** ni params nuevos en servicio.
- Columna tabla «Plan/Estado» **sin cambio** (solo lectura; no es filtro).

---

## 7. P1-05 — Mensajes ER-03

| HTTP | Condición | Mensaje |
|------|-----------|---------|
| 400 | sin fieldErrors | `Los datos enviados son incorrectos.` |
| 422 | sin fieldErrors | `Los datos enviados no son válidos.` |
| 400/422 | con fieldErrors (sin detail string) | `Revisa los campos indicados en el formulario.` |
| 422 | detail array (toast global) | Concat msgs Pydantic (sin prometer «rojo» si no hay UI) |

Eliminado copy «Revisa los campos marcados en rojo» de fallbacks genéricos.

---

## 8. Incidencias encontradas

| # | Severidad | Descripción | Resolución |
|---|-----------|-------------|------------|
| I-01 | Info | Filtros Plan/Estado nunca llegaron al API (`cliente.service`) | Ocultación UI suficiente; sin cambio servicio |
| I-02 | Info | `filters` state en listado queda `{}` permanente | Aceptable; usado solo en empty-state check |
| I-03 | Info | QA runtime 422 requiere backend o mock Axios | Documentado como pendiente manual |

**Bloqueantes:** ninguno.

---

## 9. Commits generados

| Commit | Mensaje |
|--------|---------|
| `464fa75` | `fix(platform): PAUX Phase A — editar detalle, 422 por campo, ER-03, ocultar filtros plan/estado` |
| `0b74386` | `docs: hash commit en reporte PAUX Phase A` |

---

## 10. Criterios de cierre Phase A (alcance aprobado)

| CA | Estado |
|----|--------|
| P1-01 filtros Plan/Estado ocultos | ✅ |
| P1-02 sin regresión filtros Clientes/Catálogos; Módulos deferidos | ✅ |
| P1-03 Editar funcional en detalle | ✅ |
| P1-04 422 por campo en modales scope | ✅ |
| P1-05 ER-03 alineado | ✅ |
| Dashboard / Auditoría / Backend intactos | ✅ |

**Phase A (alcance aprobado): cerrada en FE.**
