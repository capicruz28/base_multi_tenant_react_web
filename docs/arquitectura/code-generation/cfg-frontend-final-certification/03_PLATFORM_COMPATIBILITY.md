# CFG Frontend — Compatibilidad de plataforma

**Versión:** 1.0  
**Fecha:** 2026-07-18

---

## 1. ERP Shell (`/app`)

| Capacidad | Integración CFG | Resultado |
|-----------|-----------------|:---------:|
| Lazy feature under AppLayout | `cfg/*` en `app-route-tree` | PASS |
| PermissionGuard módulo | `module="cfg" action="ver"` | PASS |
| Post-login / legacy segments | `'cfg'` en `ERP_ROUTE_SEGMENTS` | PASS |
| Catálogo módulos | `ERP_MODULES` entrada CFG | PASS |
| Sin shell paralelo / ruta huérfana | Única ruta listado | PASS |

---

## 2. Compatibilidad ORG

| Patrón ORG reutilizado | Uso CFG | Resultado |
|------------------------|---------|:---------:|
| `OrgPageLayout` | Page | PASS |
| `OrgToolbarSearch` | Toolbar buscar | PASS |
| `OrgDiscardConfirmDialog` + `createOrgDiscardHandlers` | B11 Edit | PASS |
| `FormSection` / `orgDialogGuardProps` / `isDirtyAgainstBaseline` | Edit Dialog | PASS |
| Vocabulario Desactivar/Reactivar | Lifecycle | PASS |

**No invasión:** CFG no modifica dominio ORG ni consume endpoints ORG para su CRUD. Solo reutiliza primitives UX.

---

## 3. Compatibilidad INV

| Patrón INV | Uso CFG | Resultado |
|------------|---------|:---------:|
| Plantilla catálogo A/A+ | Sí | PASS |
| `InvTableSkeleton` vía `ErpListTableShell` | Loading | PASS |
| RB-ROW + ConfirmDialog | Lifecycle | PASS |
| Sin acoplar FCE INV (`@/core/codigo`) | Explicitamente ausente | PASS |

CFG **administra** secuencias; no compite con el Motor de Códigos en formularios Create de otros módulos.

---

## 4. Compatibilidad WMS / otros ERP

| Criterio | Resultado |
|----------|:---------:|
| Mismo stack listados Tier B (`useErpListQuery`, `normalizeListResponse`) | PASS |
| Sin gates empresa ajenos al dominio CFG | PASS |
| Permisos namespaced `cfg.secuencias.*` | PASS |
| No dependencia de features WMS | PASS |

---

## 5. Auth / sesión multi-tenant

| Evento | Comportamiento | Resultado |
|--------|----------------|:---------:|
| Cambio empresa (`org-inv`) | Invalida ORG + INV + **CFG** | PASS |
| Cambio tenant / clear-all | `queryClient.clear()` | PASS |
| Full session apply | clear + invalidate módulos | PASS |

Impacto: CFG es tenant-first; invalidar en cambio de empresa es correcto (labels/scope EMPRESA) según Readiness §14.

---

## 6. Design system (2 capas)

| Regla | Resultado |
|-------|:---------:|
| Estructura con tokens Capa 1 | PASS |
| Guardar con `bg-brand-primary` | PASS |
| Badges semánticos success/error/warning/info | PASS |
| Sin gray/slate hardcode estructural en feature | PASS (inspección) |

---

## 7. Dictamen compatibilidad

**PASS** — CFG se integra como módulo ERP de primera clase sin romper ORG/INV/WMS ni el shell.
