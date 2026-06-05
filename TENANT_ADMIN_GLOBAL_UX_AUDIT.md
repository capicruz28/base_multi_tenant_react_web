# Auditoría global UX/UI — Administración del tenant

**Fecha:** 31 mayo 2026  
**Estado:** Análisis completado — **sin implementación**  
**Contexto:** IAM cerrado (Sprints A–D + B.1.1 overlay). RBAC V1 y multiempresa JWT validados en QA.

**Alcance auditado:**

| Incluido | Excluido |
|----------|----------|
| Dashboard / home tenant | INV, SLS, PUR, MFG, HCM, FIN, LOG, etc. |
| Navegación admin + ORG + shells | Super-admin operativo detallado |
| `/admin/*` (usuarios, roles, sesiones, rutas huérfanas) | Cambios backend / contratos API |
| `/app/org/*` (empresa, sucursales, estructura, parámetros) | RBAC runtime, PermissionGuard, AuthContext |
| Onboarding, selección empresa, empty/loading/feedback | |

**Referencias:** `TENANT_ADMIN_UX_ARCHITECTURE.md`, `FRONTEND_TENANT_MULTIEMPRESA_UX_AUDIT.md`, `IAM_UX_FOUNDATION_IMPLEMENTATION_PLAN.md`, `docs/frontend/modulos/ORG_ETAPA_C_UX.md`.

---

## 1. Resumen ejecutivo

| Dominio | Madurez UX (1–5) | Estado |
|---------|------------------|--------|
| **IAM** (`/admin` usuarios, roles, permisos) | **4.5** | Cerrado Sprints A–D |
| **ORG** (`/app/org/*`) | **3.0** | Funcional JWT-driven (Etapa C); deuda visual y modales |
| **Navegación / shells** | **2.5** | Dos shells + `ShellCrossNav`; sin hub admin |
| **Onboarding tenant** | **2.5** | Pantallas mínimas; sin wizard guiado |
| **Dashboard tenant** | **1.0** | `Home` placeholder; admin index → usuarios |
| **Sesiones activas** | **3.0** | Cards útiles; fuera del sistema de diseño IAM |

**Veredicto:** El mayor retorno del **siguiente frente UX** está en **Organización (ORG)** aplicando el **patrón IAM ya pagado** (componentes `iam/*`, empty states, búsqueda, dirty B.1.1 en dialogs), más un **hub de administración** y **onboarding guiado** de bajo riesgo. **Multiempresa en usuarios** sigue siendo el gap funcional P0 pero **bloqueado por contrato API** — no debe competir con el siguiente sprint solo-FE.

---

## 2. Mapa del área administrativa

```mermaid
flowchart TB
  subgraph entry [Entrada tenant_admin]
    Login[Login]
    Onb[/app/onboarding]
    Sel[/app/seleccionar-empresa]
    Post[resolvePostLoginPath]
  end

  subgraph shell_admin [Shell /admin — requireTenantAdmin]
    U[Usuarios ✅]
    R[Perfiles + Permisos ✅]
    S[Sesiones activas]
    H[areas/menus — huérfanas]
  end

  subgraph shell_app [Shell /app — org.ver + tenant_admin]
    E[Empresa / catálogo]
    Co[Sucursales · Deptos · Cargos · CC]
    P[Parámetros híbrido]
  end

  subgraph nav [Puente]
    XNav[ShellCrossNav]
  end

  Login --> Onb --> E
  Login --> Sel --> Post
  Post --> shell_admin
  Post --> shell_app
  shell_admin <--> XNav <--> shell_app
```

---

## 3. Inventario por superficie

### 3.1 IAM — cerrado (referencia)

| Pantalla | Patrones modernos | Notas |
|----------|-------------------|-------|
| `UserManagementPage` | Dialog shadcn, discard B.1.1, `IamSearchInput`, `IamTableEmptyState`, roles checkbox | Multiempresa UI pendiente (API) |
| `RoleManagementPage` | Paridad usuarios + métricas + CTA permisos | — |
| `RolePermissionsManager` | Tabs Acciones/Pantallas, agrupación, guardado unificado, overlay B.1.1 | LBAC solo Ver (FE-2) |

**No reabrir IAM salvo multiempresa (Fase BE) o FE-2 LBAC ampliado.**

---

### 3.2 Dashboard y entrada

| Elemento | Ubicación | Hallazgo | Prioridad |
|----------|-----------|----------|-----------|
| Home ERP | `/app/home` | Solo título “Bienvenido…” | P2 |
| Admin index | `/admin` → redirect `usuarios` | Sin hub ni checklist configuración | **P1** |
| Post-login tenant_admin | `post-login-path.ts` | Primer ítem menú `/admin` o `/app`; impredecible sin menú backend | P1 |
| Post-selección empresa | `resolvePostEmpresaSelectionPath` | Fuerza `/app/home` vs destino admin natural | P1 |

---

### 3.3 Navegación administrativa

| ID | Hallazgo | Impacto |
|----|----------|---------|
| **NAV-01** | **Dos shells** (`/admin` IAM vs `/app/org` estructura) | Alto — admin no sabe dónde crear empresa vs usuario |
| **NAV-02** | **`ShellCrossNav`** como puente principal | Medio — depende del orden de ítems en `/auth/menu` |
| **NAV-03** | Rutas **`/admin/areas`**, **`/admin/menus`** registradas, ocultas en sidebar | Medio — bookmarks peligrosos (`MenuManagementPage`) |
| **NAV-04** | `adminMenu.ts` estático **duplicado** vs menú dinámico | Bajo — deuda/confusión dev |
| **NAV-05** | Sin ítems ORG bajo sidebar admin (requiere BE `menu_scope`) | Alto para Fase 1 arquitectura |

---

### 3.4 Organización (ORG)

| Página | Líneas aprox. | Toolbar ORG | Empty state | Búsqueda | Dialogs | Dirty B.1.1 |
|--------|---------------|-------------|-------------|----------|---------|-------------|
| `EmpresaPage` | ~1 570 | Parcial | Texto en fila | Sí | shadcn | **No** |
| `SucursalesPage` | ~690 | `OrgCompanyToolbar` | Texto | Sí | shadcn | **No** |
| `DepartamentosPage` | ~400 | Sí | Texto | Sí | shadcn | **No** |
| `CargosPage` | ~420 | Sí | Texto | Sí | shadcn | **No** |
| `CentrosCostoPage` | ~380 | Sí | Texto | Sí | shadcn | **No** |
| `ParametrosPage` | ~545 | Sí + tabs híbrido | Texto | Sí | shadcn | **No** |

**Fortalezas ORG (mantener):**

- JWT-driven Etapa B/C: `OrgCompanyRouteGuard`, banner empresa, `useOrgScopeEmpresaReset`, sin selector manual cross-company.
- `ParametrosPage`: tabs efectivo/global/override, badges alcance, hints precedencia — **mejor UX del módulo**.
- `ConfirmDialog` en eliminaciones; React Query en hooks.
- Permisos LBAC `can('org', crear|editar|eliminar)` en botones.

**Debilidades ORG (oportunidad):**

| ID | Hallazgo | Riesgo |
|----|----------|--------|
| **ORG-01** | Empty states = **una celda de texto** sin icono ni CTA | Medio — contraste con IAM |
| **ORG-02** | **Sin skeleton** de tabla (solo `Loader` página) | Medio — percepción lentitud |
| **ORG-03** | **Dialogs sin dirty confirm** (`onOpenChange` cierra directo) | **Alto** — mismo bug pre-B.1.1 IAM |
| **ORG-04** | **`EmpresaPage` monolito** (~1 570 líneas, formularios largos) | Alto — mantenimiento y UX abrumadora |
| **ORG-05** | Inputs con clases locales duplicadas vs `iam-form-classes` | Bajo — inconsistencia visual |
| **ORG-06** | Parámetros: UI no muestra **valor efectivo vs definición** lado a lado (doc Etapa D) | Medio — admin no valida override |
| **ORG-07** | Onboarding empresa: modal create tras `?onboarding=true` sin **wizard** ni pasos siguientes | Alto — tenant nuevo perdido post-empresa |
| **ORG-08** | Cambio empresa en header resetea filtros pero **sin aviso** si formulario abierto | Medio — pérdida datos (RO-06 multiempresa audit) |

---

### 3.5 Onboarding y multiempresa (flujos)

| Paso | Componente | UX actual | Gap |
|------|------------|-----------|-----|
| Sin empresa (admin) | `OnboardingEmpresaPage` | Card + CTA crear | Sin logout visible; sin ayuda |
| Crear primera empresa | `EmpresaPage?onboarding=true` | Formulario completo en dialog | Abrumador; no guía “siguiente: usuario/rol” |
| Selección login | `SeleccionarEmpresaPage` | Lista empresas | OK; empty sin empresas mejorable (P0-3 audit previo) |
| Cambio empresa | `EmpresaSelector` + ORG banner | OK técnico | Admin `/admin` no muestra scope tenant vs empresa |

---

### 3.6 Sesiones activas y rutas huérfanas

| Página | UX | Recomendación |
|--------|-----|---------------|
| `ActiveSessionsPage` | Cards, búsqueda manual, auto-refresh opcional, `ConfirmDialog` revocar | Pulido P2: `IamSearchInput`, empty state IAM |
| `MenuManagementPage` | Legacy tenant — edita estructura global | **Redirect** a super-admin o 403 copy (P0-5) |
| `AreaManagementPage` | Legacy | Deprecar / redirect (Fase 2 arquitectura) |

---

### 3.7 Mensajería y feedback

| Patrón | IAM | ORG | Admin sesiones |
|--------|-----|-----|----------------|
| Toast éxito/error | Sí | Sí | Sí |
| Errores API humanizados | `getErrorMessage` | Sí | Sí |
| Inline validación 422 | Usuarios | Empresa (sí) | — |
| Banner scope | — | `OrgActiveEmpresaBanner` | — |
| Loading auth-aware | Sí | Parcial (query) | Sí |

---

## 4. Matriz de madurez (objetiva)

| Criterio | IAM | ORG | Nav/Hub | Onboarding |
|----------|-----|-----|---------|------------|
| Jerarquía visual clara | ✅ | ⚠️ tablas densas | ❌ | ⚠️ |
| Empty states accionables | ✅ | ❌ | ❌ | ⚠️ |
| Búsqueda consistente | ✅ | ⚠️ local | — | — |
| Modales seguros (B.1.1) | ✅ | ❌ | — | — |
| Copy no técnico | ✅ | ⚠️ códigos parámetros | ⚠️ | ✅ simple |
| Multiempresa comprensible | ❌ API | ✅ JWT ORG | ❌ | ⚠️ |
| RBAC V1 compatible | ✅ | ✅ (LBAC org) | — | — |

---

## 5. Comparativa: ¿qué frente sigue?

| Opción | Retorno UX | Esfuerzo | Solo FE | Depende BE | Riesgo regresión |
|--------|------------|----------|---------|------------|------------------|
| **A. ORG UX Foundation** | **Muy alto** | 2–3 sprints | ✅ | No | Bajo (patrones probados) |
| **B. Hub admin + menú unificado** | Alto estratégico | 1–2 sprints | Parcial | **Sí** (ítems menú) | Bajo |
| **C. Onboarding guiado tenant** | Alto nuevos tenants | 1 sprint | ✅ | No | Bajo |
| **D. Multiempresa IAM usuarios** | **Crítico funcional** | 2 sprints | No | **Sí** | Medio |
| **E. ActiveSessions + deprecar menus/areas** | Medio | 0.5 sprint | ✅ | No | Bajo |
| **F. Home / dashboard ERP** | Bajo admin | 0.5 sprint | ✅ | No | Bajo |

---

## 6. Recomendación: siguiente roadmap

### 🥇 Prioridad 1 — **Sprint E: ORG UX Foundation** (recomendado iniciar ya)

**Por qué:** Reutiliza **100 % infra IAM** ya validada; cubre **6 pantallas** que el tenant admin usa diariamente junto a IAM; elimina **riesgo overlay** antes de que QA lo reporte en ORG; no toca APIs ni RBAC runtime.

| ID | Entregable | Criterio |
|----|------------|----------|
| **E1** | Extraer `OrgTableEmptyState` (wrapper `IamTableEmptyState` + copy ORG) | Paridad visual IAM en las 6 tablas |
| **E2** | `IamSearchInput` en toolbars ORG (reemplazar inputs locales) | Misma UX debounce donde aplique |
| **E3** | **Dirty + discard B.1.1** en create/edit dialogs (todas las páginas ORG) | QA overlay igual que Sprint D |
| **E4** | Skeleton tabla ligero (patrón `InvTableSkeleton` o filas placeholder) | Sin flash vacío |
| **E5** | Refactor **fase 1** `EmpresaPage`: split formulario create/edit en componentes | Reducir monolito; onboarding más mantenible |
| **E6** | Banner / hint **ámbito**: “Datos de la empresa activa: {nombre}” alineado con header | Cierra ORG-08 parcial + P1-4 admin |
| **E7** | `ParametrosPage`: fila “valor efectivo” read-only cuando tab effective (si API ya lo devuelve) | Sin cambio contrato si campo existe |

**Estimación:** 2–3 semanas dev + QA.  
**Excluido en E:** cambiar guards ORG, query keys, payloads JWT.

---

### 🥈 Prioridad 2 — **Sprint F: Tenant Admin Hub + navegación** (paralelo ligero o tras E1–E3)

| ID | Entregable | Dependencia |
|----|------------|-------------|
| **F1** | Página `/admin/inicio` — cards: Usuarios, Perfiles, Empresas, Parámetros, Sesiones | Solo FE si rutas hardcode tenant_admin |
| **F2** | Redirect admin index → `/admin/inicio` | — |
| **F3** | Backend: ítems menú `menu_scope=admin` → `/app/org/*` | **BE menú** |
| **F4** | Redirect `/admin/menus` → mensaje + link super-admin | Solo FE |
| **F5** | Post-login / post-selección: tenant_admin con menú admin → hub o primer admin | Ajuste `post-login-path.ts` |

**Estimación:** 1 sprint FE + coordinación menú BE.

---

### 🥉 Prioridad 3 — **Sprint G: Onboarding guiado** (alto valor nuevos tenants)

| ID | Entregable |
|----|------------|
| **G1** | Wizard 3–4 pasos post-`OnboardingEmpresaPage`: Empresa → (opcional) Sucursal → Usuario → Perfil |
| **G2** | Tras crear empresa onboarding: CTA “Invitar usuario” / “Configurar perfil” (deep links existentes) |
| **G3** | Logout visible en onboarding y selección empresa |

**Estimación:** 1 sprint. Compatible RBAC V1 (usa pantallas existentes).

---

### ⏸️ En espera de backend

| Tema | Motivo |
|------|--------|
| **Multiempresa IAM** (empresas por usuario) | Sin UI útil sin API asignación; P0 funcional pero no sprint solo-FE |
| **Alias `/admin/organizacion/*`** | Fase 5 arquitectura — post hub estable |

---

## 7. Orden sugerido (12 semanas orientativo)

```text
Semanas 1–3:  Sprint E (ORG UX Foundation) — E1→E4, luego E3 QA overlay
Semanas 3–4:  Sprint E5–E7 (EmpresaPage split + parámetros + ámbito)
Semanas 5–6:  Sprint F (Hub + redirects menus/areas) + BE menú si listo
Semanas 7–8:  Sprint G (Onboarding guiado)
Backlog:      Multiempresa IAM cuando API lista; FE-2 LBAC checkboxes
```

---

## 8. Checklist QA — validación cierre área admin (post E+F)

### ORG

- [ ] Empty states con icono + CTA crear donde `can('org','crear')`
- [ ] Cancelar dialog con cambios → confirm → sin overlay bloqueado
- [ ] Cambiar empresa en header con modal abierto → comportamiento definido (warn o reset)
- [ ] Parametros: alcance visible; valor efectivo legible si E7

### Navegación

- [ ] tenant_admin encuentra Empresas sin depender solo de CrossNav
- [ ] `/admin/menus` no editable por tenant o redirect claro

### IAM (regresión)

- [ ] Sin regresión Sprints B–D en usuarios/perfiles/permisos

---

## 9. Conclusión para decisión de producto

| Pregunta | Respuesta |
|----------|-----------|
| ¿IAM listo? | **Sí** — base de diseño para el resto del tenant admin |
| ¿Siguiente mayor retorno solo-FE? | **Sprint E — ORG UX Foundation** |
| ¿Qué no hacer ahora? | Reabrir `RolePermissionsManager`; iniciar módulos ERP |
| ¿Qué desbloquear con BE? | Menú admin→ORG (F3); multiempresa usuarios (D) |
| ¿Riesgo latent crítico en ORG? | **Dialogs sin B.1.1** — corregir en E3 con prioridad |

---

*Documento de auditoría global. Sin implementación. Sin commit.*
