# CFG Readiness — Architecture Review

**Versión:** 1.0

---

## 1. Encaje en arquitectura React del proyecto

| Capa proyecto | Plan CFG | ¿Compatible? |
|---------------|----------|:------------:|
| Feature modules `src/features/<mod>` | `src/features/cfg` | Sí |
| Shell `/app` + AppLayout | D1 / T1 | Sí |
| Lazy routers en `app-route-tree` | Spec W0.11 | Sí |
| `PermissionGuard` LBAC | D9 | Sí |
| `usePermission` códigos | D10 / WMS pattern | Sí |
| Axios service layer | `cfg-secuencias.service` | Sí |
| React Query + useTenantQuery | Blueprint 05 | Sí |
| ErpList Tier B | forcePagination | Sí (`ErpListResourceConfig` lo soporta) |
| Tokens Capa 1/2 | Diseño funcional | Sí |
| FCE `src/core/codigo` | Excluido del admin | Sí (separación correcta) |

**Veredicto §3:** PASS — el plan no introduce shell nuevo, codegen, ni bypass del service layer.

---

## 2. Consistencia con ORG

| Patrón ORG | Uso CFG | Estado |
|------------|---------|--------|
| Catálogo modal A+ | Edit Dialog | Alineado |
| Dirty B.1.1 + OrgDiscardConfirmDialog | W4 Spec | Alineado |
| FormSection / discard handlers | Spec imports | Alineado |
| Desactivar/Reactivar vocabulario | D14 | Alineado |
| `OrgPageLayout` wrapper | Spec page | Alineado |
| Company gate | **No** usado (tenant-first) | Correcto — no forzar ORG company |

**Veredicto §4:** PASS — se reutiliza UX ORG sin importar scope company incorrecto.

---

## 3. Consistencia con INV

| Patrón INV | Uso CFG | Estado |
|------------|---------|--------|
| `use*ErpList` + `CATEGORIAS_LIST_CONFIG` | `useCfgSecuenciasErpList` + `SECUENCIAS_LIST_CONFIG` | Alineado |
| `forcePagination: true` Tier B | Spec/Blueprint | Alineado |
| `normalizeListResponse` vía ErpList | Impl implícita | Alineado |
| `invalidate-inv-queries` mirror | `invalidate-cfg-queries` | Alineado |
| InvTableSkeleton | vía ErpListTableShell | Alineado |
| Company query gate | **Prohibido** en CFG | Correcto |

**Veredicto §5:** PASS — stack listados INV sin copiar company gate.

---

## 4. Consistencia con WMS

| Patrón WMS | Uso CFG | Estado |
|------------|---------|--------|
| `hasPermission('wms.*.*')` | `cfg.secuencias.*` | Alineado |
| Constants permissions file | `cfg-permissions.ts` | Alineado |
| Local-state fetch pages | **No** como plantilla datos | Correcto (Spec/Blueprint prohíben) |
| PermissionGuard módulo + códigos acción | Dual D9/D10 | Alineado |

**Veredicto §6:** PASS — se toma RBAC dotted de WMS, no su stack de datos legacy.

---

## 5. Separación FCE vs CFG Admin

Documentado de forma consistente en Audit, Diseño (D12), Blueprint (T/MUST NOT), Spec (imports prohibidos).

**Riesgo residual:** baja — depende de disciplina de review (guardrail Spec 10).

---

## 6. Conclusión arquitectura

La documentación describe un feature **isomorfo** a módulos ERP maduros. No requiere refactor Baseline V1 ni cambios de AuthContext shell. Listo arquitectónicamente para Wave 0.
