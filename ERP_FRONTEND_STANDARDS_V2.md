# Estándares frontend ERP — v2.0

**Sistema:** CAXIS ERP (SaaS multi-tenant)  
**Stack:** React · TypeScript · Vite · Tailwind · React Query · Axios · Zustand  
**Versión:** 2.0  
**Fecha:** 31 mayo 2026  
**Estado:** **Normativo** — post-cierre IAM · ORG · INV  
**Principio:** *Write once* — reglas con ID único; sin duplicar en `.cursorrules` ni PROMPT  
**Precedencia:** OpenAPI > **este documento** > `.cursorrules` > `PROMPT_FRONTEND_MAESTRO.md`

**Fuentes consolidadas:**

| Módulo | Documento de cierre | Rol en V2 |
|--------|---------------------|-----------|
| **IAM** | Sprints A–D + B.1.1 (`TENANT_ADMIN_GLOBAL_UX_AUDIT.md`) | Componentes tabla/búsqueda; origen B.1.1 |
| **ORG** | `ORG_CLOSE_AUDIT.md`, `ORG_SPRINT_CLOSURE_AUDIT.md` | Plataforma multiempresa; Plantilla A; hybrid |
| **INV** | `INV_MODULE_CLOSURE_AUDIT.md` | Plantilla A/B bifurcada; referencia operativa ERP |

**Auditoría V2:** [`AUDITORIA_FINAL_V2_GAPS.md`](./AUDITORIA_FINAL_V2_GAPS.md)  
**Supersede:** [`ERP_FRONTEND_STANDARDS_V1.md`](./ERP_FRONTEND_STANDARDS_V1.md) (archivado)

---

## §0 — Metadatos y alcance

### §0.1 Propósito

Este documento es la **única fuente normativa** de estándares UX/técnicos del frontend ERP operativo (tenant + company-scoped + transaccional).

| Uso | Descripción |
|-----|-------------|
| Implementación | Checklist por ID MUST al crear o refactorizar módulos |
| QA | Gates §11 como criterio de aceptación |
| Documentación derivada | `.cursorrules` y PROMPT **referencian** IDs; no redefinen reglas |

### §0.2 Qué cubre / qué no cubre

**Cubre:**

- Clasificación de vistas (Plantillas A, A+, B-L, B-F, B-R, T, H, Admin, Platform)
- Multiempresa JWT, auth, impersonation mínima
- UX listados, modales, formularios transaccionales, B.1.1
- Integridad API, RBAC, vocabulario UI, errores
- Referencias canónicas IAM / ORG / INV cerrados

**No cubre (documentos externos):**

| Tema | Dónde |
|------|-------|
| Contratos API por módulo | OpenAPI / `docs/api/*_API.json` |
| Reglas de negocio backend | Backend / dominio |
| Procedimiento Fase 0–4 | `docs/prompts/PROMPT_FRONTEND_MAESTRO.md` |
| Integridad API resumida | `.cursorrules` (pointers a §8) |
| Sistema diseño 2 capas (tokens + brand) | `.cursorrules` §4 |
| Flujo auth detallado | `docs/FLUJO_AUTH_MULTIEMPRESA_FE.md` |
| POS terminal, BI/dashboards dedicados | Fuera V2.0 — UI especial |

### §0.3 Precedencia y documentos relacionados

```
OpenAPI (contrato)
    ↓
ERP_FRONTEND_STANDARDS_V2 (este documento)
    ↓
.cursorrules (resumen operativo + diseño 2 capas)
    ↓
PROMPT_FRONTEND_MAESTRO.md (proceso; Fase 0 OpenAPI obligatoria)
```

| Documento | Rol | Relación con V2 |
|-----------|-----|-----------------|
| `.cursorrules` | Recordatorios MUST diarios | Debe apuntar a §4, §7, §8, §11 — **no copiar tablas completas** |
| `PROMPT_FRONTEND_MAESTRO.md` | Bootstrap módulo nuevo | Fase 0.4/0.5 → clasificación §2; Gates → §11 |
| `AUDITORIA_FRONTEND_[CODIGO].md` | Inventario + contrato por módulo | Obligatorio pre-implementación (PROMPT Fase 1) |
| Cierres IAM/ORG/INV | Evidencia QA | §9 referencias; no reabrir salvo excepción documentada |

**V1:** Archivado. Ante conflicto V1 vs V2, prevalece V2.

### §0.4 Convenciones de lectura

| Nivel | Significado |
|-------|-------------|
| **MUST** | Obligatorio; incumplimiento = no conforme |
| **MUST NOT** | Prohibido |
| **SHOULD** | Recomendado; desviación documentada en auditoría módulo |
| **MAY** | Opcional |

- Cada regla tiene ID único (`ME-01`, `B11-03`, …).
- Referencias cruzadas: `§X.Y` o ID (`ver PA-05`).
- Rutas de código: **solo** en §10 (mapa único).

---

## §1 — Glosario y taxonomía

### §1.1 Glosario normativo

| Término | Definición | Capítulo |
|---------|------------|----------|
| **JWT / sesión** | Token de acceso; tenant, empresa activa, flags impersonation | §4 |
| **Company-scoped** | Datos de **una empresa activa** en sesión | §4.2 |
| **Tenant-scoped** | Datos del tenant sin empresa obligatoria en sesión | §4.2 |
| **Hybrid-scoped** | Recursos GLOBAL u OVERRIDE por empresa | §4.2 |
| **`scopeEmpresaId`** | ID empresa operativa de sesión; fuente única queries/mutaciones company | §4 |
| **B.1.1** | Cierre seguro con formulario dirty: confirmación antes de descartar | §7 |
| **E-ME4** | Prohibición de UUID visible en UI | §4.6 |
| **Baja lógica** | Desactivar / Reactivar — nunca “Eliminar” en vocabulario UI | §8.4 |
| **Dirty / snapshot / baseline** | Comparación formulario vs estado inicial para discard | §7 |
| **`discardPending`** | `'create' \| 'edit' \| null` — modal pendiente de confirm discard | §7.1 |
| **Plantilla A / A+ / B-L / B-F / B-R** | Taxonomía de vistas ERP | §2 |
| **T / H / Admin / Platform** | Vistas especiales fuera del par A/B estándar | §2 |
| **Gate 0–4** | Checklist obligatorio por fase | §11 |

### §1.2 Taxonomía plantilla — tabla maestra

| Plantilla | Naturaleza | CRUD | B.1.1 | Toolbar |
|-----------|------------|------|-------|---------|
| **A** | Maestro modal | Modal | §7.1 | `OrgCompanyToolbar` |
| **A+** | Maestro modal extenso | Modal grande | §7.1 + §7.1.4 | Idem A |
| **B-L** | Lista transaccional + workflow | Lista + detalle modal | §7.3 | Operativa propia |
| **B-F** | Documento cabecera + líneas | Página completa | §7.2 | Header compacto |
| **B-R** | Consulta analítica | Solo lectura | N/A | Filtros dominio |
| **T** | Tenant-wide | Variable | §7.1 si modal | Sin banner empresa duplicado |
| **H** | Hybrid GLOBAL/OVERRIDE | Tabs | §7.1 | `OrgCompanyToolbar` + tabs |
| **Admin** | IAM tenant | Modal / página | §7.1 | Patrón IAM |
| **Platform** | Super-admin | Variable | SHOULD §9.4 | Sin scope company JWT |

---

## §2 — Clasificación de vistas

### §2.1 Árbol de decisión (único en V2)

```
¿Ruta /super-admin/* ?
  SÍ → Platform (§9.4)
  NO → ¿Escritura con detalle embebido POST/PUT?
        SÍ → B-F
        NO → ¿Solo lectura / analítica / reporte exportable?
              SÍ → B-R
              NO → ¿Flujo documental (estados, aprobar, anular)?
                    SÍ → B-L
                    NO → ¿Administración tenant sin empresa en sesión?
                          SÍ → T
                          NO → ¿Parámetros GLOBAL/OVERRIDE?
                                SÍ → H
                                NO → ¿Ruta /admin/* IAM?
                                      SÍ → Admin (§9.1)
                                      NO → ¿Formulario modal > ~25 campos visibles?
                                            SÍ → A+
                                            NO → A
```

**Flujos pre-app** (login, selección empresa, onboarding): no usan plantilla A/B — ver **§4.8 AUTH-xx**.

### §2.2 Reglas de clasificación

| ID | Nivel | Regla |
|----|-------|-------|
| **CL-01** | MUST | Clasificar cada ruta antes de implementar (Gate 0 §11.1) |
| **CL-02** | MUST NOT | Mezclar toolbar Plantilla A (`OrgCompanyToolbar` + Ver inactivos) en B-L/B-R |
| **CL-03** | MUST NOT | Usar B-F si el formulario cabe en modal sin líneas embebidas |
| **CL-04** | SHOULD | Documentar excepción T/H/Platform en `AUDITORIA_FRONTEND_[CODIGO].md` |
| **CL-05** | MUST NOT | Usar `useInvTransactionalFormGuard` en Plantilla A (ver §7.2 SEC-01) |
| **CL-06** | MUST NOT | Crear plantilla ad hoc por código de módulo (PUR, SLS, …); MUST mapear a A/A+/B-L/B-F/B-R/T/H/Admin/Platform |

### §2.3 Matriz cobertura escenarios ERP

| Escenario | Plantilla | Referencia bootstrap §9 |
|-----------|-----------|-------------------------|
| Maestro ORG (depto, cargo, CC, sucursal) | **A** | ORG `DepartamentosPage` |
| Maestro INV catálogo | **A** | INV `UnidadesMedidaPage` |
| Producto modal extenso | **A+** | INV `ProductosPage` |
| Movimientos / IF lista | **B-L** | INV `MovimientosPage` |
| Movimiento / IF form | **B-F** | INV `MovimientoFormPage` |
| Stock / Kardex | **B-R** | INV `StockPage`, `KardexPage` |
| Empresas tenant | **T** | ORG `EmpresaPage` (no copiar monolito — AP-10) |
| Parámetros hybrid | **H** | ORG `ParametrosPage` |
| IAM usuarios / roles | **Admin** | IAM `UserManagementPage` |
| Super-admin clientes / catálogos | **Platform** | §9.4 |
| **PUR** proveedores, contactos | **A** | ORG + INV catálogo |
| **PUR** solicitudes, cotizaciones | **B-L** | INV `MovimientosPage` |
| **PUR** OC, recepciones | **B-F** | INV `MovimientoFormPage` |
| **SLS** clientes, direcciones | **A** | Idem PUR |
| **SLS** cotizaciones, pedidos | **B-F** / **B-L** | INV |
| **FIN** plan cuentas, periodos | **A** | ORG `CentrosCostoPage` |
| **FIN** asientos contables | **B-F** | INV `MovimientoFormPage` |
| **LOG** transportistas, vehículos | **A** | INV `AlmacenesPage` |
| **LOG** guías, despachos | **B-L** + **B-F** | INV IF / movimientos |
| **PRC** listas precio con líneas | **B-F** o **A+** | Si POST embebido → B-F |
| **INV_BILL** comprobantes | **B-L** | Documento fiscal + estados |
| **CRM** pipeline | **B-L** | Lista con estados |
| Reportes / dashboards exportables | **B-R** | Filtros + tabla; sin CRUD |

---

## §3 — Precedencia y anti-patrones

### §3.1 Orden de precedencia

1. Contrato OpenAPI del módulo  
2. **Este documento** (IDs MUST)  
3. `.cursorrules`  
4. `PROMPT_FRONTEND_MAESTRO.md`

### §3.2 Anti-patrones MUST NOT (lista única)

| ID | Anti-patrón | Plantillas | Regla positiva |
|----|-------------|------------|----------------|
| **AP-01** | Selector empresa en toolbar company-scoped | A, B-* | ME-02 |
| **AP-02** | POST detalle independiente si API marca deprecated | B-F | CD-01 |
| **AP-03** | UUID visible / `title={uuid}` | Todas | E-ME4-01 |
| **AP-04** | Modal CRUD multi-campo sin B.1.1 | A, A+, T, H | B11-01 |
| **AP-05** | Salir B-F dirty sin confirm/blocker | B-F | SEC-01 |
| **AP-06** | Mezclar `ConfirmDialog` baja con `discardPending` | A | B11-02 |
| **AP-07** | H1 + subtítulo en body de listado | A, B-L | TB-01 |
| **AP-08** | Empty inline manual en listados nuevos A | A | ES-01 |
| **AP-09** | Loader full-page ocultando tabla en listado | A, B-L | SK-01 |
| **AP-10** | Copiar `EmpresaPage` monolito como plantilla | T | §9.2 |
| **AP-11** | Toast error duplicado hook + componente | Todas | ER-02 |

---

## §4 — Multiempresa JWT

### §4.1 Principio

La empresa operativa la define la **sesión** (JWT + `AuthContext`), reflejada en el **header** (`EmpresaSelector`). Las páginas company-scoped **no** duplican esa decisión.

```mermaid
flowchart LR
  JWT[JWT / AuthContext] --> EA[useEmpresaActiva]
  EA --> H[Header empresa]
  EA --> S[scopeEmpresaId]
  S --> G[Company query gate]
  G --> Q[React Query]
  H -->|cambio empresa| INV[invalidate module queries]
  INV --> Q
```

### §4.2 Matriz scope

| Tipo | ¿Empresa en sesión? | Selector en página | Guard | Ejemplo |
|------|---------------------|--------------------|-------|---------|
| **Company** | Sí | No | Company | INV categorías, ORG deptos |
| **Tenant** | No* | No | Tenant | ORG `EmpresaPage` |
| **Hybrid** | Sí (tab OVERRIDE) | No | Company | ORG `ParametrosPage` |
| **B-F / B-L** | Sí | No | Company | INV movimientos |
| **Platform** | No (scope platform) | No | N/A platform | `/super-admin/*` |

\* Tenant-admin puede operar company-scoped con empresa activa en JWT.

### §4.3 Reglas MUST — scope y queries

| ID | Regla |
|----|-------|
| **ME-01** | `empresa_id` operativo en listados y mutaciones = `scopeEmpresaId` de sesión |
| **ME-02** | MUST NOT `<select>` “Todas las empresas” ni selector empresa en toolbar company-scoped |
| **ME-03** | MUST invalidar queries del módulo al cambiar empresa en header |
| **ME-04** | MUST NOT ejecutar queries company si `requiereSeleccionEmpresa`, `empresaSelectionPending` o sin empresa activa |
| **ME-05** | MUST `assertBodyEmpresaMatchesSession` (o equivalente) en create/update company-scoped |
| **ME-06** | MUST NOT `empresaService.list` para poblar filtros operativos company-scoped |

### §4.4 Reglas SHOULD — scope

| ID | Regla |
|----|-------|
| **ME-07** | SHOULD extraer `useErpCompanyScope` desde `useOrgSessionScope` / `useInvSessionScope` antes de escalar PUR/SLS (Anexo EXT-01) |
| **ME-08** | SHOULD alinear banner fallback con `useHeaderEmpresaContextVisible` antes de `OrgActiveEmpresaBanner` |
| **ME-09** | SHOULD reset filtros locales, modales abiertos y `discardPending` al cambiar `scopeEmpresaId` |
| **ME-10** | SHOULD Hooks GET nuevos usan `useTenantQuery` (tenant en queryKey) además de gate empresa cuando aplique |

### §4.5 Guards y hooks

Patrón por módulo (rutas §10):

| Pieza | ORG | INV |
|-------|-----|-----|
| Session scope | `useOrgSessionScope` | `useInvSessionScope` |
| Query gate | `useOrgCompanyQueryGate` | `useInvCompanyQueryGate` |
| Route guard | `OrgCompanyRouteGuard` | `InvCompanyRouteGuard` |
| Reset filtros | `useOrgScopeEmpresaReset` | `useInvScopeEmpresaReset` |
| Invalidación | `invalidateOrgQueries` | `invalidateInvQueries` |

Módulos nuevos: copiar patrón INV/ORG literal en M0; extracción `useErpCompanyScope` no bloqueante.

### §4.6 E-ME4 — identificadores en UI

| ID | Regla |
|----|-------|
| **E-ME4-01** | MUST NOT columna, tooltip, `title`, texto visible con UUID |
| **E-ME4-02** | MUST fallback `—` si FK no resuelta |
| **E-ME4-03** | MAY UUID en `value` de select, hidden inputs, query keys, variables TS |

Ver también §8.2 FK-xx.

### §4.7 Estados de sesión (resumen)

| Estado | Comportamiento | Reglas |
|--------|----------------|--------|
| Requiere selección empresa | Redirect; no queries company | AUTH-01, ME-04 |
| Sin empresa activa | Guard / mensaje | ME-04 |
| Impersonación activa | Respetar flags; no bypass guards | IMP-01…IMP-04 |
| Post-login / post-selección | Destino vía menú JWT | AUTH-02 |

Detalle flujos: **§4.8**.

### §4.8 Flujos Auth, selección empresa e impersonation

> Hogar único AUTH/IMP. §9 no repite estas reglas.

#### §4.8.1 Auth y onboarding

| ID | Nivel | Regla |
|----|-------|-------|
| **AUTH-01** | MUST | Si `requiereSeleccionEmpresa`, redirect a selección; MUST NOT queries company-scoped |
| **AUTH-02** | MUST | Post-login / post-selección: resolver destino vía menú JWT (`resolvePostLoginPath` en `post-login-path.ts`); MUST NOT hardcode módulo |
| **AUTH-03** | MUST | Onboarding primera empresa (`?onboarding=true`): B.1.1 en modal create; flujo **T**; no company-scoped hasta empresa creada |
| **AUTH-04** | MUST | `SeleccionarEmpresaPage`: elección persiste en JWT; MUST NOT operar listados company sin empresa activa |
| **AUTH-05** | SHOULD | Empty / error en selección con CTA claro (logout, reintentar) |

**Referencias código:** §10 — `AuthContext`, `SeleccionarEmpresaPage`, `OnboardingEmpresaPage`, `post-login-path.ts`.  
**Detalle:** `docs/FLUJO_AUTH_MULTIEMPRESA_FE.md`.

#### §4.8.2 Impersonation (platform → tenant)

| ID | Nivel | Regla |
|----|-------|-------|
| **IMP-01** | MUST | Con impersonación activa (`is_impersonation` JWT): MUST NOT bypass guards company vía `savePlatformParentSession` u otro atajo |
| **IMP-02** | MUST | Tras impersonate con selección pendiente: mismo flujo AUTH-01 que login multiempresa |
| **IMP-03** | MUST | Salir impersonación: restaurar sesión platform parent; invalidar queries tenant/empresa |
| **IMP-04** | SHOULD | UI visible “modo soporte” sin exponer tokens ni UUID cliente |

**Separación:** AUTH = selección normal; IMP = impersonation platform.

---

## §5 — Plantilla A — Catálogo

> Aplica **A** y **A+**. Extensiones A+ solo §5.8.

### §5.1 Layout de página

| ID | Regla |
|----|-------|
| **PA-01** | MUST `OrgPageLayout` / `InvPageLayout` sin H1 en body |
| **PA-02** | MUST secuencia: Toolbar → Skeleton → Error banner → Tabla |

### §5.2 Toolbar

Layout obligatorio:

```
[ Filtros opcionales ] [ Búsqueda ] [ Ver inactivos ]     ———     [ CTA Crear ]
        └────────────── grupo izquierdo ──────────────┘              └─ derecha ─┘
```

| ID | Regla |
|----|-------|
| **TB-01** | MUST NOT H1/subtítulo en body (breadcrumb identifica página) |
| **TB-02** | MUST `justify-between`; CTA derecha `shrink-0` |
| **TB-03** | MUST NOT selector empresa en company-scoped |
| **TB-04** | MUST `gap-3`; controles secundarios `shrink-0` |
| **TB-05** | MUST deshabilitar CTA, búsqueda, acciones fila si `discardPending !== null` |

Componentes: §10 — `OrgCompanyToolbar`, `OrgToolbarSearch`.

### §5.3 Búsqueda

| ID | Regla |
|----|-------|
| **SR-01** | MUST `OrgToolbarSearch` + `IamSearchInput` |
| **SR-02** | MUST `hasSearch = buscar.trim().length > 0` para variante empty |
| **SR-03** | SHOULD debounce 500ms en búsqueda server-side (patrón IAM) |
| **SR-04** | MAY búsqueda client-side si API sin `buscar` — documentar deuda en auditoría módulo |

### §5.4 Empty state

| ID | Regla |
|----|-------|
| **ES-01** | MUST `IamTableEmptyState` dentro `<tbody>` |
| **ES-02** | MUST `colSpan` = columnas `<thead>` = skeleton |
| **ES-03** | MUST NOT CTA crear si `hasSearch` |
| **ES-04** | MUST `actionDisabled` si `discardPending !== null` |

#### §5.4.1 Matriz mensajes

| Condición | Título | Description | CTA crear |
|-----------|--------|-------------|-----------|
| Lista vacía, solo activos | “No hay … activos.” | — | Sí, si permiso + scope |
| Lista vacía, con inactivos | “No hay … registrados.” | — | Según tab |
| `hasSearch` | “No se encontraron … que coincidan con la búsqueda.” | “Pruebe otro término…” | **No** |
| Sin `scopeEmpresaId` | Mensaje guard, no empty tabla | — | No |

### §5.5 Skeleton

| ID | Regla |
|----|-------|
| **SK-01** | MUST `InvTableSkeleton` (re-export ORG: `OrgTableSkeleton`) |
| **SK-02** | MUST constante `TABLE_COLSPAN` compartida skeleton / empty / thead |
| **SK-03** | MUST NOT solo `Loader` ocultando toda la tabla en listado |

Excepción: carga inicial formulario B-F — §6.6.

### §5.6 Modal CRUD

| ID | Regla |
|----|-------|
| **PA-03** | MUST modales create + edit |
| **PA-04** | MUST `OrgSessionEmpresaField` en create company-scoped |
| **PA-05** | MUST B.1.1 create + edit (detalle §7.1) |
| **PA-06** | MUST NOT `useInvTransactionalFormGuard` en Plantilla A |
| **PA-07** | MUST `ConfirmDialog` desactivar/reactivar **independiente** de discard |
| **PA-08** | MUST RBAC: no renderizar botón sin permiso |

Stack types/hooks: §8.1. Vocabulario baja: §8.4.

### §5.7 Reset al cambiar empresa

| ID | Regla |
|----|-------|
| **PA-09** | MUST extender `use*ScopeEmpresaReset`: cerrar modals, limpiar editing, snapshot, `discardPending` |

Referencia INV M3: reset empresa en modals catálogo.

### §5.8 Plantilla A+ (extensiones)

| ID | Regla |
|----|-------|
| **PA+-01** | MAY modal `max-w-3xl` o mayor; mismo B.1.1 que A |
| **PA+-02** | MUST baseline create dinámico si defaults dependen de catálogos async (ej. monedas en Productos) |
| **PA+-03** | SHOULD dirty scope = solo campos visibles en modal |

Referencia: INV `ProductosPage` §9.3.

### §5.9 Referencias canónicas Plantilla A

| Módulo | Archivo | Rol |
|--------|---------|-----|
| ORG | `DepartamentosPage`, `CentrosCostoPage` | A estándar |
| INV | `UnidadesMedidaPage` | A piloto M3 |
| INV | `CategoriasPage`, `AlmacenesPage`, `TiposMovimientoPage` | A + B.1.1 M3 |
| INV | `ProductosPage` | A+ |

---

## §6 — Plantilla B — Transaccional y consulta

### §6.1 Subclasificación

| Plantilla | Descripción | Ejemplo INV |
|-----------|-------------|-------------|
| **B-L** | Lista + workflow + detalle modal | `MovimientosPage`, `InventarioFisicoPage` |
| **B-F** | Documento cabecera + líneas, página completa | `MovimientoFormPage`, `InventarioFisicoFormPage` |
| **B-R** | Solo lectura / analítica | `StockPage`, `KardexPage` |

### §6.2 Toolbar operativa (B-L / B-R)

| ID | Regla |
|----|-------|
| **PB-01** | MUST NOT `OrgCompanyToolbar` + patrón “Ver inactivos” en B-L/B-R |
| **PB-02** | MUST filtros de dominio (fechas, almacén, producto, estado documento) |
| **PB-03** | MUST NOT “Ver inactivos” de catálogo si dominio usa estados de documento |

### §6.3 Lista transaccional B-L

| ID | Regla |
|----|-------|
| **PB-04** | MUST acciones workflow en detalle/modal; no en tabla salvo atajo documentado |
| **PB-05** | MUST reset lista al cambiar empresa (patrón `inv-list-empresa-reset`) |
| **PB-06** | MAY empty inline hoy; SHOULD migrar `IamTableEmptyState` (deuda Anexo ES-B) |
| **PB-07** | MUST skeleton tabla en carga |
| **PB-08** | MUST `ConfirmDialog` workflow (aprobar/anular) sin mezclar B.1.1 form dirty |

Referencia: INV `MovimientosPage`, `InventarioFisicoPage`.

### §6.4 Consulta B-R

| ID | Regla |
|----|-------|
| **PB-09** | MUST NOT Crear / desactivar maestro |
| **PB-10** | MUST E-ME4 + fallback FK `—` |
| **PB-11** | MAY deep-link query params (ej. Kardex `producto_id`) |
| **PB-12** | MUST NOT endpoints escritura deprecated |

Referencia: INV `StockPage`, `KardexPage`.

### §6.5 Cabecera + detalle — reglas API (B-F)

| ID | Regla |
|----|-------|
| **CD-01** | MUST un solo POST/PUT con detalle embebido (`…/con-detalle`) |
| **CD-02** | MUST NOT POST/PUT independiente sobre detalle si API deprecated |
| **CD-03** | MAY GET detalle para lectura |
| **CD-04** | MUST página completa si líneas editables pre-submit |
| **CD-05** | MUST sección cabecera + sección líneas |
| **CD-06** | MUST agregar/eliminar línea client-side pre-submit |
| **CD-07** | MUST `empresa_id` cabecera = sesión (ME-05) |

### §6.6 Layout B-F (UI)

| ID | Regla |
|----|-------|
| **CD-08** | MUST contenedores `bg-surface border border-border-base rounded-lg shadow-sm` |
| **CD-09** | MUST cabecera `p-6 mb-6`; detalle header `px-4 py-3 border-b border-border-base` |
| **CD-10** | MAY header compacto con identificador documento + acciones |
| **CD-11** | MUST NOT `InvPageLayout` full chrome si full-bleed transaccional documentado |

Referencia: INV `MovimientoFormPage`, `InventarioFisicoFormPage`.

---

## §7 — Seguridad UX — B.1.1

> Capítulo único discard. §5/§6 solo referencian IDs.

### §7.1 B.1.1 modales (A, A+, T, H, Admin)

#### Comportamiento

| ID | Regla |
|----|-------|
| **B11-01** | MUST confirm si dirty al cerrar (X, ESC, overlay, Cancelar) |
| **B11-02** | MUST `ConfirmDialog` baja/reactivar **independiente** de `discardPending` |
| **B11-03** | MUST deshabilitar toolbar/búsqueda/acciones fila si `discardPending !== null` |
| **B11-04** | MUST textos “Seguir editando” / “Sí, descartar” |
| **B11-05** | MUST NOT cerrar si submitting |
| **B11-06** | MUST `onInteractOutside` / `onEscapeKeyDown` → `preventDefault` si dirty |

#### Flujo post-save

| ID | Regla |
|----|-------|
| **B11-07** | MUST `closeCreate` / `closeEdit` tras save OK |

#### Dirty A+

| ID | Regla |
|----|-------|
| **B11-08** | MUST snapshot edit al abrir; baseline create en open (A+) |
| **B11-09** | MUST dirty compare solo campos UI del modal |

#### Piezas técnicas

Estado `discardPending`, `createOrgDiscardHandlers`, `OrgDiscardConfirmDialog`, `orgDialogGuardProps`, `form-dirty/*`, `scheduleModalStackValidation` → **§10**.

#### QA mínimo modal

Matriz 9 casos: `INV_M3_B11_CATALOGS_AUDIT.md` §8. Gate 2 §11.3.

### §7.2 B.1.1 página completa (B-F)

| ID | Regla |
|----|-------|
| **SEC-01** | MUST dirty guard página: `useInvTransactionalFormGuard` hoy; sucesor SHOULD `useErpTransactionalFormGuard` (Anexo EXT-02) |
| **SEC-02** | MUST `useBlocker` o equivalente RR si dirty al navegar |
| **SEC-03** | MUST `OrgDiscardConfirmDialog` + handlers página (`createInvPageDiscardHandlers`) |
| **SEC-04** | MUST cambio empresa en edit → redirect + toast (no form stale) |
| **SEC-05** | MUST NOT reset form antes navigate en discard edit |
| **SEC-06** | MUST create: reset form al cambiar empresa |
| **SEC-07** | SHOULD `beforeunload` — backlog, no MUST |

Referencia QA: `INV_M2_SEC_QA_BEHAVIOR_MATRIX.md`. Módulo INV §9.3.

**PUR-M2:** SHOULD usar guard extraído `useErpTransactionalFormGuard` si existe; si no, copiar INV con rename module-local.

### §7.3 B.1.1 en B-L (excepciones)

| ID | Regla |
|----|-------|
| **SEC-08** | MUST NOT B.1.1 en modales **solo lectura** detalle |
| **SEC-09** | MUST NOT B.1.1 en confirms workflow one-shot (aprobar, procesar, anular con motivo) |
| **SEC-10** | MAY dirty en campos motivo anular — backlog Anexo R-06 |

---

## §8 — Integridad API, datos y RBAC

### §8.1 Endpoints y service layer

| ID | Regla |
|----|-------|
| **API-01** | MUST NOT consumir endpoints `deprecated: true` |
| **API-02** | MUST comentar código legacy deprecated en service |
| **API-03** | MUST service layer; no fetch directo desde componentes |
| **API-04** | MUST types Create / Update / Read separados |

### §8.2 UUID, FK y enriquecimiento

Cross-ref E-ME4 §4.6.

| ID | Regla |
|----|-------|
| **FK-01** | MUST Select FK: nombre visible, ID en value enviado |
| **FK-02** | MUST NOT hardcode FK (moneda default, etc.) sin catálogo |

Si listado solo trae ID: ajustar query, join API, o mapa local — **nunca** mostrar UUID (E-ME4-02).

### §8.3 RBAC

| ID | Regla |
|----|-------|
| **RB-01** | MUST `usePermissions` → `can(modulo, accion)`; no renderizar acción sin permiso |
| **RB-02** | MUST NOT usar `disabled` como sustituto de ocultar en acciones destructivas |

Rutas: `PermissionGuard` §10.

### §8.4 Vocabulario UI y baja lógica

**Tabla única** — no redefinir en otros capítulos.

| Contexto | Término UI | MUST NOT |
|----------|------------|----------|
| Maestro activo/inactivo | Desactivar / Reactivar | Eliminar, Borrar, Dar de baja |
| Documento workflow | Anular / Aprobar / Procesar / Finalizar | Según dominio API |
| Confirm baja maestro | “¿Desactivar …?” | “¿Eliminar …?” |

| ID | Regla |
|----|-------|
| **UX-01** | MUST vocabulario de esta tabla |
| **UX-02** | MUST NOT “Eliminar”, “Dar de baja”, “Borrar” en UI ERP |

### §8.5 Errores y toast

| ID | Regla |
|----|-------|
| **ER-01** | MUST `getErrorMessage` con jerarquía `detail` / mensaje API |
| **ER-02** | MUST toast error **solo** en hook `onError` |
| **ER-03** | MAY toast validación cliente pre-mutación |

### §8.6 Campo `es_activo` en formularios

| ID | Regla |
|----|-------|
| **UX-03** | MUST NOT checkbox `es_activo` en create |
| **UX-04** | MUST NOT `es_activo` en edit modal; usar Desactivar/Reactivar en tabla |

### §8.7 Paginación server-side

| ID | Nivel | Regla |
|----|-------|-------|
| **PR-01** | SHOULD | Si OpenAPI expone `page`/`limit` (o `pagina`/`limite`): hook MUST incluir params en queryKey |
| **PR-02** | SHOULD | UI: controles paginación visibles; MUST NOT cargar todo en memoria si API pagina |
| **PR-03** | MAY | Client-side pagination solo si API no pagina y volumen documentado < umbral |

Referencia paginación: super-admin `useClientes` §9.4. ORG/INV listados mayoría sin paginación API — PR-01 no es MUST global.

---

## §9 — Módulos de referencia cerrados

> Qué copiar; qué no reabrir. Reglas ME/PA en §4/§5 — no repetidas aquí.

### §9.1 IAM — administración identidad

**Estado:** Cerrado Sprints A–D + B.1.1 overlay. QA RBAC V1 validado.

| Aspecto | Patrón | Uso en módulos ERP |
|---------|--------|-------------------|
| RBAC pantallas | `RoleManagementPage`, `RolePermissionsManager` | Solo Admin |
| Búsqueda debounce | `UserManagementPage` | SHOULD SR-03 |
| B.1.1 origen | `UserManagementPage` + modal stack | Referencia §7.1 |
| Componentes | `IamSearchInput`, `IamTableEmptyState` | §10 — Plantilla A |
| Multiempresa UI usuarios | Pendiente contrato BE | No MUST V2 |

**IAM-REF-01:** No reabrir IAM salvo multiempresa FE/BE o LBAC ampliado.

| ID | Nivel | Regla |
|----|-------|-------|
| **AP-12** | SHOULD | Rutas admin legacy no alineadas (`/admin/menus`, `/admin/areas`): redirect documentado o 403; MUST NOT usar como plantilla |

### §9.2 ORG — plataforma multiempresa

**Estado:** Cerrado funcional (multiempresa JWT, E-SEC, E-UX, E-UX.1).

| Aspecto | Referencia | Plantilla |
|---------|------------|-----------|
| Scope JWT | `useOrgSessionScope` | Company / hybrid |
| B.1.1 modales | 6 páginas E-SEC | A, T, H |
| Hybrid parámetros | `ParametrosPage` | H |
| Tenant empresas | `EmpresaPage` | T — **AP-10** |
| Toolbar / empty | E-UX.1 | A |

**ORG-REF-01:** Deuda cosmética DT-xx → Anexo A. No bloquea PUR.

### §9.3 INV — operación bifurcada A + B

**Estado:** **✅ CERRADO OFICIAL** — `INV_MODULE_CLOSURE_AUDIT.md`.

| Plantilla | Pantallas referencia |
|-----------|---------------------|
| **A** | `UnidadesMedidaPage`, `CategoriasPage`, `AlmacenesPage`, `TiposMovimientoPage` |
| **A+** | `ProductosPage` |
| **B-L** | `MovimientosPage`, `InventarioFisicoPage` |
| **B-F** | `MovimientoFormPage`, `InventarioFisicoFormPage` |
| **B-R** | `StockPage`, `KardexPage` |
| Scope | `useInvSessionScope`, `InvCompanyRouteGuard` |
| B-F guard | `useInvTransactionalFormGuard` |
| B.1.1 catálogo | Patrón ORG E-SEC reutilizado (M3) |

**INV-REF-01:** Primer módulo ERP operativo completo Plantilla A/B. Referencia obligatoria PUR/SLS/FIN/LOG.

### §9.4 Platform / super-admin

**Estado:** Operativo en prod; **no** cerrado formal equivalente IAM/ORG/INV. ~32 pantallas `super-admin/`.

| ID | Nivel | Regla |
|----|-------|-------|
| **PL-01** | MUST NOT | Aplicar scope company JWT (`scopeEmpresaId`) en rutas `/super-admin/*` |
| **PL-02** | MUST | Platform usa scope tenant/cliente objetivo vía JWT impersonation o admin platform; MUST NOT `OrgCompanyRouteGuard` |
| **PL-03** | SHOULD | Modales CRUD platform multi-campo: B.1.1 (deuda actual — sprint Platform-SEC) |
| **PL-04** | SHOULD | Reutilizar `IamSearchInput`, `IamTableEmptyState`, paginación patrón super-admin clientes |

**PL-03** no elevar a MUST hasta sprint Platform-SEC dedicado.

### §9.5 Matriz “qué copiar de quién”

| Necesidad | Copiar de | § |
|-----------|-----------|---|
| Listado A + B.1.1 | INV catálogo M3 o ORG E-SEC | §5, §9.3 |
| Multiempresa M0 | ORG / INV infra scope | §4, §9.2 |
| Documento B-F | INV M2-SEC | §6, §7.2, §9.3 |
| Consulta B-R | INV Stock/Kardex | §6.4 |
| Admin RBAC | IAM | §9.1 |
| Parámetros hybrid | ORG | §9.2 |
| Auth / impersonation | §4.8 + `FLUJO_AUTH_MULTIEMPRESA_FE` | §4.8 |

### §9.6 Módulos en migración (código legacy pre-M0)

| Módulo | Estado código | Bootstrap V2 |
|--------|---------------|--------------|
| **PUR** | Hooks parciales; `useTenantQuery` en algunos; company scope pendiente M0 | §2.3 + §9.5; auditoría `AUDITORIA_FRONTEND_PUR.md` |
| **SLS, FIN, LOG, PRC** | Páginas legacy pre-estándar | Clasificar §2; copiar INV/ORG según plantilla |
| **Platform** | Sin B.1.1 formal | §9.4 PL-xx |

§9 + §10 **eliminan auditoría arquitectónica de patrones**; **no sustituyen** Fase 0 OpenAPI ni inventario código (PROMPT Fase 0–1).

---

## §10 — Mapa de componentes y utilidades

**Única tabla maestra de rutas** — otros capítulos nombran componente, no ruta.

| Estándar | Componente / utilidad | Ruta | Plantilla |
|----------|----------------------|------|-----------|
| Búsqueda input | `IamSearchInput` | `@/features/admin/components/iam` | A, Admin |
| Búsqueda layout | `OrgToolbarSearch` | `@/features/org/components` | A |
| Empty tabla | `IamTableEmptyState` | `@/features/admin/components/iam` | A |
| Skeleton | `InvTableSkeleton` | `@/features/inv/components` | A, B-L |
| Toolbar company | `OrgCompanyToolbar` | `@/features/org/components` | A, H |
| Banner empresa | `OrgActiveEmpresaBanner` | `@/features/org/components` | fallback |
| Campo empresa sesión | `OrgSessionEmpresaField` | `@/features/org/components` | A create |
| Discard modal | `OrgDiscardConfirmDialog` | `@/features/org/components` | §7.1 |
| Handlers discard | `createOrgDiscardHandlers` | `@/features/org/utils/org-discard-handlers` | §7.1 |
| Dialog guard props | `orgDialogGuardProps` | `@/features/org/utils/org-dialog-guard-props` | §7.1 |
| Dirty utils catálogo | `form-dirty/*` | `@/features/org/utils/form-dirty`, `@/features/inv/utils/form-dirty` | §7.1 |
| Page discard B-F | `createInvPageDiscardHandlers` | `@/features/inv/utils` | §7.2 |
| Transactional guard | `useInvTransactionalFormGuard` | `@/features/inv/hooks` | §7.2 B-F |
| Confirm baja | `ConfirmDialog` | `@/shared/components/ui` | §8.4 |
| Layout | `OrgPageLayout` / `InvPageLayout` | por módulo | A |
| Errores | `getErrorMessage` | `@/core/services/error.service` | §8.5 |
| Permisos | `usePermissions` | `@/core/auth/hooks` | §8.3 |
| Route guard ORG | `OrgCompanyRouteGuard` | `@/features/org/components/guards` | company |
| Route guard INV | `InvCompanyRouteGuard` | `@/features/inv/components/guards` | company |
| Scope ORG | `useOrgSessionScope` | `@/features/org/hooks/useOrgSessionScope` | company |
| Scope INV | `useInvSessionScope` | `@/features/inv/hooks/useInvSessionScope` | company |
| Query gate ORG | `useOrgCompanyQueryGate` | `@/features/org/hooks/org-company-query-gate` | company |
| Query gate INV | `useInvCompanyQueryGate` | `@/features/inv/hooks/inv-company-query-gate` | company |
| Tenant query | `useTenantQuery` | `@/core/hooks/useTenantQuery` | ME-10 |
| Body scope assert | `assertBodyEmpresaMatchesSession` | `@/features/org/utils/org-body-scope` | ME-05 |
| Invalidación ORG | `invalidateOrgQueries` | `@/features/org/utils/invalidate-org-queries` | ME-03 |
| Invalidación INV | `invalidateInvQueries` | `@/features/inv/utils/invalidate-inv-queries` | ME-03 |
| Modal stack QA | `scheduleModalStackValidation` | `@/features/admin/utils/iam-modal-stack-validation` | §7.1 |
| Sesión | `AuthContext` | `@/shared/context/AuthContext` | §4.8 |
| Empresa activa | `useEmpresaActiva` | `@/features/auth/hooks/useEmpresaActiva` | §4 |
| Impersonation | `useImpersonation` | `@/features/auth/hooks/useImpersonation` | §4.8 |
| Post-login | `resolvePostLoginPath` | `@/core/routing/post-login-path.ts` | AUTH-02 |
| Selección empresa | `SeleccionarEmpresaPage` | `@/features/auth/pages` | AUTH-04 |
| Onboarding | `OnboardingEmpresaPage` | `@/features/auth/pages` | AUTH-03 |

**SHOULD futuro (Anexo EXT-01):** renombrar prefijo `Erp*` y ubicar en `src/shared/components/erp/` — no bloquea V2.0.

---

## §11 — Checklist obligatorio — Gates

**Única checklist completa** del ecosistema. `.cursorrules` y PROMPT apuntan aquí.

### §11.1 Gate 0 — Clasificación

- [ ] **CL-01**, **CL-06**: plantilla por ruta (§2.1)
- [ ] **API-01**: endpoints deprecated inventariados (OpenAPI)
- [ ] Módulo patrón elegido (§9.5)
- [ ] `AUDITORIA_FRONTEND_[CODIGO].md` iniciado (PROMPT Fase 1)

### §11.2 Gate 1 — Multiempresa (company-scoped)

- [ ] **ME-01** … **ME-06**, **E-ME4**
- [ ] Guards + invalidate (§4.5, §10)
- [ ] **AUTH-01** … **AUTH-04** si flujos auth aplican
- [ ] **IMP-01** … **IMP-03** si ruta accesible en impersonation

### §11.3 Gate 2 — Plantilla A / A+

- [ ] **PA-01** … **PA-09**, **TB-01** … **TB-05**, **ES-01** … **ES-04**, **SK-01** … **SK-03**, **SR-01**, **SR-02**
- [ ] **B11-01** … **B11-09** (§7.1)
- [ ] QA modal 9 casos (`INV_M3_B11_CATALOGS_AUDIT.md`)
- [ ] Catálogos clasificados **A+** (§2.1): verificar además **PA+-01** … **PA+-03** (§5.8)

### §11.4 Gate 3 — Plantilla B

> Gate 3 se evalúa **por ruta** según la plantilla asignada en §2.1 — no exigir ítems B-F en pantallas B-R ni SEC en B-L.

- [ ] **B-L:** **PB-04** … **PB-08**
- [ ] **B-F:** **CD-01** … **CD-11**, **SEC-01** … **SEC-06**
- [ ] **B-R:** **PB-09** … **PB-12**
- [ ] QA B-F (`INV_M2_SEC_QA_BEHAVIOR_MATRIX.md`) — solo rutas **B-F**

### §11.5 Gate 4 — Calidad

- [ ] **RB-01**, **ER-02**, **API-04**, **UX-01** … **UX-04**
- [ ] **PR-01** … **PR-02** si API pagina
- [ ] ESLint + `tsc` sin errores nuevos en módulo
- [ ] Auditoría módulo actualizada; PROMPT Fase 3 sign-off

---

## §12 — Vacíos V1 → V2 resueltos

Resolución de los 12 GAP identificados en [`AUDITORIA_FINAL_V2_GAPS.md`](./AUDITORIA_FINAL_V2_GAPS.md):

| GAP | Resolución V2 |
|-----|---------------|
| GAP-01 Platform | §9.4 PL-01…PL-04 |
| GAP-02 Auth / onboarding | §4.8 AUTH-01…AUTH-05 |
| GAP-03 Paginación | §8.7 PR-01…PR-03 |
| GAP-04 Debounce | §5.3 SR-03 |
| GAP-05 Empty B-L | §6.3 PB-06 + Anexo ES-B |
| GAP-06 useTenantQuery | §4.4 ME-10 |
| GAP-07 Impersonation | §4.8 IMP-01…IMP-04 |
| GAP-08 Workflow dirty motivo | §7.3 SEC-10 + Anexo R-06 |
| GAP-09 PUR/SLS/FIN/LOG | §2.3 — sin GAP |
| GAP-10 Legacy admin | §9.1 AP-12 |
| GAP-11 FormSection cosmético | Anexo M3-R01 |
| GAP-12 Tests form-dirty | Anexo R-10 |

**Veredicto:** Ningún vacío normativo bloquea PUR-M0.

---

## §13 — Control de versión

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | 2026-05-31 | Consolidación IAM + ORG + referencias INV |
| **2.0** | **2026-05-31** | Post-cierre IAM/ORG/INV; Plantillas A/A+/B-*; B.1.1 modal + B-F; AUTH/IMP; Gates; supersede V1 |

### §13.1 Relación documentos derivados

| Documento | Acción pendiente (fuera de este entregable) |
|-----------|-----------------------------------------------|
| `.cursorrules` | v2: pointers §4, §7, §8, §11 + diseño 2 capas |
| `PROMPT_FRONTEND_MAESTRO.md` | v2: Fase 0.4/0.5 → §2; Gates → §11; recortar duplicados |
| `ERP_FRONTEND_STANDARDS_V1.md` | Banner “superseded by V2” |

### §13.2 Próxima revisión sugerida

Tras **PUR-M0** cerrado: validar PL-xx en Platform; evaluar extracción ME-07 / SEC-01 → Anexo EXT-xx.

---

## Anexo A — Deuda normativa (no MUST, no Gate)

Ítems backlog. **No copiar a `.cursorrules` como MUST.**

| ID | Ítem | Origen | Prioridad |
|----|------|--------|-----------|
| **EXT-01** | Extraer `useErpCompanyScope` desde ORG/INV scope hooks | ME-07, INV R-08 | P3 — no bloquea PUR-M0 |
| **EXT-02** | Extraer `useErpTransactionalFormGuard` desde INV | SEC-01, INV closure | P2 antes PUR-M2 |
| **ES-B** | Migrar empty inline B-L a `IamTableEmptyState` | GAP-05, PB-06 | P3 cosmética |
| **R-02** | UX menor catálogos INV | INV closure | P2 |
| **R-03** | UX menor B-R | INV closure | P2 |
| **R-04** | UX menor B-L | INV closure | P2 |
| **R-05** | Performance FK N× GET producto en movimientos | INV closure | P2 |
| **R-06** | Dirty guard en campos motivo anular workflow | GAP-08, SEC-10 | P4 |
| **R-07** | Hardening SEC adicional | INV M2 | P4 |
| **R-08** | Shared scope hook cross-módulo | INV closure | P3 (= EXT-01) |
| **R-09** | Productos: evaluar form en página vs modal XL | INV closure | P3 |
| **R-10** | Tests unitarios `form-dirty/*` | GAP-12 | Calidad |
| **M3-R01** | Cosmética `FormSection` / `DialogBody` modales | GAP-11 | Opcional |
| **DT-01…DT-12** | Deuda ORG (monolitos, debounce, onboarding wizard) | ORG closure | P1–P3 |
| **ORG-07** | Wizard post-onboarding guiado | ORG deuda | P2 |
| **Platform-SEC** | B.1.1 modales super-admin | PL-03 | Sprint dedicado |
| **IAM-ME** | Asignación empresas UI usuarios | IAM | Bloqueado BE |

**Regla Anexo:** ítems aquí **no** son criterio Gate §11 salvo promoción explícita a MUST en revisión mayor.

---

## Índice de referencias cruzadas

```
§2 CL-xx  ←→ §11 Gate 0
§4 ME/AUTH/IMP ←→ §5 PA-09, §6 PB-05, §11 Gate 1
§5 PA/TB/ES/SK/SR ←→ §7.1 B11-xx, §10
§6 CD/PB ←→ §7.2 SEC-xx, §8.1 API-xx
§7 B11/SEC ←→ §9.2 ORG, §9.3 INV
§8 UX/ER/API ←→ §5 PA-08, .cursorrules (link)
§9 ←→ §2 matriz, §10 mapa
§11 ←→ PROMPT Fases 2–3, .cursorrules (link)
Anexo A ←→ §12 GAP resueltos
```

---

## Matriz anti-redundancia interna

| Tema | Hogar único | Otros capítulos |
|------|-------------|-----------------|
| Árbol plantilla | §2.1 | §5/§6 “ver §2.1” |
| ME / E-ME4 | §4 | §5 pointer |
| AUTH / IMP | §4.8 | §4.7 resumen |
| Toolbar A | §5.2 TB-xx | §6 PB-01 contraste |
| B.1.1 modal | §7.1 B11-xx | §5 PA-05 |
| B.1.1 B-F | §7.2 SEC-xx | §6 CD pointer |
| Anti-patrones | §3.2 AP-xx | |
| Componentes rutas | §10 | |
| Checklist | §11 | |
| IAM/ORG/INV | §9 | |
| Vocabulario baja | §8.4 | |
| Deuda | Anexo A | |
| Diseño 2 capas | `.cursorrules` | No en V2 |

---

*Documento normativo V2.0 — write once. Sin modificar `.cursorrules` ni PROMPT en este entregable. Sin código. Sin commit.*
