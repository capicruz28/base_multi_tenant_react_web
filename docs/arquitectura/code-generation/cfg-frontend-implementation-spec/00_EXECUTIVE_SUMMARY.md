# CFG Frontend — Specification de Implementación (Executive Summary)

**Paquete:** `docs/arquitectura/code-generation/cfg-frontend-implementation-spec/`  
**Fecha:** 2026-07-17  
**Versión:** 1.0  
**Estado:** **SPECIFICATION CERRADA**  
**Código generado:** ninguno

**Autoridad (sin modificar decisiones):**

1. `docs/frontend-contracts/cfg/`
2. `docs/arquitectura/code-generation/cfg-frontend-audit/`
3. `docs/arquitectura/code-generation/cfg-frontend-functional-design/`
4. `docs/arquitectura/code-generation/cfg-frontend-blueprint/`

---

## 1. Dictamen

**La Specification Oficial de Implementación del módulo Frontend CFG queda completamente definida.**

El proyecto está **listo para iniciar la implementación de Wave 0**.

Esta Spec es el documento operativo archivo-por-archivo. No introduce arquitectura nueva; solo concreta el Blueprint aprobado.

---

## 2. Qué define esta Spec

| Área | Doc |
|------|-----|
| Plan archivo × wave | 01 |
| Página `SecuenciasPage` | 02 |
| Componentes | 03 |
| Hooks RQ | 04 |
| Service HTTP | 05 |
| Types | 06 |
| Utils / constants | 07 |
| Tests / fixtures / mocks | 08 |
| PRs por wave | 09 |
| Review + acceptance + merge/rollback | 10, 11 |
| Readiness Wave 0 | 12 |

---

## 3. Reglas de consistencia

1. Si hay conflicto: **Contrato BE > Diseño funcional > Blueprint > Spec**.
2. La Spec **no** puede inventar endpoints, pantallas Create, filtro `empresa_id`, ni company gates.
3. Implementación **solo** en el orden de waves del Blueprint (`08_IMPLEMENTATION_WAVES.md`).
4. Un PR = una wave (salvo hotfix documentado).

---

## 4. Waves (recordatorio)

| Wave | Nombre | PR sugerido |
|------|--------|-------------|
| 0 | Foundation | `feat(cfg): wave0 foundation route stub` |
| 1 | Service + utils | `feat(cfg): wave1 secuencias service` |
| 2 | React Query | `feat(cfg): wave2 secuencias hooks` |
| 3 | Listado RO | `feat(cfg): wave3 secuencias list` |
| 4 | Edit + lifecycle | `feat(cfg): wave4 secuencias edit` |
| 5 | Preview + DoD | `feat(cfg): wave5 secuencias preview` |

---

## 5. Conclusión operativa

| Pregunta | Respuesta |
|----------|-----------|
| ¿Spec completa? | **SÍ** |
| ¿Lista para Wave 0? | **SÍ** |
| ¿Se puede saltar a Wave 3? | **NO** |
| ¿Cambios de arquitectura en Spec? | **NINGUNO** |
