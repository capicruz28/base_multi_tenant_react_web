# Análisis de riesgos — Motor de Códigos ORG Ola 1 Frontend

**Audiencia:** Frontend + QA + Release  
**Fecha:** 2026-07-12

---

## 1. Matriz de riesgos

| ID | Riesgo | Prob. | Impacto | Severidad | Mitigación |
|----|--------|-------|---------|-----------|------------|
| R-01 | Backend Ola 1 no desplegado — CREATE sin código falla 422 | Media | Alta | **Alta** | Gate deploy Backend; QA en staging |
| R-02 | Onboarding bloqueado (estado **actual**) | Alta | Alta | **Alta** | Priorizar EmpresaPage en PR-1 |
| R-03 | Regresión UPDATE código | Baja | Media | Media | No editar `handleUpdate` ni modales EDIT |
| R-04 | Doble toast éxito/error | Media | Baja | Baja | ER-02: un solo origen toast |
| R-05 | Payload envía `codigo: ""` en lugar de omitir | Alta | Baja | Baja | `delete` explícito pre-submit |
| R-06 | TypeScript strict — spread con optional | Baja | Baja | Baja | Tipar payload local si necesario |
| R-07 | Dirty guard falso positivo | Baja | Baja | Baja | Baseline ya vacío; probar discard |
| R-08 | 409 no mapeado a campo — UX pobre | Media | Baja | Baja | PR-4 opcional; toast actual aceptable |
| R-09 | Confusión CatDepartamento vs ORG Departamento | Baja | Media | Baja | Scope review — solo `features/org` |
| R-10 | Impersonación / cambio empresa — contador | Baja | Media | Baja | QA caso X-05, X-06 |
| R-11 | cfg secuencia ausente 404 | Muy baja | Media | Baja | Mensaje soporte; no workaround FE |
| R-12 | PR scope creep — refactor shared | Media | Alta | **Alta** | Checklist archivos §02; review estricto |

---

## 2. Riesgos de regresión por área

### 2.1 Formularios CREATE

| Escenario | Antes fix | Tras PR-1 | Riesgo residual |
|-----------|-----------|-----------|-----------------|
| Submit sin código | Bloqueado cliente | 201 Backend | R-01 si Backend viejo |
| Submit código manual | 201 | 201 | Nulo |
| Submit código dup | 409 Backend | 409 | R-08 presentación |
| Campos required restantes | OK | OK | Nulo si no se tocan |

### 2.2 Formularios UPDATE

| Escenario | Riesgo |
|-----------|--------|
| Cambiar código existente | **Nulo** — no tocar UPDATE |
| Quitar required EDIT por error | **Alto** — prohibido en PR-1 |
| 409 dup en UPDATE | Existente — sin cambio |

### 2.3 Listados y búsqueda

| Escenario | Riesgo |
|-----------|--------|
| Columna código vacía tras create | **Bajo** — invalidación query existente |
| Sort por código | **Nulo** |
| FK selects (padre, CC, sucursal) | **Nulo** — usan Read |

### 2.4 Onboarding / Auth

| Escenario | Riesgo |
|-----------|--------|
| Primera empresa sin código | **Resuelto** por PR-1 |
| `completeEmpresaSelection(created.empresa_id)` | **Nulo** — usa id, no código |
| Toast bienvenida sin código | **Cosmético** — PR-2 |

### 2.5 Multiempresa JWT

| Escenario | Riesgo |
|-----------|--------|
| `empresa_id` body ≠ sesión 403 | **Nulo** — `assertBodyEmpresaMatchesSession` intacto |
| CREATE sin empresa activa | **Nulo** — guards `scopeEmpresaId` se mantienen |

---

## 3. Riesgos de romper otros módulos

### 3.1 Consumidores de tipos ORG Read (seguros)

Módulos que importan `Empresa`, `Sucursal`, `Cargo`, `CentroCosto` para selects/listados:

- INV (`AlmacenesPage`, `ProductosPage`, …)
- FIN, HCM, MFG, LOG, PUR, SLS, PM, QMS, …

**Impacto cambio `*Create` optional:** **Ninguno** — no importan interfaces Create.

### 3.2 Consumidores de servicios ORG (seguros)

`empresaService.list`, `sucursalService.list`, `cargoService.list`, etc. — solo GET.  
**Sin impacto.**

### 3.3 Reexports org utilities

| Consumidor | Archivo ORG | Riesgo |
|------------|-------------|--------|
| INV form-dirty | `org-form-dirty.helpers` | Nulo |
| INV discard | `OrgDiscardConfirmDialog` | Nulo |
| Super-admin auditoría | `OrgToolbarSearch` | Nulo |

### 3.4 Account / perfil

`account-profile-display.utils.ts` lee `codigo_empresa` de `empresas_disponibles`.  
**Sin impacto** — datos Read post-create.

---

## 4. Dependencias compartidas — análisis de acoplamiento

```
┌─────────────────────────────────────────────────────────┐
│  Páginas ORG (ÚNICO punto de cambio PR-1)               │
│  EmpresaPage, SucursalesPage, DepartamentosPage,          │
│  CentrosCostoPage, CargosPage                           │
└───────────────────────────┬─────────────────────────────┘
                            │ mutateAsync(payload)
                            ▼
┌─────────────────────────────────────────────────────────┐
│  Hooks useCreate*  ──►  org.service.create  ──►  API    │
│  (opcional toast PR-2)      (NO MODIFICAR)              │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│  org.types.ts *Create  (MODIFICAR PR-1)                 │
└─────────────────────────────────────────────────────────┘
```

**Hooks que NO deben alterarse en PR-1:** gates, scope, modal dirty, tenant query.

---

## 5. Componentes reutilizables — superficie de impacto

| Componente | ¿Riesgo si se modifica por error? | Veredicto |
|------------|-----------------------------------|-----------|
| `OrgDiscardConfirmDialog` | Alto — afecta INV + ORG | **No tocar** |
| `OrgSessionEmpresaField` | Alto — patrón ME-05 | **No tocar** |
| `OrgCompanyToolbar` | Medio — muchos módulos | **No tocar** |
| `ConfirmDialog` | Alto — global | **No tocar** |

Cambios UX de código deben ser **locales al JSX del modal CREATE** en cada página.

---

## 6. Riesgos de datos / negocio

| Caso | Descripción | Acción FE |
|------|-------------|-----------|
| EMP001 reservado | Bootstrap crea EMP001; primer user auto = EMP002 | No reservar en FE |
| Manual implantación | Cliente migra códigos legacy | Mantener input manual opcional (PR-3) |
| Colisión manual vs auto | Usuario ingresa SUC001 existente | 409 — Backend atómico |
| Cambio prefijo tenant | Futuro admin cfg | No implementar preview Ola 1 |

---

## 7. Riesgos de testing

| Gap | Consecuencia | Mitigación |
|-----|--------------|------------|
| 0 tests ORG automatizados | Regresión silent | QA manual casos contrato |
| Sin e2e onboarding | Bloqueo producción | Test manual EMP-01 onboarding |
| Backend no disponible local | Falso negativo | Staging obligatorio |

**Tests unitarios opcionales** — no bloquean PR-1 dado precedente del módulo.

---

## 8. Plan de rollback

| Nivel | Acción | Tiempo |
|-------|--------|--------|
| L1 | Revert PR Frontend | Minutos |
| L2 | FE legacy envía código manual | Inmediato — Backend compatible |
| L3 | Flag `ORG_AUTO_CODE_CREATE=OFF` | Solo si se implementó en PR-3 |

Backend Ola 1 **no requiere rollback** para coexistir con FE legacy.

---

## 9. Señales de alerta post-deploy

| Síntoma | Causa probable | Respuesta |
|---------|----------------|-----------|
| Toast «Completa código…» | PR-1 incompleto | Verificar guards |
| 422 missing codigo | Backend pre-Ola 1 | Coordinar deploy |
| 201 pero código blank en tabla | Invalidación query | Verificar invalidate hooks |
| Doble toast | PR-2 hook + página | Eliminar uno |
| CREATE OK pero onboarding falla | Auth flow | Independiente — revisar `empresa_id` |

---

## 10. Veredicto final de riesgo

| Dimensión | Nivel |
|-----------|-------|
| Riesgo técnico implementación PR-1 | **Bajo** |
| Riesgo regresión cross-module | **Muy bajo** |
| Riesgo operacional (deploy orden) | **Medio** |
| Riesgo estado actual sin fix | **Alto** (onboarding / auto-código bloqueado) |

**Recomendación:** Proceder con PR-1 de forma inmediata tras aprobación documental. Mantener scope en **6 archivos**. Postergar PR-3/PR-4 hasta validar PR-1 en staging.

---

*Referencias: [`01_IMPACT_ANALYSIS.md`](01_IMPACT_ANALYSIS.md) · [`03_IMPLEMENTATION_PLAN.md`](03_IMPLEMENTATION_PLAN.md)*
