# Ola 1 ORG — Auditoría Frontend (Motor de Códigos)

**Etapa:** Fase 1 — Auditoría completa (sin implementación)  
**Fecha:** 2026-07-12  
**Estado:** Auditoría cerrada — listo para implementación conservadora  
**Alcance:** 5 entidades ORG integradas al Motor de Códigos Backend  
**Fuente de verdad:** Contrato Backend en `00_EXECUTIVE_SUMMARY.md` … `04_FRONTEND_MIGRATION_STRATEGY.md` (paquete `codigo-generation-wave1/frontend-contract`)

---

## 1. Veredicto de auditoría

| Aspecto | Hallazgo |
|---------|----------|
| Entidades en alcance | 5 — Empresa, Sucursal, Departamento, Centro de costo, Cargo |
| Formularios CREATE desalineados | **5/5** — bloquean submit sin código manual |
| Tipos TypeScript desalineados | **5/5** — `codigo` / `codigo_empresa` required en `*Create` |
| Frontend genera códigos | **0** — no hay lógica de correlativo local |
| Servicios API a modificar | **0** — passthrough correcto; cambio en páginas/tipos |
| Schemas Zod/Yup dedicados | **0** — validación inline en `handleCreate` |
| Tests ORG existentes | **0** — sin cobertura automatizada del flujo CREATE |
| Riesgo global de la alineación | **Bajo** — cambios acotados al módulo `src/features/org/` |

**Conclusión:** El Frontend **no está alineado** con Ola 1. Los cinco formularios CREATE impiden el alta sin código manual. La corrección es **quirúrgica**: tipos + validación/payload en 5 páginas + ajustes UX mínimos opcionales en toasts.

---

## 2. Brecha principal (Antes vs Contrato)

| Dimensión | Frontend actual | Contrato Ola 1 |
|-----------|-----------------|----------------|
| Campo código en CREATE | Obligatorio (UI `*`, HTML `required`, guard `trim()`) | Opcional — omitir = auto-generación Backend |
| Payload CREATE | Siempre incluye `codigo` / `codigo_empresa` (a menudo `""`) | Recomendado: omitir clave si vacío |
| Código post-201 | No se muestra en toast éxito | Mostrar código asignado (recomendado) |
| UPDATE / listados | Código editable / visible | **Sin cambio** |
| Parámetros sistema | `codigo_parametro` obligatorio | **Fuera de alcance** (MANUAL_ONLY) |

---

## 3. Documentos de este paquete

| # | Documento | Contenido |
|---|-----------|-----------|
| 00 | Este archivo | Resumen ejecutivo, veredicto, índice |
| 01 | [`01_IMPACT_ANALYSIS.md`](01_IMPACT_ANALYSIS.md) | Análisis detallado por categoría (formularios, tipos, servicios, etc.) |
| 02 | [`02_FILES_TO_MODIFIY.md`](02_FILES_TO_MODIFIY.md) | Inventario exacto de archivos — obligatorios vs prohibidos |
| 03 | [`03_IMPLEMENTATION_PLAN.md`](03_IMPLEMENTATION_PLAN.md) | Plan de implementación conservador por fases |
| 04 | [`04_RISK_ANALYSIS.md`](04_RISK_ANALYSIS.md) | Riesgos de regresión, dependencias y mitigaciones |

---

## 4. Mapa de entidades y archivos Frontend

| Entidad | Campo CREATE | Página principal | Hook CREATE | Tipo Create |
|---------|--------------|------------------|-------------|-------------|
| Empresa | `codigo_empresa` | `EmpresaPage.tsx` | `useCreateEmpresa` | `EmpresaCreate` |
| Sucursal | `codigo` | `SucursalesPage.tsx` | `useCreateSucursal` | `SucursalCreate` |
| Departamento | `codigo` | `DepartamentosPage.tsx` | `useCreateDepartamento` | `DepartamentoCreate` |
| Centro de costo | `codigo` | `CentrosCostoPage.tsx` | `useCreateCentroCosto` | `CentroCostoCreate` |
| Cargo | `codigo` | `CargosPage.tsx` | `useCreateCargo` | `CargoCreate` |

**Tipos compartidos:** `src/features/org/types/org.types.ts`  
**Servicio compartido:** `src/features/org/services/org.service.ts` (sin cambio requerido)

---

## 5. Plan recomendado (resumen)

| Fase | Alcance | Archivos | Riesgo |
|------|---------|----------|--------|
| **PR-1** | Tipos `*Create` optional + quitar guards CREATE | `org.types.ts` + 5 páginas | Bajo |
| **PR-2** | Omitir código vacío del payload + toast con código 201 | 5 páginas (+ hooks opcional) | Bajo |
| **PR-3** | UX opcional: badge auto / sección manual colapsada | 5 páginas | Bajo |
| **PR-4** | 409 duplicado en campo código (CREATE) | `EmpresaPage` + company-scoped | Medio |

**Rollback:** Revertir optional → required en tipos y guards; Backend sigue aceptando ambos modos.

---

## 6. Fuera de alcance (confirmado)

- Módulo admin cfg (preview próximo código)
- `org_parametro_sistema.codigo_parametro` (MANUAL_ONLY)
- Ola 2+ (INV, PUR, etc.)
- Refactor arquitectural, rutas, permisos, hooks globales, componentes shared
- Catálogo platform super-admin (`CatDepartamentoCreate` ≠ `DepartamentoCreate` ORG)

---

## 7. Próximo paso

Implementar **PR-1** siguiendo [`03_IMPLEMENTATION_PLAN.md`](03_IMPLEMENTATION_PLAN.md).  
No iniciar código hasta aprobación de este paquete documental.

---

*Referencia contrato Backend: `codigo-generation-wave1/frontend-contract/` (documentos 00–04).*
