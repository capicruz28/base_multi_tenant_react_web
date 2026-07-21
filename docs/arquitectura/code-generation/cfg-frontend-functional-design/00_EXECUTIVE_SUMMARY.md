# CFG Frontend — Diseño Funcional (Executive Summary)

**Paquete:** `docs/arquitectura/code-generation/cfg-frontend-functional-design/`  
**Fecha:** 2026-07-17  
**Versión:** 1.0  
**Estado:** **DISEÑO FUNCIONAL CERRADO**  
**Código:** ninguno (solo especificación)

**Entradas oficiales:**

1. Contrato Backend: `docs/frontend-contracts/cfg/` (MVP v1.0 CERTIFICADO)
2. Auditoría AS-IS: `docs/arquitectura/code-generation/cfg-frontend-audit/`
3. Norma UX: `ERP_FRONTEND_STANDARDS_V2.md` (Plantilla A / A+, §5.11 listados)

---

## 1. Dictamen

**El diseño funcional del módulo Frontend CFG queda completamente definido.**

El proyecto está **listo para iniciar el Blueprint técnico de implementación**.

No quedan decisiones UX/RBAC/navegación abiertas que bloqueen el blueprint. Quedan solo prerequisitos técnicos de implementación (registro de módulo, snapshot OpenAPI, ítem de menú Backend) documentados en `10_FINAL_DECISIONS.md`.

---

## 2. Producto (qué es CFG en UI)

**Administrador de secuencias de código** del tenant ERP.

El usuario con permiso puede:

- Listar y filtrar secuencias.
- Ver detalle (identidad, scope, contador, política).
- Editar formato (`prefijo`, `separador`, `longitud_numero`, `numero_inicial`) si no está bloqueada.
- Desactivar / reactivar (soft).
- Previsualizar el próximo código estimado (sin consumir contador).

**No** incluye en este MVP: crear secuencias, borrar físico, alinear contadores, diagnóstico, series fiscales, ni el Motor FCE de formularios.

---

## 3. Decisiones de diseño cerradas (resumen)

| # | Tema | Decisión |
|---|------|----------|
| D1 | Shell | ERP operativo `/app` + `AppLayout` |
| D2 | Ruta SPA | `/app/cfg/secuencias` (única pantalla de listado) |
| D3 | Menú | Ítem dinámico “Secuencias de código” → esa ruta |
| D4 | Plantilla V2 | **A / A+** catálogo; listado **Tier B** (siempre `page`) |
| D5 | Detalle | **Dialog de edición** (no página detalle) |
| D6 | Preview | **Dialog de preview** independiente |
| D7 | Scope datos | **Tenant-first**; sin company query gate |
| D8 | Filtro `empresa_id` | **Omitido en toolbar MVP** (ver D8 detalle en `10_FINAL_DECISIONS`) |
| D9 | RBAC ruta | `PermissionGuard(cfg, ver)` + gate página `cfg.secuencias.consultar` |
| D10 | RBAC acciones | `hasPermission('cfg.secuencias.actualizar')` + `config_locked` |
| D11 | Create button | **No existe** |
| D12 | Separación FCE | Feature `cfg` distinto de `src/core/codigo` |

---

## 4. Arquitectura de pantallas (1 página + dialogs)

```text
/app/cfg/secuencias          → SecuenciasPage (listado)
  ├── Dialog Edición         → CfgSecuenciaEditDialog
  ├── Dialog Preview         → CfgSecuenciaPreviewDialog
  ├── ConfirmDialog Desactivar
  ├── ConfirmDialog Reactivar
  └── OrgDiscardConfirmDialog (si dirty al cerrar edición)
```

Sin H1 en body (TB-01). Identificación por breadcrumb del shell.

---

## 5. Índice del paquete

| Doc | Contenido |
|-----|-----------|
| `00_EXECUTIVE_SUMMARY.md` | Este resumen y dictamen |
| `01_USER_FLOWS.md` | Flujos de usuario end-to-end |
| `02_SCREEN_DESIGN.md` | Arquitectura de pantallas y layout |
| `03_LIST_PAGE_SPEC.md` | Toolbar, filtros, columnas, sort, paginación, estados |
| `04_EDIT_DIALOG_SPEC.md` | Dialog edición / lectura |
| `05_PREVIEW_DIALOG_SPEC.md` | Dialog preview |
| `06_RBAC_UI_RULES.md` | Matriz RBAC UI completa |
| `07_REACT_QUERY_CONCEPT.md` | Queries, mutations, invalidación conceptual |
| `08_RESPONSIVE_GUIDE.md` | Responsive + accesibilidad |
| `09_COMPONENT_REUSE.md` | Reuso vs componentes nuevos |
| `10_FINAL_DECISIONS.md` | Acta de decisiones + readiness blueprint |

---

## 6. Consistencia normativa (alto nivel)

| Norma | Aplicación CFG |
|-------|----------------|
| ME-02 | Sin selector “Todas las empresas” en toolbar |
| TB-01 / TB-02 | Toolbar `justify-between`; sin H1 body |
| SK-01 / ES-01 | `InvTableSkeleton` + `IamTableEmptyState` |
| LR-01 / LR-N01 | `useErpListQuery` + `normalizeListResponse` |
| RB-ROW-01 | Activa → Editar+Desactivar; Inactiva → Reactivar |
| B11-01…11 | Dirty discard + ConfirmDialog independientes |
| UX-01 | Vocabulario Desactivar / Reactivar |
| ER-01 / ER-02 | `getErrorMessage`; toast error solo en `onError` |
| E-ME4 | Nunca mostrar UUIDs como texto principal |

---

## 7. Fuera de alcance de este paquete

- Blueprint técnico (estructura de archivos, firmas de hooks, tests).
- Implementación React, rutas, menú o OpenAPI.
- Cambios Backend.

---

## 8. Conclusión operativa

| Pregunta | Respuesta |
|----------|-----------|
| ¿Diseño funcional completo? | **SÍ** |
| ¿Listo para Blueprint técnico? | **SÍ** |
| ¿Listo para implementar código ya? | **NO** — primero Blueprint técnico |
| ¿Bloqueos de diseño abiertos? | **NINGUNO** |
