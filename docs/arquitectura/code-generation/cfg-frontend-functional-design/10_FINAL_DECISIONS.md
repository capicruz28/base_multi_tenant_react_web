# CFG — Acta de decisiones finales y readiness

**Versión:** 1.0  
**Fecha:** 2026-07-17  
**Estado:** **DISEÑO FUNCIONAL CERRADO**

Este documento cierra todas las decisiones abiertas de la auditoría AS-IS y certifica que el diseño funcional está completo para Blueprint técnico.

---

## 1. Matriz de decisiones (cerradas)

| ID | Tema | Decisión final | Doc |
|----|------|----------------|-----|
| **D1** | Shell | ERP `/app` + `AppLayout` | 02 |
| **D2** | Ruta SPA | `/app/cfg/secuencias` única | 01, 02 |
| **D3** | Menú | Ítem “Secuencias de código” → D2 (Backend menu) | 02 |
| **D4** | Plantilla | A/A+ · listado Tier B · siempre `page` | 03 |
| **D5** | Detalle | Dialog edición (no página `:id`) | 02, 04 |
| **D5b** | Post-PATCH | Dialog permanece abierto; baseline reset | 04 |
| **D6** | Preview | Dialog propio; puede apilarse sobre Edit | 02, 05 |
| **D7** | Scope datos | Tenant-first; sin company query gate | 07 |
| **D8** | Filtro `empresa_id` | **Omitido en toolbar MVP**; usar `scope_type` + detalle | 03 |
| **D9** | RBAC ruta | `PermissionGuard(cfg,ver)` + gate `consultar` | 06 |
| **D10** | RBAC mutación | `hasPermission(actualizar)` + `!config_locked` | 06 |
| **D11** | Create | No existe en UI | 03 |
| **D12** | FCE | Separado; no admin vía `core/codigo` | 09 |
| **D13** | Soft lifecycle | DELETE + POST reactivar; nunca PATCH `es_activo` | 01, 04 |
| **D14** | Vocabulario | Desactivar / Reactivar | 03, 04 |
| **D15** | Sort default | `sequence_key` asc | 03 |
| **D16** | Limit default | 50 (25/50/100) | 03 |
| **D17** | Filtro estado default | Activas (`es_activo=true`) | 03 |
| **D18** | Preview cache | No invalidar list/detail; resultado efímero | 05, 07 |
| **D19** | Confirm stack | Cerrar Edit antes de Confirm baja/reactivar (B11-11) | 02, 04 |
| **D20** | Dirty | B.1.1 ORG helpers en Edit | 04 |

---

## 2. Cobertura de los 28 puntos del objetivo

| # | Requisito | Documento |
|---|-----------|-----------|
| 1 | Flujo navegación | 01, 02 |
| 2 | Menú ERP | 02, D3 |
| 3 | Arquitectura pantallas | 02 |
| 4 | Layout | 02 |
| 5 | Toolbar | 03 |
| 6 | Filtros | 03, D8 |
| 7 | Columnas | 03 |
| 8 | Ordenamiento | 03 |
| 9 | Paginación | 03 |
| 10 | Estados visuales | 03, 04, 05 |
| 11 | Empty states | 03 |
| 12 | Loading states | 03, 04, 05 |
| 13 | Error states | 01, 03, 04, 05 |
| 14 | Badges | 03, 04 |
| 15 | Dialog edición | 04 |
| 16 | Dialog Preview | 05 |
| 17 | Confirm Desactivar | 04 |
| 18 | Confirm Reactivar | 04 |
| 19 | RBAC UI | 06 |
| 20 | React Query conceptual | 07 |
| 21 | Flujos 6 endpoints | 01, 03–05, 07 |
| 22 | UX refresco | 07 |
| 23 | Invalidación cache | 07 |
| 24 | Responsive | 08 |
| 25 | Accesibilidad | 08 |
| 26 | Consistencia V2 | 00, 03, 04 |
| 27 | Componentes reutilizados | 09 |
| 28 | Componentes nuevos | 09 |

---

## 3. Alineación V2 (checklist de diseño)

| Área | IDs | Estado diseño |
|------|-----|:-------------:|
| Multiempresa toolbar | ME-02 | Cubierto (D8) |
| Toolbar / body | TB-01, TB-02 | Cubierto |
| Search / empty | SR-01…03 | Cubierto |
| Skeleton / empty | SK-01, ES-01 | Cubierto |
| Listados | LR-01, LR-N01, PR-01 | Cubierto |
| Row actions | RB-ROW-01…03 | Cubierto |
| Dirty / confirm | B11-01…11 | Cubierto |
| Vocabulario | UX-01 | Cubierto |
| Errores | ER-01, ER-02 | Cubierto |
| UUID UI | E-ME4 | Cubierto |
| Branding | BR / Capa 1–2 | Cubierto |

---

## 4. Flujos endpoint — tabla maestra

| Endpoint | UI trigger | Success UX | Cache |
|----------|------------|------------|-------|
| GET list | Mount / filtros / page / sort | Tabla + paginación | Query list |
| GET detail | Abrir Edit | Form poblado | Query detail |
| PATCH | Guardar | Toast + form update | Invalidate list; set detail |
| DELETE | Confirm Desactivar | Toast + list refresh | Invalidate list+detail |
| POST reactivar | Confirm Reactivar | Toast + list refresh | Invalidate list+detail |
| POST preview | Preview Dialog | Estimación + disclaimer | Sin invalidate list/detail |

---

## 5. Prerequisitos para Blueprint / implementación (no son gaps de diseño)

| # | Prerequisito | Bloquea diseño? | Bloquea Blueprint? | Bloquea código? |
|---|--------------|:---------------:|:------------------:|:---------------:|
| P1 | Snapshot OpenAPI CFG en repo | No | Parcial (tipos) | Sí para tipado estricto |
| P2 | Registrar `CFG` en `ERP_MODULES` + `ERP_ROUTE_SEGMENTS` | No | No (es parte del Blueprint) | Parte de impl |
| P3 | Ítem menú Backend “Secuencias de código” | No | No | Sí para QA E2E menú |
| P4 | Roles con `cfg.secuencias.*` + LBAC `cfg.ver` alineados | No | Documentar en Blueprint | Sí para QA RBAC |

Ninguno reabre una decisión UX de este paquete.

---

## 6. Fuera de alcance MVP (ratificado)

- Crear / borrar físico / align / diagnóstico / series fiscales.
- Filtro UI `empresa_id`.
- Página detalle dedicada.
- Export / print.
- Cambios al Motor FCE.
- Codegen OpenAPI obligatorio (el proyecto tipa a mano; snapshot sí requerido para schemas).

---

## 7. Dictamen de cierre

### ¿El diseño funcional quedó completamente definido?

**SÍ.**

Los 28 puntos del objetivo están especificados. Las decisiones D1–D20 están cerradas. La experiencia de usuario del MVP CFG está definida antes de escribir código.

### ¿El proyecto está listo para iniciar el Blueprint técnico de implementación?

**SÍ.**

El siguiente paquete documental debe ser el **Blueprint técnico** (estructura de archivos, contratos de hooks/services, wiring router, plan de tests), tomando como entradas:

1. `docs/frontend-contracts/cfg/`
2. `docs/arquitectura/code-generation/cfg-frontend-audit/`
3. **Este paquete** `docs/arquitectura/code-generation/cfg-frontend-functional-design/`

### ¿Se puede implementar código ya?

**NO.** Falta el Blueprint técnico. Este paquete prohíbe explícitamente crear componentes, rutas o modificar navegación.

---

## 8. Firma documental

| Rol | Artefacto | Estado |
|-----|-----------|--------|
| Contrato Backend | `docs/frontend-contracts/cfg/` | CERTIFICADO |
| Auditoría FE AS-IS | `cfg-frontend-audit/` | CERRADA |
| Diseño funcional FE | `cfg-frontend-functional-design/` | **CERRADO** |
| Blueprint técnico | — | **PENDIENTE** |
| Implementación | — | **PENDIENTE** |
