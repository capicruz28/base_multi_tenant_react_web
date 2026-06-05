# PLATFORM_FINAL_SURFACE_AUDIT.md

**Tema:** Auditoría final de superficie activa — Platform Administration  
**Fecha:** 2026-06-02  
**Tipo:** Auditoría UX/UI y funcional — **sin implementación, sin repair, sin commit**  
**Repositorio:** Frontend únicamente (Backend en repo separado; conclusiones basadas en comportamiento HTTP observable y código FE)

**Normativa:** `ERP_FRONTEND_STANDARDS_V2.md` (§3 AP-xx, §7 B11, §8 UX/ER, §9.4 PL-xx, §10)  
**Referencia Tenant Admin:** IAM (`UserManagementPage`, `IamSearchInput`, `IamTableEmptyState`, B.1.1, `ConfirmDialog`)  
**Mejoras Platform ya cerradas (baseline):** UX-PLAT-P1-01 (B.1.1 Clientes), P1-02 (ConfirmDialog listado clientes), P1-03 (catálogos Desactivar/Reactivar), FIX-ERR-01/02/03 (errores Clientes)

---

## 1. Superficie auditada

| Ruta | Componente | En menú activo declarado |
|------|------------|---------------------------|
| `/super-admin/dashboard` | `SuperAdminDashboard` | Sí |
| `/super-admin/clientes` | `ClientManagementPage` (+ modales Create/Edit embebidos) | Sí |
| `/super-admin/modulos` | `ModuleManagementPage` (+ modales Create/Edit) | Sí |
| `/super-admin/auditoria` | **Sin página ni ruta en `routes.tsx`** | Sí (ítem menú; ver hallazgo P0) |
| `/super-admin/catalogos/paises` | `PaisesPage` | Sí |
| `/super-admin/catalogos/departamentos` | `DepartamentosPage` | Sí |
| `/super-admin/catalogos/provincias` | `ProvinciasPage` | Sí |
| `/super-admin/catalogos/distritos` | `DistritosPage` | Sí |
| `/super-admin/catalogos/monedas` | `MonedasPage` | Sí |

**Fuera de alcance explícito:** `/super-admin/clientes/:id`, `/super-admin/secciones`, `/super-admin/menus`, tabs detalle cliente (conexiones, módulos por tenant).

---

## 2. Resumen ejecutivo

| Dimensión | Estado global |
|-----------|---------------|
| **Clientes (listado + modales)** | **Mejor alineado** post-P1-01/02 + FIX-ERR; referencia Platform más madura |
| **Catálogos globales (×5)** | **Alineados** en Desactivar/Reactivar + `ConfirmDialog` + Ver inactivos (P1-03); deuda en PL-04, ES-01, SK-01, B11, UX-03/04 en modales |
| **Módulos** | **Funcional** con toolbar rica; **desalineado** vs Clientes/Catálogos en confirmaciones, B11, estándares IAM, vocabulario Reactivar |
| **Dashboard** | **Placeholder** con datos hardcodeados — no operativo |
| **Auditoría Global** | **Brecha funcional P0** — servicio FE existe, **no hay pantalla ni ruta** |
| **Cierre formal Platform (§9.4)** | **No alcanzado** — heterogeneidad entre pantallas activas |

**Veredicto:** Superficie **operable** para Clientes y Catálogos; **incompleta** en Dashboard y Auditoría Global; **Módulos** requiere convergencia UX en confirmaciones y estándares V2.

---

## 3. Snapshot por pantalla (12 ejes)

Leyenda: ✅ Alineado · ⚠️ Parcial · ❌ Desalineado · N/A

| Pantalla | Toolbar | Filtros | Búsqueda | Empty | Skeleton | Acciones tabla | ConfirmDialog | Desact./React. | Visual | Navegación |
|----------|---------|---------|----------|-------|----------|----------------|---------------|----------------|--------|------------|
| Dashboard | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | ⚠️ | ✅ |
| Clientes | ⚠️ | ✅ | ✅ debounce | ⚠️ inline | ❌ spinner | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| Módulos | ✅ | ✅ | ✅ debounce | ⚠️ inline | ❌ spinner | ⚠️ sin confirm | ❌ directo | ⚠️ Activar | ⚠️ | ✅ |
| Auditoría Global | — | — | — | — | — | — | — | — | — | ❌ sin ruta |
| Países | ⚠️ | ✅ Ver inact. | ⚠️ client-side | ⚠️ inline | ❌ spinner | ✅ | ✅ | ✅ | ⚠️ Dialog | ✅ |
| Departamentos | ⚠️ | ✅ | ⚠️ client-side | ⚠️ | ❌ | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| Provincias | ⚠️ | ✅ + FK dept. | ⚠️ client-side | ⚠️ | ❌ | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| Distritos | ⚠️ | ✅ + FK prov. | ⚠️ client-side | ⚠️ | ❌ | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| Monedas | ⚠️ | ✅ | ⚠️ client-side | ⚠️ | ❌ | ✅ | ✅ | ✅ | ⚠️ | ✅ |

**Referencia Tenant (IAM):** `IamSearchInput`, `IamTableEmptyState`, skeleton en carga, `ConfirmDialog`, B.1.1 en modales, ER-02 en hooks.

---

## 4. Matriz consolidada de hallazgos

| ID | Pantalla | Eje | Severidad | Tipo | Hallazgo | Recomendación |
|----|----------|-----|-----------|------|----------|---------------|
| **PLAT-SURF-001** | `/super-admin/auditoria` | Navegación / Auditoría | **P0** | Bug funcional | Ítem de menú «Auditoría Global» **sin ruta** en `super-admin/routes.tsx` ni página dedicada. Existe `superadminAuditoriaService` y tab en detalle cliente, pero **no superficie global**. | Crear `AuditoriaGlobalPage` + ruta; reutilizar patrones de `ClientAuditTab` / servicio existente; o retirar ítem del menú hasta implementar. |
| **PLAT-SURF-002** | `/super-admin/dashboard` | Dashboard | **P1** | Bug UX | KPIs, actividad reciente y alertas son **datos estáticos hardcodeados** (`SuperAdminDashboard.tsx`); no hay llamadas API. Usuario ve métricas ficticias. | Integrar endpoints agregados cuando BE los exponga; mientras tanto empty honesto o banner «datos de demostración». |
| **PLAT-SURF-003** | `/super-admin/modulos` | ConfirmDialogs | **P1** | Bug UX | `handleToggleActivation` ejecuta activar/desactivar **sin `ConfirmDialog`** (mutación directa). Riesgo en acción sensible del catálogo maestro de módulos. | Patrón `activeTarget` + `ConfirmDialog` (danger/info) como Clientes/Catálogos P1-02/P1-03. |
| **PLAT-SURF-004** | `/super-admin/modulos` | Reactivación | **P1** | Mejora UX | UI usa **«Activar»** en lugar de **«Reactivar»** (UX-01). Iconografía `RefreshCw` parcialmente alineada; copy no. | Unificar vocabulario Desactivar/Reactivar en títulos, tooltips y toasts. |
| **PLAT-SURF-005** | `/super-admin/modulos` | Modales (B11) | **P1** | Deuda técnica | `CreateModuleModal` / `EditModuleModal` **sin B.1.1** (`OrgDiscardConfirmDialog`, dirty guard). Incumple PL-03 SHOULD y AP-04 para modales multi-campo. | Reutilizar patrón P1-01 Clientes (`useClienteModalDiscard` adaptado o `createOrgDiscardHandlers`). |
| **PLAT-SURF-006** | Todas listas activas | Skeletons (SK-01) | **P2** | Mejora UX | Listados usan **spinner full-block** que oculta tabla (`loading && …` sin `InvTableSkeleton` / `OrgTableSkeleton`). Incumple SK-01 SHOULD / AP-09. | Skeleton de filas manteniendo layout de tabla (PL-04 / §10). |
| **PLAT-SURF-007** | Clientes, Módulos, Catálogos (×5) | Empty states (ES-01) | **P2** | Mejora UX | Empty **inline artesanal** (icono + texto en `<td>`); no `IamTableEmptyState`. Copy y CTA no homogéneos. | Adoptar `IamTableEmptyState` con props por entidad (PL-04). |
| **PLAT-SURF-008** | Clientes, Módulos, Catálogos (×5) | Toolbars (PL-04) | **P2** | Mejora UX | Búsqueda con `<input>` raw; **no** `IamSearchInput` ni `OrgToolbarSearch`. Debounce inconsistente (hook vs `useEffect` manual vs filtro local). | Estandarizar `IamSearchInput` + debounce 500ms; catálogos: evaluar búsqueda server-side si API lo soporta. |
| **PLAT-SURF-009** | Catálogos (×5) vs Clientes/Módulos | Consistencia visual | **P2** | Mejora UX | Catálogos usan **`Dialog` + `Button` shadcn**; Clientes/Módulos usan **modales custom** (`fixed inset-0`, clases manuales). Dos sistemas de modal en la misma superficie. | Plan convergencia visual: un sistema (Dialog shadcn o shell ORG) por tipo de formulario. |
| **PLAT-SURF-010** | `/super-admin/catalogos/paises`, `/monedas` | UX-03 / UX-04 | **P2** | Bug UX | Modales create/edit incluyen **checkbox `es_activo`**. V2: UX-03 MUST NOT en create; UX-04 MUST NOT en edit modal (baja vía tabla). | Quitar checkbox; estado solo vía Desactivar/Reactivar en tabla (ya implementado en listado). |
| **PLAT-SURF-011** | `/super-admin/clientes` (Edit modal) | UX-04 | **P2** | Bug UX | `EditClientModal` expone checkbox **«Cliente activo»** en tab Suscripción pese a Desactivar/Reactivar en listado (P1-02). | Eliminar campo del modal; confiar en toggles de listado. |
| **PLAT-SURF-012** | `/super-admin/modulos` | ER-02 / toasts | **P2** | Deuda técnica | **Doble toast éxito** al crear: `CreateModuleModal` + `handleCreateSuccess` en página. Riesgo AP-11. | Toast único en hook o callback; patrón post-FIX-ERR-02 Clientes. |
| **PLAT-SURF-013** | Catálogos (×5) | ER-02 | **P2** | Deuda técnica | Errores/toasts en **handlers de página** (`catch` + `toast.error`), no hooks React Query. Funciona tras Axios directo; desalineado vs Clientes mutaciones. | Opcional: hooks `useMutation` por catálogo o helper `toastPlatformApiError` (FIX-ERR-05 backlog). |
| **PLAT-SURF-014** | `/super-admin/modulos` | Filtros | **P2** | Mejora UX | Checkbox **«Solo activos»** (semántica invertida vs **«Ver inactivos»** en catálogos). Misma intención, distinto patrón. | Unificar copy y polaridad («Ver inactivos» + `solo_activos: !showInactivos`) en Módulos. |
| **PLAT-SURF-015** | `/super-admin/clientes` | Filtros | **P3** | Mejora UX | Filtros `plan_suscripcion` / `estado_suscripcion` en toolbar **no se envían** al servicio (`ClienteFilters` solo usa `es_activo` + `buscar` en API). Filtro local ausente → **sin efecto** en listado paginado server-side. | Enviar filtros al BE si existen en API; o filtrar client-side sobre página actual con indicador; o quitar controles. |
| **PLAT-SURF-016** | `/super-admin/dashboard` | Navegación / TB-01 | **P3** | Mejora UX | H1 + subtítulo en body (`Dashboard de Super Administrador`). AP-07 / TB-01: título debería vivir en shell/breadcrumb, no en body repetitivo. | Mover título a layout/breadcrumb Platform o alinear con Tenant shells. |
| **PLAT-SURF-017** | Catálogos (×5) | Búsqueda | **P3** | Mejora UX | Búsqueda **100% client-side** sobre lista ya cargada; sin debounce explícito (re-filtra en cada keystroke; impacto bajo en volúmenes pequeños). | Debounce 300–500ms o búsqueda server-side si catálogos crecen. |
| **PLAT-SURF-018** | `/super-admin/catalogos/provincias`, `/distritos` | Filtros | **P3** | Mejora UX | `fetchDepartamentos` / provincias padre **sin `solo_activos`** en combo de FK; pueden aparecer padres inactivos en selects. | Pasar `solo_activos: true` al cargar combos de jerarquía. |
| **PLAT-SURF-019** | `/super-admin/modulos` | Acciones tabla | **P3** | Mejora UX | Icono `Trash2` para desactivar (mismo patrón que Clientes pre-estandarización). Semánticamente confunde con borrado (UX-02). | Preferir icono neutral o mismo set que Catálogos; copy siempre Desactivar. |
| **PLAT-SURF-020** | `/super-admin/clientes` | Mejora implementada | — | — | **Cerrado:** `ConfirmDialog` Desactivar/Reactivar + `pageActionsLocked` + coexistencia B11 (P1-02). | Mantener como referencia. |
| **PLAT-SURF-021** | `/super-admin/clientes` | Modales | — | — | **Cerrado:** B.1.1 Create/Edit con `OrgDiscardConfirmDialog` (P1-01). | Extender patrón a Módulos. |
| **PLAT-SURF-022** | Catálogos (×5) | Desact./React. | — | — | **Cerrado:** P1-03 — Ver inactivos, ConfirmDialog, variant danger/info, loading. | Referencia para Módulos. |
| **PLAT-SURF-023** | `/super-admin/clientes` | Errores | — | — | **Cerrado:** FIX-ERR-01/02 — Axios sin wrap, ER-02 create vía hook, mensajes API en toasts. | FIX-ERR-04 (422 por campo) backlog. |
| **PLAT-SURF-024** | `/super-admin/modulos` | Deuda técnica | **P3** | Deuda técnica | Modales create/edit: toast error en **componente** (`getErrorMessage` en catch), no hook centralizado. | Alinear con hooks mutación cuando se refactorice Módulos. |
| **PLAT-SURF-025** | Global Platform shell | Navegación | **P2** | Mejora UX | Rutas huérfanas en router (`/secciones`, `/menus`, …) redirigen a dashboard vía `*`; no están en menú activo pero existen en código — riesgo de enlaces legacy. | Documentar como legacy o redirects explícitos 410; fuera de superficie activa. |

---

## 5. Análisis por eje transversal

### 5.1 Toolbars

- **Clientes:** barra única (búsqueda + 3 selects + refresh + CTA). Funcional; no usa componentes IAM/ORG.
- **Módulos:** toolbar **más completa** (categoría, solo activos, límite página, vista tabla/grid, export CSV/Excel). Mejor densidad operativa; menos alineada visualmente con Clientes.
- **Catálogos:** patrón homogéneo entre los 5 (búsqueda + Ver inactivos + refresh + Nuevo). **Mejor cohesión interna** que Clientes↔Módulos.

### 5.2 Filtros y búsquedas

- **Server-side:** Clientes (paginación), Módulos (paginación + filtros API), Catálogos jerárquicos (Provincias/Distritos con FK).
- **Gap:** filtros plan/estado en Clientes (PLAT-SURF-015); semántica invertida Módulos vs Catálogos (PLAT-SURF-014).

### 5.3 Estados vacíos y skeletons

- Ninguna pantalla activa usa `IamTableEmptyState` ni `InvTableSkeleton`.
- Patrón dominante: **ocultar tabla + spinner centrado** → SK-01 / AP-09.

### 5.4 ConfirmDialogs y baja lógica

| Pantalla | Desactivar | Confirmación |
|----------|------------|--------------|
| Clientes listado | ✅ | ✅ ConfirmDialog |
| Catálogos ×5 | ✅ | ✅ ConfirmDialog |
| Módulos | ✅ endpoint | ❌ sin confirm |

### 5.5 Dashboard

- Tarjetas y listas de actividad **no reflejan estado real** del tenant platform.
- No cumple expectativa de «visión general» para operador Platform.

### 5.6 Auditoría Global

- **Servicio:** `src/services/superadmin-auditoria.service.ts` → `/superadmin/auditoria/*`.
- **UI global:** ausente.
- **UI parcial:** `ClientAuditTab` en detalle cliente (fuera de superficie listada, pero única implementación FE de auditoría super-admin).
- **Impacto:** ítem de menú probablemente lleva a **404 o redirect** a dashboard (`path: '*'`).

### 5.7 Consistencia vs Tenant Administration

| Patrón IAM/Tenant | Clientes | Catálogos | Módulos |
|-------------------|----------|-----------|---------|
| `IamSearchInput` | ❌ | ❌ | ❌ |
| `IamTableEmptyState` | ❌ | ❌ | ❌ |
| Table skeleton | ❌ | ❌ | ❌ |
| B.1.1 modales | ✅ | ❌ | ❌ |
| ConfirmDialog baja | ✅ | ✅ | ❌ |
| ER-02 hooks | ✅ (create/edit/toggle) | ⚠️ página | ⚠️ mixto |

---

## 6. Priorización backlog sugerido

| Prioridad | IDs | Tema |
|-----------|-----|------|
| **P0** | PLAT-SURF-001 | Pantalla Auditoría Global + ruta |
| **P1** | PLAT-SURF-002, 003, 004, 005 | Dashboard real; ConfirmDialog Módulos; Reactivar copy; B11 Módulos |
| **P2** | PLAT-SURF-006…014, 025 | Skeleton/empty/toolbar; UX-03/04 modales; toasts; filtros; visual |
| **P3** | PLAT-SURF-015…019, 024 | Filtros clientes; títulos; FK combos; iconografía |

---

## 7. Conclusión de cierre Platform

| Pregunta | Respuesta |
|----------|-----------|
| ¿Platform Administration cerrado vs V2? | **No** — brechas P0 (Auditoría), P1 (Dashboard, Módulos confirm/B11) |
| ¿Referencia interna más madura? | **`/super-admin/clientes`** (listado + modales + errores) |
| ¿Catálogos alineados entre sí? | **Sí** (post-P1-03) |
| ¿Listo para operación diaria? | **Parcial** — Clientes/Catálogos sí; Dashboard/Auditoría/Módulos con reservas |
| **Próximo documento sugerido** | Ticket implementación PLAT-SURF-001 + PLAT-MOD-CONFIRM (003/004) |

---

## 8. Referencias de código (evidencia)

**Auditoría sin ruta:**

```127:127:src/features/super-admin/routes.tsx
    { path: '*', element: <Navigate to="/super-admin/dashboard" replace /> },
```

(No existe `path: 'auditoria'`.)

**Dashboard datos estáticos:**

```17:27:src/features/super-admin/dashboard/pages/SuperAdminDashboard.tsx
  const stats = {
    totalClientes: 5,
    clientesActivos: 4,
    ...
  };
```

**Módulos — toggle sin confirm:**

```178:188:src/features/super-admin/modulos/pages/ModuleManagementPage.tsx
  const handleToggleActivation = async (modulo: ModuloV2) => {
    try {
      if (modulo.es_activo) {
        await moduloV2Service.deactivateModulo(modulo.modulo_id);
```

**Clientes — patrón objetivo ConfirmDialog:**

```504:516:src/features/super-admin/clientes/pages/ClientManagementPage.tsx
      <ConfirmDialog
        isOpen={!!activeTarget && !!activeAction && clienteDiscardPending === null}
        ...
        confirmText={activeAction === 'reactivate' ? 'Reactivar' : 'Desactivar'}
```

**Catálogos — Ver inactivos + ConfirmDialog (PaisesPage representativo):**

```171:179:src/features/super-admin/catalogos/pages/PaisesPage.tsx
          <label className="flex items-center gap-2 ...">
            <input type="checkbox" checked={showInactivos} ... />
            <span className="text-sm text-text-soft">Ver inactivos</span>
```

---

*Fin de auditoría — PLATFORM_FINAL_SURFACE_AUDIT.md*
