# CFG — Final Readiness (Blueprint)

**Versión:** 1.0  
**Fecha:** 2026-07-17  
**Estado:** **BLUEPRINT TÉCNICO CERRADO**

---

## 1. Cobertura de los 35 puntos del objetivo

| # | Requisito | Documento |
|---|-----------|-----------|
| 1 | Arquitectura técnica feature | 01 |
| 2 | Estructura carpetas | 02 |
| 3 | Responsabilidades por archivo | 02 |
| 4 | Pages | 02, 06 |
| 5 | Components | 06 |
| 6 | Hooks | 05, 02 |
| 7 | Services | 04 |
| 8 | Types | 07 |
| 9 | Constants | 02 |
| 10 | Utils | 02 |
| 11 | Router feature | 03 |
| 12 | App Router | 03 |
| 13 | ERP_MODULES | 03 |
| 14 | ERP_ROUTE_SEGMENTS | 03 |
| 15 | Menú dinámico | 03 |
| 16 | PermissionGuard | 03 |
| 17 | RBAC | 03, 06 funcional |
| 18 | React Query | 05 |
| 19 | Query Keys | 05 |
| 20 | Mutations | 05 |
| 21 | Invalidaciones | 05 |
| 22 | Cache strategy | 05 |
| 23 | Services HTTP | 04 |
| 24 | Contratos TS | 07 |
| 25 | Reuso componentes | 06 |
| 26 | Componentes nuevos | 06 |
| 27 | Hooks nuevos | 05 |
| 28 | Testing | 09 |
| 29 | Impl incremental | 08 |
| 30 | Orden exacto | 08 |
| 31 | Riesgos técnicos | 10 |
| 32 | Dependencias etapas | 08 |
| 33 | Checklist previo | 11 |
| 34 | Checklist posterior | 11 |
| 35 | Definition of Done | 11, este doc |

---

## 2. Trazabilidad documental

| Artefacto | Estado |
|-----------|--------|
| Contrato BE `docs/frontend-contracts/cfg/` | CERTIFICADO |
| Audit `cfg-frontend-audit/` | CERRADA |
| Diseño funcional `cfg-frontend-functional-design/` | APROBADO |
| **Blueprint `cfg-frontend-blueprint/`** | **CERRADO** |
| Spec de Implementación | **PENDIENTE (siguiente)** |
| Código feature `src/features/cfg` | **NO INICIADO** |

---

## 3. Definition of Done (Blueprint)

Este Blueprint está DONE cuando:

- [x] Existen docs 00–12
- [x] Waves 0–5 definidas con exit criteria
- [x] Keys/mutations/services/routing fijados
- [x] Guardrails y riesgos documentados
- [x] Checklists pre/post definidos
- [x] Sin código TypeScript/React generado en esta fase

---

## 4. Dictamen de cierre

### ¿El Blueprint Técnico quedó completamente definido?

**SÍ.**

La arquitectura del feature, carpetas, routing, service layer, React Query, components, types, waves, testing, riesgos y checklists quedan fijados como referencia obligatoria de implementación.

### ¿El proyecto está listo para iniciar la Specification de Implementación e inmediatamente después la implementación por etapas?

**SÍ.**

| Siguiente paso | Acción |
|----------------|--------|
| 1 | Crear/aprobar **Specification de Implementación** (firmas export, props, fixtures, tareas PR) alineada a este Blueprint |
| 2 | Ejecutar **Wave 0 → Wave 5** en orden (`08_IMPLEMENTATION_WAVES.md`) |
| 3 | Cerrar con checklists `11` + contrato `07` |

### ¿Se debe escribir React/TypeScript ahora?

**NO en esta fase de Blueprint.**  
La escritura de código comienza tras la Spec de Implementación (o en el mismo tren documental si el equipo unifica Spec+Wave0, pero **no** antes de tener Spec aprobada que no contradiga este Blueprint).

---

## 5. Prerequisitos que no bloquean Blueprint pero sí calidad de impl

| ID | Item | Impacto |
|----|------|---------|
| P1 | OpenAPI snapshot CFG | Tipado estricto |
| P3 | Menú Backend | QA navegación |
| P4 | Roles LBAC + códigos | QA RBAC |

---

## 6. Firma

| Rol | Resultado |
|-----|-----------|
| Blueprint técnico CFG Frontend | **CERRADO / APROBADO PARA SPEC + WAVES** |
| Implementación | Autorizada **solo** vía Spec + waves 0–5 |
