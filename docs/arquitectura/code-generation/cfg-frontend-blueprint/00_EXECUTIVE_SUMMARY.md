# CFG Frontend — Blueprint Técnico (Executive Summary)

**Paquete:** `docs/arquitectura/code-generation/cfg-frontend-blueprint/`  
**Fecha:** 2026-07-17  
**Versión:** 1.0  
**Estado:** **BLUEPRINT TÉCNICO CERRADO**  
**Código generado:** ninguno

**Entradas obligatorias:**

1. `docs/frontend-contracts/cfg/` — Contrato Backend CERTIFICADO
2. `docs/arquitectura/code-generation/cfg-frontend-audit/` — Auditoría AS-IS
3. `docs/arquitectura/code-generation/cfg-frontend-functional-design/` — Diseño funcional APROBADO

---

## 1. Dictamen

**El Blueprint Técnico del módulo Frontend CFG queda completamente definido.**

El proyecto está **listo para iniciar la Specification de Implementación** y, inmediatamente después, la **implementación por etapas (waves)** descrita en este paquete.

Este Blueprint es la **referencia obligatoria** para toda implementación posterior. Ninguna etapa puede inventar endpoints, pantallas, keys o permisos fuera de lo aquí definido.

---

## 2. Alcance técnico del feature

| Incluye | Excluye |
|---------|---------|
| Feature `src/features/cfg` | Cambios a `src/core/codigo` (FCE) |
| Ruta `/app/cfg/secuencias` | Tenant Admin / Super Admin |
| 6 operationIds del contrato | Create / align / fiscal series |
| Plantilla A/A+ + Tier B ErpList | Página detalle `:id` |
| RBAC `cfg.secuencias.*` | Filtro UI `empresa_id` (MVP) |
| Tests unitarios/hooks/UI críticos | E2E staging (QA operativo) |

---

## 3. Decisiones técnicas fijadas

| ID | Decisión |
|----|----------|
| T1 | Feature folder `src/features/cfg` |
| T2 | Service único `cfg-secuencias.service.ts` bajo `/api/v1/cfg` |
| T3 | Hooks: list ErpList + detail + 4 mutations |
| T4 | Query prefix `['cfg']`; keys oficiales en `05_REACT_QUERY_BLUEPRINT` |
| T5 | Router: lazy en `app-route-tree` + `PermissionGuard(cfg, ver)` |
| T6 | Registro `ERP_MODULES` + `ERP_ROUTE_SEGMENTS` |
| T7 | Types manuales alineados a OpenAPI/contrato |
| T8 | Sin company gate; tenant-first |
| T9 | UI: 1 page + Edit/Preview dialogs + confirms |
| T10 | Implementación en 5 waves ordenadas |

---

## 4. Índice del paquete

| Doc | Contenido |
|-----|-----------|
| `00_EXECUTIVE_SUMMARY.md` | Este resumen |
| `01_FEATURE_ARCHITECTURE.md` | Arquitectura técnica del feature |
| `02_FOLDER_STRUCTURE.md` | Carpetas y responsabilidades por archivo |
| `03_ROUTING_BLUEPRINT.md` | Router feature + App Router + menú + guards |
| `04_SERVICE_LAYER.md` | HTTP, methods, operationIds |
| `05_REACT_QUERY_BLUEPRINT.md` | Keys, queries, mutations, cache |
| `06_COMPONENT_BLUEPRINT.md` | Pages, components, reuso |
| `07_TYPES_BLUEPRINT.md` | Contratos TypeScript |
| `08_IMPLEMENTATION_WAVES.md` | Waves, orden, dependencias |
| `09_TESTING_BLUEPRINT.md` | Estrategia de testing |
| `10_RISKS_AND_GUARDRAILS.md` | Riesgos y guardrails |
| `11_IMPLEMENTATION_CHECKLIST.md` | Pre / post implementación |
| `12_FINAL_READINESS.md` | Definition of Done + readiness |

---

## 5. Pipeline documental → código

```text
Contrato BE  →  Audit AS-IS  →  Diseño funcional  →  Blueprint técnico (ESTE)
                                                      ↓
                                         Spec de Implementación (siguiente)
                                                      ↓
                                         Waves de código (08)
```

---

## 6. Conclusión operativa

| Pregunta | Respuesta |
|----------|-----------|
| ¿Blueprint completo? | **SÍ** |
| ¿Listo para Spec de Implementación? | **SÍ** |
| ¿Listo para implementar por etapas después de la Spec? | **SÍ** |
| ¿Se puede escribir React ahora sin Spec? | **NO recomendado** — Spec cierra firmas/archivos archivo-a-archivo |
| ¿Bloqueos de Blueprint? | **NINGUNO** |
