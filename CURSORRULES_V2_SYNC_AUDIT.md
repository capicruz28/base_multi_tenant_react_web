# Auditoría de sincronización — `.cursorrules` vs `ERP_FRONTEND_STANDARDS_V2`

**Fecha:** 31 mayo 2026  
**Estado:** Solo auditoría — **sin modificar** `.cursorrules`  
**Norma vigente (congelada):** [`ERP_FRONTEND_STANDARDS_V2.md`](./ERP_FRONTEND_STANDARDS_V2.md)  
**Objeto auditado:** [`.cursorrules`](./.cursorrules) (304 líneas)  
**Sin código · sin commit**

---

## 1. Veredicto ejecutivo

| Pregunta | Respuesta |
|----------|-----------|
| ¿`.cursorrules` contradice V2? | **Sí — 4 contradicciones 🔴** |
| ¿Está obsoleto respecto a V2? | **~55% alineado** en integridad API; **~25%** en UX ERP post-INV |
| ¿Duplica norma que debe vivir solo en V2? | **Parcialmente** — UX genérico duplica §5/§7 sin IDs |
| ¿Listo para generar v2? | **✅ Sí** tras aplicar plan §6 |

**Principio acordado (V2 §0.3):** `.cursorrules` = recordatorio operativo diario + diseño 2 capas; **pointers** a V2 §4, §7, §8, §11 — no tablas normativas completas.

---

## 2. Mapa de cobertura actual

| Bloque `.cursorrules` | Líneas | Rol correcto | Alineación V2 |
|----------------------|--------|--------------|---------------|
| Stack + intro | 6–10 | Operativo | ✅ |
| Integridad absoluta | 12–26 | Resumen §8 + stack | ⚠ L25 empresa_id |
| Endpoints deprecated | 29–47 | Resumen §8.1 API-01/02 | ✅ |
| Cabecera + detalle | 50–67 | Resumen §6.5 CD-01/02 | ✅ |
| Nunca IDs UI | 71–86 | Resumen §4.6 E-ME4 | ✅ |
| Evaluación código | 90–107 | Proceso (sin ID V2) | ✅ mantener |
| Manejo errores | 111–139 | Resumen §8.5 ER-01/02 (más detalle) | ✅ OK duplicar jerarquía |
| UX/UI obligatorios | 143–210 | **Debe pointer V2** | 🔴 obsoleto parcial |
| Cuando implementes | 214–220 | Proceso | ⚠ falta link V2 §9 |
| Orden prioridad | 224–230 | Operativo | ⚠ falta precedencia V2 |
| Diseño 2 capas | 234–303 | **Solo aquí** (V2 §0.2) | ✅ correcto |

---

## 3. Contradicciones 🔴 (deben corregirse en v2)

| ID | `.cursorrules` | V2 | Regla V2 |
|----|----------------|-----|----------|
| **CR-01** | L177: “Filtros visibles (**empresa**, estado, búsqueda…)” | ME-02, AP-01, TB-03 | MUST NOT selector empresa en toolbar company-scoped |
| **CR-02** | L25: “SIEMPRE incluir **empresa_id** donde el contrato lo requiera” | ME-01, ME-05 | `empresa_id` operativo = **`scopeEmpresaId` sesión JWT**, no filtro local |
| **CR-03** | L167–169: empty “ilustración + mensaje” genérico | ES-01 | MUST `IamTableEmptyState` en listados Plantilla A |
| **CR-04** | L167: “skeleton **o spinner**” | SK-01, AP-09 | MUST `InvTableSkeleton` en listados; no Loader full-page ocultando tabla |

**Precedencia:** V2 gana. `.cursorrules` v2 debe **eliminar o reescribir** CR-01…CR-04.

---

## 4. Reglas obsoletas o insuficientes

### 4.1 Obsoletas (eliminar o reemplazar por pointer)

| `.cursorrules` actual | Motivo | Reemplazo v2 |
|----------------------|--------|--------------|
| L177 filtro empresa en tablas | Contradice cierre ORG/INV | “Filtros: búsqueda, estado dominio; **empresa solo header JWT** (ME-02)” |
| L205 modales genéricos sin B.1.1 | Post-ORG/INV M3 | Pointer §7.1 B11-01…B11-06 |
| L172 “eliminar/desactivar” en confirmaciones | Vocabulario impreciso | “Desactivar / Anular” (UX-01 §8.4) |
| Ausencia total multiempresa JWT | INV/ORG cerrados | Bloque nuevo §4 V2 |
| Sin mención `ERP_FRONTEND_STANDARDS_V2` | Precedencia §0.3 | Header + link archivo |

### 4.2 Insuficientes (ampliar con pointers, no tablas)

| Tema ausente en `.cursorrules` | IDs V2 | Acción v2 |
|-------------------------------|--------|-----------|
| Multiempresa JWT | ME-01…ME-06 | ~8 líneas MUST + link §4 |
| B.1.1 discard modales | B11-01, B11-06 | 3 líneas + link §7.1 |
| Componentes estándar listado | §10 | Lista nombres: `IamSearchInput`, `OrgToolbarSearch`, `IamTableEmptyState`, `InvTableSkeleton` |
| Plantilla A toolbar | TB-01, TB-02 | 2 líneas + link §5.2 |
| Guards company | §4.5, §10 | “Patrón `use*SessionScope` + `*CompanyRouteGuard`” |
| Gates QA módulo | §11 | “Checklist: ERP_FRONTEND_STANDARDS_V2 §11” |
| Auth mínimo | AUTH-01…04 | No expandir — link §4.8 |

### 4.3 Vigentes — mantener sin cambio sustancial

| Bloque | V2 equivalente | Nota |
|--------|----------------|------|
| Integridad API (no cambiar contratos, no any, React Query) | §8.1, stack | ✅ |
| Deprecated + cabecera+detalle | API-01/02, CD-01/02 | ✅ duplicación resumen aceptada |
| E-ME4 / no UUID | E-ME4-01…03 | ✅ |
| ER jerarquía detail + toast hook | ER-01, ER-02 | ✅ cursorrules puede ser **más operativo** que V2 |
| RBAC no render | RB-01, RB-02 | ✅ |
| Layout transaccional bg-surface | CD-08, CD-09 | ✅ |
| Diseño 2 capas completo | Fuera V2 §0.2 | ✅ **permanece solo en `.cursorrules`** |
| Transformación uppercase/lowercase inputs | Sin ID V2 | ✅ convención operativa OK |
| Evaluación código ✅/🔴/🔁 | Proceso | ✅ |

---

## 5. Duplicaciones

### 5.1 Duplicación aceptada (resumen operativo)

| Contenido | V2 | `.cursorrules` | Veredicto |
|-----------|-----|----------------|-----------|
| Deprecated endpoints | §8.1 | L29–47 | **OK** — cabina diaria |
| Cabecera+detalle | §6.5 | L50–67 | **OK** |
| No UUID | §4.6 | L71–86 | **OK** |
| Toast solo en hook | ER-02 | L128–135 | **OK** — cursorrules más explícito |
| H1 prohibido en body | TB-01 | L147–148 | **OK** — 1 línea |
| Transaccional layout | CD-08/09 | L155–158 | **OK** |

### 5.2 Duplicación a eliminar en v2 (mover a V2 únicamente)

| Contenido | Problema | Acción |
|-----------|----------|--------|
| Matriz empty/skeleton genérica L167–169 | Sustituida por ES-01, SK-01 | Pointer + nombres componentes |
| Modales L201–205 sin IDs B11 | Norma incompleta vs V2 §7 | Pointer §7.1 |
| Tablas L175–180 mezcla paginación + empresa | CR-01 | Separar: paginación PR (pointer); sin empresa toolbar |

### 5.3 Duplicación que **no** debe entrar en `.cursorrules` v2

Todo lo siguiente vive **solo en V2** — `.cursorrules` solo cita ID o §:

- Árbol clasificación §2.1 (Plantillas A/A+/B-*)
- Gates §11 checklist completo
- Matriz PUR §2.3
- AUTH/IMP §4.8 detalle
- B11-07…B11-09, SEC-01…SEC-06
- §9 referencias IAM/ORG/INV
- §10 mapa rutas completo
- Anexo A deuda

---

## 6. Plan propuesto — `.cursorrules` v2 (esqueleto)

> **No implementar aún** — validación previa acordada.

### 6.1 Header nuevo (~8 líneas)

```markdown
Norma ERP: ERP_FRONTEND_STANDARDS_V2.md (CONGELADO)
Precedencia: OpenAPI > V2 > este archivo > PROMPT_FRONTEND_MAESTRO.md
```

### 6.2 Bloques a conservar (~180 líneas)

- REGLAS ABSOLUTAS DE INTEGRIDAD (ajustar L25)
- ENDPOINTS DEPRECATED
- CABECERA + DETALLE
- NUNCA MOSTRAR IDs
- EVALUACIÓN CÓDIGO EXISTENTE
- MANEJO DE ERRORES (completo)
- SISTEMA DE DISEÑO DOS CAPAS (completo — sin cambio)

### 6.3 Bloque nuevo ERP PLATFORM (~45 líneas)

```markdown
## ERP — MULTIEMPRESA JWT (ver V2 §4)
- Empresa operativa = sesión JWT / header (useEmpresaActiva). ME-01, ME-02
- PROHIBIDO selector "Todas las empresas" o empresa en toolbar company-scoped
- scopeEmpresaId en hooks; invalidate al cambiar empresa; *CompanyRouteGuard
- Create: OrgSessionEmpresaField readonly. ME-05
- PROHIBIDO UUID visible (E-ME4). Tooltip title con UUID = error

## ERP — LISTADOS PLANTILLA A (ver V2 §5, §10)
- Toolbar justify-between; IamSearchInput + OrgToolbarSearch; InvTableSkeleton
- Empty: IamTableEmptyState + hasSearch. ES-01, SK-01
- Modales CRUD: B.1.1 dirty (§7.1 B11-xx). OrgDiscardConfirmDialog

## ERP — CHECKLIST MÓDULO
- Gates obligatorios: V2 §11 (Gate 0–4 según sprint)
```

### 6.4 Bloques UX actuales a recortar

| Sección actual | Acción |
|----------------|--------|
| ESTÁNDARES UX/UI L143–210 | **Recortar ~60%** — mantener: layout transaccional, RBAC, modales 1 línea B.1.1, vocabulario Desactivar |
| Tablas L175–180 | Reescribir sin “empresa” en filtros |
| Feedback L166–173 | Pointer ES/SK |
| CUANDO IMPLEMENTES L214–220 | Añadir: “Patrón: V2 §9.5 + INV/ORG referencia” |
| ORDEN PRIORIDAD L224–230 | Insertar “0. OpenAPI 1. V2” antes de lista actual |

### 6.5 Tamaño estimado post-v2

| Parte | Líneas ~ |
|-------|----------|
| Integridad + errores (existente ajustado) | 130 |
| ERP platform nuevo | 45 |
| UX recortado + pointers | 40 |
| Diseño 2 capas (sin cambio) | 70 |
| **Total** | **~285** (+/- 20) |

---

## 7. Matriz regla a regla — gaps críticos PUR

| Regla PUR-M0 necesaria | En `.cursorrules` hoy | En v2 propuesto |
|------------------------|---------------------|-----------------|
| ME-02 no selector empresa | ❌ contradice | ✅ |
| ME-03 invalidate | ❌ ausente | ✅ pointer |
| Guards + scope hooks | ❌ ausente | ✅ pointer |
| ES-01 / SK-01 componentes | ❌ genérico | ✅ nombres |
| B11 modales catálogo | ❌ 1 línea vaga | ✅ pointer §7 |
| CD con-detalle | ✅ | ✅ |
| API deprecated | ✅ | ✅ |

**Veredicto PUR:** `.cursorrules` actual **no protege** contra reintroducir `empresaFilter` local — riesgo P0 para PUR-M0.

---

## 8. Checklist pre-generación `.cursorrules` v2

- [ ] Header precedencia + link V2
- [ ] Corregir CR-01…CR-04
- [ ] Añadir bloque ME multiempresa (~8 líneas)
- [ ] Añadir nombres componentes §10 (4–5 líneas)
- [ ] Pointer B.1.1 §7.1 (3 líneas)
- [ ] Pointer Gates §11 (2 líneas)
- [ ] Recortar UX duplicado L143–210
- [ ] **No** copiar árbol §2, Gates completos, §9, AUTH detalle
- [ ] Mantener diseño 2 capas íntegro
- [ ] Verificar `alwaysApply` / description frontmatter

---

## 9. Veredicto final

| Criterio | Estado |
|----------|--------|
| Contradicciones identificadas | 4 (CR-01…CR-04) |
| Obsoletos identificados | 5 bloques |
| Duplicación innecesaria | Recortable ~60 líneas UX |
| Solo V2 / solo cursorrules | Matriz §5.3 / §4.3 |
| Plan v2 listo para validación | ✅ §6 |

**Siguiente paso (tras tu OK):** generar `.cursorrules` v2 según §6 — sin tocar V2 congelado.

---

*Auditoría sync `.cursorrules`. Sin modificar archivos. Sin commit.*
