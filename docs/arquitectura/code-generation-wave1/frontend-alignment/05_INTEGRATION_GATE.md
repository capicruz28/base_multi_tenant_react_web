# Integration Gate — PR-1 Backend ↔ Frontend (Ola 1 ORG)

**Etapa:** Revisión de integración documental y funcional (sin ejecución runtime)  
**Fecha:** 2026-07-12  
**Estado PR-1:** Congelado — 6 archivos  
**Fuente contrato:** `codigo-generation-wave1/frontend-contract/` (00–04)  
**Implementación revisada:** PR-1 (tipos optional + CREATE sin código obligatorio + omit propiedad vacía)

---

## Veredicto

# APROBADO

**Alcance del veredicto:** PR-1 cumple los requisitos obligatorios del contrato Backend para el camino CREATE sin código (`O-01`, `O-02`, `O-04`, `O-07`).  
**No implica** cierre de Ola 1 completa: items `O-03`, `O-05`, `O-06` permanecen pendientes para PR-2/PR-4 (ver §8).

---

## 1. Metodología de revisión

| Aspecto | Método |
|---------|--------|
| Código PR-1 | Lectura estática de los 6 archivos congelados |
| Contrato Backend | Matriz 01, contratos 02, errores 03, migración 04 |
| Runtime / staging | **No ejecutado** en esta revisión |
| OpenAPI live | **No consultado** — solo paquete documental |

---

## 2. Matriz de cumplimiento PR-1 vs contrato

| ID contrato | Requisito | Estado PR-1 | Evidencia |
|-------------|-----------|-------------|-----------|
| **O-01** | Código optional en validación CREATE | ✅ Cumple | Guards `handleCreate` sin `codigo` / `codigo_empresa` |
| **O-02** | No bloquear submit sin código | ✅ Cumple | HTML `required` removido solo en CREATE (4 company-scoped); Empresa sin `required` nativo |
| **O-03** | Consumir código del 201 en UI | ⏸ Fuera PR-1 | Hooks/páginas no muestran código asignado |
| **O-04** | `empresa_id` = sesión JWT | ✅ Cumple | Sin cambio — `assertBodyEmpresaMatchesSession` intacto |
| **O-05** | 409 duplicado en campo código | ⏸ Fuera PR-1 | Solo toast global vía `toastOrgApiError` |
| **O-06** | 409 RUC duplicado (empresa) | ⏸ Fuera PR-1 | Idem |
| **O-07** | Tipos TS Create optional | ✅ Cumple | `codigo?` / `codigo_empresa?` en `org.types.ts` |
| Read sin cambio | Interfaces Read | ✅ Cumple | `codigo` / `codigo_empresa: string` en Read |
| UPDATE sin cambio | Edición código | ✅ Cumple | Modales EDIT sin modificar — `Código *` + `required` |

---

## 3. Revisión por entidad — CREATE sin código

Convención: usuario abre modal CREATE, deja campo código vacío, completa campos mínimos y envía.

---

### 3.1 Empresa (`org_empresa`)

| Dimensión | Detalle |
|-----------|---------|
| **Endpoint** | `POST /org/empresa` |
| **Permiso** | `org.empresa.crear` |
| **Sesión** | TENANT |
| **Payload Backend esperado (auto)** | `{ "razon_social": "…", "ruc": "…" }` — sin `codigo_empresa` |
| **Payload React enviado (sin código)** | Spread de `EMPRESA_CREATE_BASELINE` + geo IDs; **`codigo_empresa` eliminado** con `delete` si vacío; incluye además defaults preexistentes (`tipo_documento_tributario: 'RUC'`, `zona_horaria`, `es_activo: true`, strings vacíos opcionales, etc.) |
| **Propiedad `codigo_empresa` ausente** | ✅ Sí — `if (!payload.codigo_empresa?.trim()) delete payload.codigo_empresa` |
| **Response Backend esperado** | `201` + `EmpresaRead` con `codigo_empresa` asignado (típ. `EMP002` post-bootstrap) |
| **Response consumida por React** | `created.empresa_id` usado en onboarding; **`codigo_empresa` del 201 no se muestra** (PR-2) |
| **Validación cliente residual** | `razon_social`, `ruc` (11 dígitos) — alineado con contrato |
| **Riesgos restantes** | Backend pre-Ola 1 → 422; campos extra/empty strings en payload (preexistente); 409 RUC/código solo toast (PR-4); QA runtime pendiente |

**Caso contrato:** EMP-01 ✅ alineado en código.

---

### 3.2 Sucursal (`org_sucursal`)

| Dimensión | Detalle |
|-----------|---------|
| **Endpoint** | `POST /org/sucursales` |
| **Permiso** | `org.sucursal.crear` |
| **Sesión** | COMPANY |
| **Payload Backend esperado (auto)** | `{ "empresa_id": "<uuid-sesión>", "nombre": "…" }` |
| **Payload React enviado (sin código)** | `assertBodyEmpresaMatchesSession({ ...form })`; **`codigo` eliminado** si vacío; incluye `tipo_sucursal: 'sede'`, booleans flags, strings vacíos — comportamiento pre-PR-1 |
| **Propiedad `codigo` ausente** | ✅ Sí — `if (!payload.codigo?.trim()) delete payload.codigo` |
| **Response Backend esperado** | `201` + `SucursalRead.codigo` (ej. `SUC001`) |
| **Response consumida por React** | Invalidación listado; código visible tras refetch en columna — no en toast |
| **Validación cliente residual** | `scopeEmpresaId`, `nombre` |
| **Riesgos restantes** | 403 si empresa mismatch (mitigado por assert); 409 duplicado manual (PR-4); props extra en body |

**Caso contrato:** SUC-01 ✅ alineado en código.

---

### 3.3 Departamento (`org_departamento`)

| Dimensión | Detalle |
|-----------|---------|
| **Endpoint** | `POST /org/departamentos` |
| **Permiso** | `org.departamento.crear` |
| **Sesión** | COMPANY |
| **Payload Backend esperado (auto)** | `{ "empresa_id": "<uuid-sesión>", "nombre": "…" }` |
| **Payload React enviado (sin código)** | Igual patrón sucursal; **`codigo` eliminado** si vacío |
| **Propiedad `codigo` ausente** | ✅ Sí |
| **Response Backend esperado** | `201` + `DepartamentoRead.codigo` (ej. `DEP001`) |
| **Response consumida por React** | Refetch listado |
| **Validación cliente residual** | `scopeEmpresaId`, `nombre` |
| **Riesgos restantes** | Idem company-scoped |

**Caso contrato:** DEP-01 ✅ alineado en código.

---

### 3.4 Centro de costo (`org_centro_costo`)

| Dimensión | Detalle |
|-----------|---------|
| **Endpoint** | `POST /org/centros-costo` |
| **Permiso** | `org.centro_costo.crear` |
| **Sesión** | COMPANY |
| **Payload Backend esperado (auto)** | `{ "empresa_id", "nombre", "tipo_centro_costo" }` — contrato CC-04 exige tipo |
| **Payload React enviado (sin código)** | Default `tipo_centro_costo: 'operativo'`; **`codigo` eliminado** si vacío |
| **Propiedad `codigo` ausente** | ✅ Sí |
| **Response Backend esperado** | `201` + `CentroCostoRead.codigo` (ej. `CC001`) |
| **Response consumida por React** | Invalidación `['org', 'centro-costo', 'list']` |
| **Validación cliente residual** | `scopeEmpresaId`, `nombre`, `tipo_centro_costo` |
| **Riesgos restantes** | Tier B list — invalidación correcta; sort por `codigo` sin cambio |

**Caso contrato:** CC-01 ✅ alineado en código.

---

### 3.5 Cargo (`org_cargo`)

| Dimensión | Detalle |
|-----------|---------|
| **Endpoint** | `POST /org/cargos` |
| **Permiso** | `org.cargo.crear` |
| **Sesión** | COMPANY |
| **Payload Backend esperado (auto)** | `{ "empresa_id", "nombre", "moneda_salarial" }` |
| **Payload React enviado (sin código)** | `openCreate` prefija `moneda_salarial` con primera moneda catálogo; **`codigo` eliminado** si vacío; `es_activo: true` |
| **Propiedad `codigo` ausente** | ✅ Sí |
| **Response Backend esperado** | `201` + `CargoRead.codigo` (ej. `CAR001`) |
| **Response consumida por React** | Refetch listado |
| **Validación cliente residual** | `scopeEmpresaId`, `nombre` — **no valida `moneda_salarial` en guard** (preexistente; mitigado por prefill) |
| **Riesgos restantes** | Si catálogo monedas vacío → `moneda_salarial: ''` → 422 Backend (CAR-04); no introducido por PR-1 |

**Caso contrato:** CAR-01 ✅ alineado en código (con prefill moneda).

---

## 4. Verificaciones transversales

### 4.1 Onboarding Empresa

| Punto | Estado | Detalle |
|-------|--------|---------|
| Ruta | ✅ | `OnboardingEmpresaPage` → `/app/org/empresa?onboarding=true` |
| Auto-apertura modal | ✅ | `useEffect` abre CREATE si `isOnboarding` |
| CREATE sin código | ✅ | Guard ya no exige `codigo_empresa` |
| Post-201 | ✅ | `completeEmpresaSelection` / `cambiarEmpresaActiva(created.empresa_id)` |
| Código asignado visible | ⏸ | Toast genérico — no muestra `EMP002` (PR-2) |

**Veredicto onboarding:** Funcionalmente desbloqueado para auto-código; feedback UX pendiente PR-2.

---

### 4.2 Payload sin propiedad `codigo` / `codigo_empresa`

| Entidad | Mecanismo | Condición | Resultado |
|---------|-----------|-----------|-----------|
| Empresa | `delete payload.codigo_empresa` | vacío / whitespace / undefined | Propiedad ausente en JSON |
| Sucursal, Depto, CC, Cargo | `delete payload.codigo` | idem | Propiedad ausente en JSON |
| Manual con valor | No delete | `trim()` truthy | Propiedad enviada — compat legacy ✅ |
| Whitespace solo | delete | `!trim()` | Equivalente a omitir — alineado con Backend (`""` ≡ omitido) ✅ |

---

### 4.3 Compatibilidad código manual

| Escenario | PR-1 | Contrato |
|-----------|------|----------|
| Usuario escribe código en CREATE | Enviado en payload | ✅ X-02 |
| Input CREATE visible (sin `*`) | Sí — no oculto | ✅ Compatible; UX polish PR-3 |
| UPDATE con código required | Sin cambio | ✅ |

---

### 4.4 Compatibilidad UPDATE

| Entidad | CREATE | EDIT modal |
|---------|--------|------------|
| Empresa | Label `Código` (sin `*`) | `Código *` — sin cambio |
| Company-scoped (4) | Sin `required` | `Código *` + `required` — sin cambio |
| `handleUpdate` | No modificado | ✅ |
| Motor en UPDATE | N/A FE | Backend no interviene — sin cambio FE ✅ |

---

### 4.5 Compatibilidad listados

| Aspecto | Estado |
|---------|--------|
| Columnas `codigo` / `codigo_empresa` | Sin cambio |
| Datos post-CREATE | Poblados tras refetch (código asignado por Backend) |
| Sort / paginación | Sin cambio |
| FK selects (padre, CC, sucursal) | Muestran `codigo — nombre` — sin cambio |

---

### 4.6 Compatibilidad filtros

| Filtro | Estado |
|--------|--------|
| `buscar` server (debounce) | Sin cambio — sigue buscando por código entre otros campos |
| `solo_activos` | Sin cambio |
| Sin `empresa_id` en query | Sin cambio (JWT scope) |

---

### 4.7 Compatibilidad React Query invalidations

| Hook CREATE | Invalidación `onSuccess` | Cambio PR-1 |
|-------------|--------------------------|-------------|
| `useCreateEmpresa` | `['org', 'empresa', 'list']` | Ninguno |
| `useCreateSucursal` | `['org', 'sucursal', 'list']` | Ninguno |
| `useCreateDepartamento` | `['org', 'departamento', 'list']` | Ninguno |
| `useCreateCentroCosto` | `['org', 'centro-costo', 'list']` | Ninguno |
| `useCreateCargo` | `['org', 'cargo', 'list']` | Ninguno |

**Veredicto:** Listados se refrescan post-201; código auto aparece en grilla tras invalidación.

---

### 4.8 Compatibilidad dirty forms

| Utilidad | Impacto PR-1 |
|----------|--------------|
| `empresa-form-dirty.ts` | Baseline `codigo_empresa: ''` — sin cambio |
| `*-form-dirty.ts` (4) | Baseline `codigo: ''` — sin cambio |
| `isCreate*Dirty` | Funcional — dirty se dispara por otros campos (nombre, etc.) |
| `OrgDiscardConfirmDialog` | Sin cambio |

**Veredicto:** Dirty guard compatible; omitir código no rompe baseline.

---

## 5. Archivos PR-1 revisados

| Archivo | Rol en integración |
|---------|-------------------|
| `src/features/org/types/org.types.ts` | Tipos Create optional |
| `src/features/org/pages/EmpresaPage.tsx` | CREATE empresa + onboarding |
| `src/features/org/pages/SucursalesPage.tsx` | CREATE sucursal |
| `src/features/org/pages/DepartamentosPage.tsx` | CREATE departamento |
| `src/features/org/pages/CentrosCostoPage.tsx` | CREATE centro costo |
| `src/features/org/pages/CargosPage.tsx` | CREATE cargo |

**Archivos no modificados (confirmado):** `org.service.ts`, hooks `useCreate*`, componentes shared, rutas, RBAC.

---

## 6. Casos contrato — checklist estático

| ID | Caso | Código PR-1 | QA runtime |
|----|------|--------------|------------|
| EMP-01 | Auto sin código | ✅ | Pendiente staging |
| EMP-02 | Manual válido | ✅ | Pendiente |
| SUC-01 | Auto sin código | ✅ | Pendiente |
| DEP-01 | Auto sin código | ✅ | Pendiente |
| CC-01 | Auto sin código | ✅ | Pendiente |
| CAR-01 | Auto sin código | ✅ | Pendiente |
| X-01 | CREATE sin código (todas) | ✅ | Pendiente |
| X-02 | CREATE manual único | ✅ | Pendiente |

---

## 7. Riesgos residuales (no bloquean PR-1)

| ID | Riesgo | Severidad | Mitigación |
|----|--------|-----------|------------|
| IG-01 | Backend Ola 1 no desplegado en staging | Alta operacional | Gate deploy antes QA |
| IG-02 | Sin QA runtime en esta revisión | Media | Smoke manual casos §6 |
| IG-03 | Payload CREATE incluye campos extra/empty strings (legacy) | Baja | Backend tolera; no regresión PR-1 |
| IG-04 | Cargo sin monedas en catálogo → 422 | Baja | Preexistente; prefill depende de catálogo |
| IG-05 | O-03/O-05/O-06 no implementados | Info | PR-2 / PR-4 |
| IG-06 | Input código CREATE aún visible | Info | PR-3 UX |

---

## 8. Ola 1 completa — items fuera de PR-1 (no bloquean gate PR-1)

| Item | Fase | Estado |
|------|------|--------|
| Mostrar código asignado post-201 (O-03) | PR-2 | Pendiente |
| Toast enriquecido con código | PR-2 | Pendiente |
| 409 mapeado a campo código (O-05) | PR-4 | Pendiente |
| 409 RUC en campo (O-06) | PR-4 | Pendiente |
| Ocultar input / badge auto (P-01…P-03) | PR-3 | Pendiente |
| Tests automatizados ORG CREATE | Opcional | Pendiente |

> Estos items **no invalidan** el gate PR-1. Fueron explícitamente excluidos del alcance congelado.

---

## 9. Conclusión del gate

| Pregunta | Respuesta |
|----------|-----------|
| ¿PR-1 alineado con contrato Backend para CREATE auto? | **Sí — APROBADO** |
| ¿Tipos, guards, payload omit, UPDATE/listados intactos? | **Sí** |
| ¿Ola 1 ORG Frontend 100% cerrada? | **No** — pendiente PR-2+ y QA runtime |
| ¿Proceder con PR-2? | **Sí**, tras smoke QA staging de casos §6 |

---

## 10. Próximo paso recomendado

1. QA manual en staging: EMP-01, SUC-01, onboarding sin código.  
2. Si smoke OK → iniciar PR-2 (toast / código 201).  
3. Mantener PR-1 congelado — no tocar los 6 archivos salvo bug crítico de integración.

---

*Referencias: [`00_EXECUTIVE_SUMMARY.md`](00_EXECUTIVE_SUMMARY.md) · [`03_IMPLEMENTATION_PLAN.md`](03_IMPLEMENTATION_PLAN.md) · Contrato Backend 00–04*
