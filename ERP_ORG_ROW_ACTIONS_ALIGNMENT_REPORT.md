# ERP — Reporte alineación acciones de fila ORG (RA-ORG-01 / RA-ORG-02)

**Fecha:** 10 junio 2026  
**Estado:** Implementado — pendiente QA navegador  
**Referencias:** `ERP_ORG_INV_ROW_ACTIONS_CONSISTENCY_AUDIT.md`  
**Hallazgos cerrados:** RA-ORG-01 (Desactivar en inactivos), RA-ORG-02 (Editar en inactivos)

---

## 1. Resumen

| Métrica | Valor |
|---------|--------|
| Pantallas ORG modificadas | **6** |
| Patrón aplicado | Ternario `row.es_activo` (paridad INV) |
| Archivos fuera de alcance tocados | **0** |
| `tsc --noEmit` | **PASS** |
| Linter | **Sin errores** |

**Comportamiento resultante:**

| Estado | Acciones visibles (con permiso) |
|--------|--------------------------------|
| `es_activo === true` | Editar, Desactivar |
| `es_activo === false` | Reactivar únicamente |

---

## 2. Archivos modificados (lista exacta)

| Archivo | Cambio |
|---------|--------|
| `src/features/org/pages/EmpresaPage.tsx` | Rama `row.es_activo` en acciones de fila |
| `src/features/org/pages/SucursalesPage.tsx` | Idem |
| `src/features/org/pages/DepartamentosPage.tsx` | Idem |
| `src/features/org/pages/CargosPage.tsx` | Idem |
| `src/features/org/pages/CentrosCostoPage.tsx` | Idem |
| `src/features/org/pages/ParametrosPage.tsx` | Idem + `rowCanMutate(row)` preservado en cada rama |

**No modificados:** INV, IAM, hooks, servicios, `ConfirmDialog`, documentación maestra.

---

## 3. Implementación

### 3.1 Patrón estándar (5 pantallas)

Reemplazo del bloque aditivo por el patrón INV:

```tsx
{row.es_activo ? (
  <>
    {canEditar && (/* Editar */)}
    {canEliminar && (/* Desactivar */)}
  </>
) : (
  canEditar && (/* Reactivar */)
)}
```

### 3.2 Parámetros (hybrid)

Misma estructura con guards de dominio:

```tsx
{row.es_activo ? (
  <>
    {canEditar && rowCanMutate(row) && (/* Editar */)}
    {canEliminar && rowCanMutate(row) && (/* Desactivar */)}
  </>
) : (
  canEditar && rowCanMutate(row) && (/* Reactivar */)
)}
```

### 3.3 Elementos preservados (sin cambios)

- RBAC: `canEditar`, `canEliminar`
- `ConfirmDialog` Desactivar (`variant="danger"`)
- `ConfirmDialog` Reactivar P1 (`variant="info"`)
- `discardPending`, `createOrgDiscardHandlers`, `orgDialogGuardProps`
- `disabled={discardPending !== null}` y `reactivar*.isPending` en botones

---

## 4. Evidencia de compilación

| Verificación | Resultado |
|--------------|-----------|
| `npx tsc --noEmit` (rutas `org/pages`) | **PASS** — 0 errores |
| Linter IDE (6 archivos) | **PASS** |

---

## 5. Checklist QA manual

Activar «Ver inactivos» en cada pantalla antes de probar filas inactivas.

| # | Pantalla | Caso activo | Caso inactivo | Estado |
|---|----------|-------------|---------------|--------|
| QA-1 | Empresas | Editar + Desactivar; sin Reactivar | Solo Reactivar | ☐ |
| QA-2 | Sucursales | Idem | Idem | ☐ |
| QA-3 | Departamentos | Idem | Idem | ☐ |
| QA-4 | Cargos | Idem | Idem | ☐ |
| QA-5 | Centros de costo | Idem | Idem | ☐ |
| QA-6 | Parámetros | Idem (filas mutables) | Solo Reactivar (filas mutables) | ☐ |
| QA-7 | Cualquier ORG | Confirm Desactivar en activo | Funciona igual que antes | ☐ |
| QA-8 | Cualquier ORG | Confirm Reactivar en inactivo | Funciona igual que P1 | ☐ |
| QA-9 | Cualquier ORG | `discardPending` activo | Acciones deshabilitadas | ☐ |
| QA-10 | Parámetros | Fila no mutable (`rowCanMutate` false) | Sin acciones en ambos estados | ☐ |

---

## 6. Riesgos residuales

| Riesgo | Severidad | Notas |
|--------|-----------|-------|
| Usuario editaba inactivos sin reactivar | Baja | Flujo nuevo: Reactivar → Editar |
| Regresión RBAC | Baja | Mismos permisos; solo visibilidad por estado |
| Parámetros hybrid | Baja | `rowCanMutate` intacto |

---

## 7. Recomendación RB-ROW-01 para documentación maestra (sin implementar)

> **No se modificó** `ERP_FRONTEND_STANDARDS_V2.md`, `.cursorrules` ni `PROMPT_FRONTEND_MAESTRO.md` en esta tarea.

### 7.1 ¿Incorporar RB-ROW-01?

**Recomendación: Sí** — en la próxima ventana de consolidación de estándares, **después** de validar QA de este cambio en las 6 pantallas ORG.

### 7.2 Texto propuesto (RB-ROW-01)

| ID | Regla |
|----|-------|
| **RB-ROW-01** | MUST en catálogos Plantilla A: `row.es_activo === true` → Editar + Desactivar; `false` → Reactivar únicamente |
| **RB-ROW-02** | MUST rama única `row.es_activo ? accionesActivas : accionesInactivas` — no bloques aditivos |
| **RB-ROW-03** | Guards de dominio adicionales (ej. `rowCanMutate`) se aplican **dentro** de cada rama |

Relación con reglas existentes:
- Complementa **UX-04** (ciclo de vida vía tabla, no checkbox en edit).
- Complementa **RB-01** (no renderizar acción sin sentido de dominio).

### 7.3 Dónde incorporar (prioridad sugerida)

| Documento | Acción recomendada | Prioridad |
|-----------|-------------------|-----------|
| `ERP_FRONTEND_STANDARDS_V2.md` | Añadir **§8.6.1** o extender §5 Plantilla A con RB-ROW-01…03 | **Alta** — norma congelada |
| `.cursorrules` | Recordatorio operativo: «Catálogo A: ternario `es_activo` en acciones fila» | **Media** — recordatorio diario |
| `PROMPT_FRONTEND_MAESTRO.md` | Ítem checklist Gate 2 / Plantilla A: verificar matriz activo/inactivo | **Media** — onboarding módulos |

### 7.4 Por qué no incorporar aún en esta tarea

1. Restricción explícita del sprint: estándares maestros en fase de consolidación.
2. Este fix **implementa** el comportamiento sin normar todavía — QA debe confirmar antes de congelar.
3. `ERP_V2_STANDARDS_PROPOSAL.md` ya documenta reglas MD-*; RB-ROW-01 puede fusionarse en la misma revisión V2.

### 7.5 Criterio de cierre para incorporación

- [ ] QA manual §5 completado sin regresiones en 6 pantallas ORG
- [ ] Confirmar que INV sigue como referencia (sin cambios)
- [ ] Revisión producto: flujo «Reactivar antes de editar» aceptado para ORG

---

## 8. Veredicto

| Pregunta | Respuesta |
|----------|-----------|
| ¿RA-ORG-01 y RA-ORG-02 cerrados? | **Sí** (código) |
| ¿Paridad ORG ↔ INV? | **Sí** |
| ¿Listo para QA? | **Sí** |
| ¿RB-ROW-01 en V2 ahora? | **No** — recomendado post-QA (§7) |

---

*Reporte generado tras implementación alineación acciones fila ORG. Sin commit automático.*
