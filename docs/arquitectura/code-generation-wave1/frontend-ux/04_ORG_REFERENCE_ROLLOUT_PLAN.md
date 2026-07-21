# Plan rollout — ORG como primer consumidor de `CodigoField`

**Enfoque:** Conservador, incremental, sin romper PR-1 congelado.  
**Estado:** Plan — sin implementación  
**Objetivo:** Certificar ORG como módulo referencia UX del Motor de Códigos.

---

## 1. Estrategia general

```
PR-1 (congelado)     →  Capa técnica payload optional ✅
PR-UX-1 (nuevo)      →  Componente CodigoField + utils core
PR-UX-2 (nuevo)      →  ORG config + 5 páginas CREATE
PR-UX-3 (nuevo)      →  ORG UPDATE + post-201 + errores inline
PR-UX-4 (opcional)   →  RBAC override + preview cfg futuro
```

**No reabrir PR-1** salvo integración mínima en `handleCreate` para usar `buildCodigoPayloadValue` — puede hacerse dentro PR-UX-2 tocando las mismas 5 páginas + config.

---

## 2. Fases detalladas

### PR-UX-1 — Fundación plataforma (sin tocar ORG pages)

| # | Entregable | Ubicación | Riesgo |
|---|------------|-----------|--------|
| 1.1 | Tipos `CodigoGenerationPolicy` | `src/core/codigo/codigo-policy.types.ts` | Bajo |
| 1.2 | `buildCodigoPayloadValue()` | `src/core/codigo/codigo-payload.utils.ts` | Bajo |
| 1.3 | Copy CTX-* | `src/shared/components/codigo/codigo-field.constants.ts` | Bajo |
| 1.4 | `CodigoField` + subcomponentes | `src/shared/components/codigo/` | Medio |
| 1.5 | `useCodigoFieldState()` | `src/core/codigo/useCodigoFieldState.ts` | Bajo |
| 1.6 | Tests unitarios componente | `__tests__/CodigoField.test.tsx` | Bajo |
| 1.7 | `mapCodigoFieldError()` | `src/core/codigo/codigo-error.utils.ts` | Bajo |

**Criterio merge:** tests verdes; Storybook opcional; cero imports en features.

**Archivos nuevos estimados:** ~8  
**Archivos modificados:** 0 features

---

### PR-UX-2 — ORG CREATE (consumidor certificador)

| # | Entregable | Archivo |
|---|------------|---------|
| 2.1 | Config entidades ORG | `src/features/org/config/codigo-field.config.ts` |
| 2.2 | Reemplazar input CREATE Empresa | `EmpresaPage.tsx` |
| 2.3 | Reemplazar input CREATE Sucursal | `SucursalesPage.tsx` |
| 2.4 | Reemplazar input CREATE Departamento | `DepartamentosPage.tsx` |
| 2.5 | Reemplazar input CREATE Centro costo | `CentrosCostoPage.tsx` |
| 2.6 | Reemplazar input CREATE Cargo | `CargosPage.tsx` |
| 2.7 | Integrar `buildCodigoPayloadValue` en handleCreate | 5 páginas |
| 2.8 | Toast post-201 con código | 5 páginas o helper shared |

**Cambio visual principal:** desaparece textbox default; aparece panel auto.

**Archivos modificados:** 6 (5 pages + config)  
**Servicios/hooks:** sin cambio estructural — toast puede enriquecerse en página.

**Criterio QA:**

| ID | Caso |
|----|------|
| UX-01 | CREATE auto — panel visible, sin textbox, 201 |
| UX-02 | CREATE manual (override ON) — textbox, 201 manual |
| UX-03 | Volver a auto — payload omitido |
| UX-04 | Onboarding empresa sin código |
| UX-05 | Toast muestra código asignado |

---

### PR-UX-3 — ORG UPDATE + errores

| # | Entregable | Archivo |
|---|------------|---------|
| 3.1 | CodigoField mode=update en 5 modales EDIT | 5 páginas |
| 3.2 | Banner CTX-06 al dirty código | CodigoField o página |
| 3.3 | 409/400 inline en CREATE manual | catch handleCreate |
| 3.4 | Dirty snapshot con assignmentMode | 5 form-dirty utils |

**Sin cambiar:** lógica UPDATE payload — solo UI wrapper.

---

### PR-UX-4 — Madurez (opcional)

| # | Entregable |
|---|------------|
| 4.1 | Permiso RBAC `codigo.manual_override` |
| 4.2 | Flag tenant `CODIGO_MANUAL_OVERRIDE` |
| 4.3 | Integración preview API cfg admin |
| 4.4 | Documentación screenshots ORG reference |

---

## 3. Archivos ORG — mapa de impacto

| Archivo | PR-UX-1 | PR-UX-2 | PR-UX-3 |
|---------|---------|---------|---------|
| `org.types.ts` | — | — | — |
| `org.service.ts` | — | — | — |
| `*.hooks.ts` | — | — (toast opcional) | — |
| `codigo-field.config.ts` | — | **Nuevo** | — |
| `EmpresaPage.tsx` | — | CREATE | UPDATE |
| `SucursalesPage.tsx` | — | CREATE | UPDATE |
| `DepartamentosPage.tsx` | — | CREATE | UPDATE |
| `CentrosCostoPage.tsx` | — | CREATE | UPDATE |
| `CargosPage.tsx` | — | CREATE | UPDATE |
| `form-dirty/*.ts` (5) | — | — | snapshot |
| `ParametrosPage.tsx` | — | **No tocar** (MANUAL_ONLY legacy) | — |

---

## 4. ParametrosPage — tratamiento especial

| Aspecto | Decisión |
|---------|----------|
| Policy | MANUAL_ONLY |
| CodigoField | **Opcional** en PR-UX-5 separado |
| Razón | Fuera Ola 1; evitar scope creep PR-UX-2 |

Si se adopta: `CodigoField policy="MANUAL_ONLY"` — reemplaza input actual sin cambio UX visible.

---

## 5. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Usuarios acostumbrados a textbox | Panel auto + copy claro; manual para implantación |
| Dirty guard falsos positivos | `useCodigoFieldState` + tests |
| Regresión payload PR-1 | `buildCodigoPayloadValue` tests = casos PR-1 |
| Scope creep INV | ORG only hasta certificación |
| Doble toast | Toast código en página; hook genérico desactivado o compuesto |

---

## 6. Estimación esfuerzo

| PR | Dev | QA | Diseño |
|----|-----|-----|--------|
| PR-UX-1 | 1–2 días | 0.5 día | — |
| PR-UX-2 | 1–1.5 días | 1 día | 0.5 día review |
| PR-UX-3 | 1 día | 0.5 día | — |
| PR-UX-4 | 1–2 días | 0.5 día | — |

**Total hasta referencia ORG certificada:** ~4–6 días dev+QA.

---

## 7. Secuencia recomendada para otros módulos

Tras certificar ORG:

```
1. Copiar codigo-field.config.ts pattern → inv/config/
2. Identificar entidades motor en OpenAPI INV
3. Reemplazar CREATE inputs → CodigoField
4. Checklist §03 sección 13
5. Gate integración por módulo (clonar 05_INTEGRATION_GATE)
```

**INV no renegocia UX** — solo config + fieldKey + sequenceMeta.

---

## 8. Definition of Done — ORG referencia UX

- [ ] `CodigoField` en shared — tests ≥ 90% ramas policy
- [ ] 5 CREATE ORG con panel auto default
- [ ] Manual override colapsado + volver a auto
- [ ] 5 UPDATE con CodigoField mode=update
- [ ] Toast post-201 con código
- [ ] 409 inline manual probado
- [ ] Onboarding probado
- [ ] Dirty guard probado
- [ ] Documentación UX v1.0 aprobada
- [ ] Checklist §03 completo
- [ ] Sin regresión listados / RBAC / servicios

---

## 9. Relación con PR-2/PR-3 originales

| PR original | Destino en nuevo plan |
|-------------|----------------------|
| PR-2 toast código | **PR-UX-2** §2.8 |
| PR-3 ocultar input / badge | **PR-UX-2** CodigoField panel |
| PR-4 409 campo | **PR-UX-3** §3.3 |

El plan UX **supersedes** PR-2/PR-3 como roadmap — misma intención, arquitectura componente.

---

## 10. Aprobaciones requeridas

| Stakeholder | Aprobar |
|-------------|---------|
| Producto / UX | Matriz policy §01 |
| Frontend lead | Spec CodigoField §02 |
| Backend | Payload undefined compatible |
| QA | Casos UX-01…05 |

Tras aprobación → iniciar PR-UX-1 (solo shared/core, cero features).

---

*Índice paquete: [`00_EXECUTIVE_SUMMARY.md`](00_EXECUTIVE_SUMMARY.md)*
