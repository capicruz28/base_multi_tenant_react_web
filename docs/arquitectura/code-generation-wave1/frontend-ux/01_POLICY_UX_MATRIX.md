# Matriz UX por `generation_policy`

**Norma:** Cada fila responde las 10 preguntas obligatorias del diseño.  
**Fuente Backend:** `SequenceCatalog.generation_policy` + contrato Ola 1 ORG.

---

## 0. Las 10 preguntas — índice de respuestas

| # | Pregunta | Sección |
|---|----------|---------|
| 1 | ¿Cómo debe verse visualmente cada policy? | §1–§4 |
| 2 | ¿Qué controles aparecen? | §1–§4 columna Controles |
| 3 | ¿Cuándo aparece un textbox? | §1–§4 columna Textbox |
| 4 | ¿Cuándo debe ocultarse? | §1–§4 columna Ocultar |
| 5 | ¿Debe existir modo «Usar código manual»? | §5 |
| 6 | ¿Debe existir modo «Volver a automático»? | §6 |
| 7 | ¿Cómo evitar errores sin perder flexibilidad? | §7 |
| 8 | ¿Qué información contextual mostrar? | §8 |
| 9 | ¿Consistencia entre módulos? | §9 |
| 10 | ¿Componente reutilizable? | §10 |

---

## 1. AUTO_DEFAULT (patrón principal — ORG Ola 1)

**Semántica Backend:** Si payload omitido → auto; si valor presente → manual aceptado tras validación motor.

**Semántica UX:** **Automático es el camino feliz.** Manual es excepción operativa (implantación, migración, convivencia bootstrap).

### 1.1 Apariencia visual

```
┌─────────────────────────────────────────────────────────┐
│ Código                                                  │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🔢  Asignación automática                           │ │
│ │     El código se generará al guardar.               │ │
│ │     Formato típico: SUC001, DEP001, CAR001          │ │
│ └─────────────────────────────────────────────────────┘ │
│ ▸ Asignar código manualmente                            │
└─────────────────────────────────────────────────────────┘
```

- Panel informativo (`bg-subtle`, borde `border-border-base`) — **no** input editable.
- Icono neutro + copy en `text-text-soft`.
- Sin asterisco de required en CREATE.

### 1.2 Controles

| Modo | Controles visibles |
|------|-------------------|
| CREATE — auto (default) | Panel info + link colapsable «Asignar código manualmente» |
| CREATE — manual (expandido) | Textbox uppercase + botón/link «Usar asignación automática» |
| UPDATE | Textbox editable + banner advertencia al modificar |
| READ / post-201 | Texto read-only monospace + badge «Asignado» |

### 1.3 ¿Cuándo aparece textbox?

| Contexto | Textbox |
|----------|---------|
| CREATE default | **No** |
| CREATE manual activado | **Sí** — required mientras manual activo |
| UPDATE | **Sí** — editable (hasta BR-M-30 read-only futuro) |
| Detalle / listado | Columna existente — sin cambio |

### 1.4 ¿Cuándo ocultarse?

| Elemento | Ocultar cuando |
|----------|----------------|
| Panel auto | Manual activo |
| Textbox | Modo auto en CREATE |
| Link manual | Policy ≠ AUTO_DEFAULT o rol sin permiso override |
| Sección completa | Policy EXTERNAL o campo no es código motor |

### 1.5 Modo manual

**Sí**, mediante sección colapsada «Asignar código manualmente».

| Regla | Detalle |
|-------|---------|
| Default | Colapsada |
| Visible para | Rol implantación / admin tenant / flag `CODIGO_MANUAL_OVERRIDE` |
| Usuario operativo estándar | **No ve** el link — solo panel auto |
| Al expandir | Textbox con placeholder «Ej. SUC-LIMA-01», `maxLength` del contrato, uppercase visual |

### 1.6 Volver a automático

**Sí — obligatorio** cuando manual fue activado.

| Acción | Comportamiento |
|--------|----------------|
| «Usar asignación automática» | Limpia valor local; payload omitirá campo; colapsa sección manual |
| Dirty guard | Cambio auto↔manual cuenta como dirty |
| Confirmación | Si textbox manual tiene texto → ConfirmDialog warning antes de volver a auto |

### 1.7 Reducción de errores

| Riesgo | Mitigación UX |
|--------|---------------|
| Usuario inventa correlativo local | No mostrar input; prohibir preview local (P-05 contrato) |
| Duplicado manual | Error 409 inline en textbox manual |
| Formato inválido | Error 400 inline — mensaje Backend |
| Confusión «¿cuál será mi código?» | Copy contextual + post-201 toast con código asignado |
| Reservar EMP001 | Copy onboarding: «El primer código se asigna al guardar» — sin sugerir EMP001 |

### 1.8 Información contextual

| Elemento | Cuándo | Ejemplo |
|----------|--------|---------|
| Mensaje auto | CREATE auto | «El código se generará al guardar» |
| Formato típico | Si metadata disponible | «Formato: {PREF}{NNN}» — sin número concreto |
| Preview estimado | Futuro API cfg | «Próximo estimado: SUC042» — badge info, no binding |
| Post-201 | Tras éxito | Toast: «Sucursal creada (SUC003)» |
| Advertencia UPDATE | Al editar código existente | «Modificar el código puede afectar referencias en otros módulos» |

### 1.9 Consistencia

Mismo layout AUTO_DEFAULT en ORG, INV, LOG, COM, POS, HCM — ver [`03_ERP_CONSISTENCY_GUIDELINES.md`](03_ERP_CONSISTENCY_GUIDELINES.md).

### 1.10 Componente

`CodigoField` con `policy="AUTO_DEFAULT"` — ver [`02_CODIGO_FIELD_SPEC.md`](02_CODIGO_FIELD_SPEC.md).

---

## 2. AUTO_REQUIRED

**Semántica Backend:** Motor siempre asigna; payload con código manual rechazado o ignorado (según implementación futura).

**Semántica UX:** Usuario **nunca** interviene en CREATE. Máxima protección contra error humano.

### 2.1 Apariencia visual

```
┌─────────────────────────────────────────────────────────┐
│ Código                                                  │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 🔒  Código automático (obligatorio del sistema)     │ │
│ │     Se asignará al guardar. No requiere acción.      │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

- Panel read-only — **sin** link manual.
- Tono más definitivo que AUTO_DEFAULT (copy «obligatorio del sistema»).

### 2.2 Controles

| Modo | Controles |
|------|-----------|
| CREATE | Solo panel informativo |
| UPDATE | Read-only (recomendado) o editable con permiso especial futuro |
| READ | Display valor |

**Sin:** textbox, toggle manual, preview local.

### 2.3–2.4 Textbox / Ocultar

| Contexto | Textbox |
|----------|---------|
| CREATE | **Nunca** |
| UPDATE | **No** (read-only) salvo excepción normativa futura |

### 2.5–2.6 Manual / Volver a auto

| Pregunta | Respuesta |
|----------|-----------|
| Modo manual | **No** en CREATE |
| Volver a auto | N/A — siempre auto |

### 2.7–2.10 Errores, contexto, consistencia, componente

Igual AUTO_DEFAULT en post-201 y errores 404 cfg.  
`CodigoField` con `policy="AUTO_REQUIRED"` desactiva rama manual internamente.

---

## 3. MANUAL_ONLY

**Semántica Backend:** Motor no genera; usuario siempre provee código.

**Ejemplos ERP:** `org_parametro_sistema.codigo_parametro`, códigos legacy sin secuencia, catálogos con nomenclatura libre acotada.

**Semántica UX:** Textbox clásico Plantilla A — campo obligatorio visible.

### 3.1 Apariencia visual

```
┌─────────────────────────────────────────────────────────┐
│ Código *                                                │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ DEP-VENTAS                                          │ │
│ └─────────────────────────────────────────────────────┘ │
│ Identificador definido por el usuario. Debe ser único.  │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Controles

| Modo | Controles |
|------|-----------|
| CREATE | Label `Código *` + textbox + hint unicidad |
| UPDATE | Textbox editable (mismas reglas unicidad) |

**Sin:** panel auto, toggle manual/auto.

### 3.3–2.4 Textbox / Ocultar

Textbox **siempre visible** en CREATE y UPDATE.  
Panel auto **nunca** se muestra.

### 3.5–2.6 Manual / Volver a auto

| Pregunta | Respuesta |
|----------|-----------|
| Modo manual | **Siempre** — es el único modo |
| Volver a auto | **No aplica** |

### 3.7 Errores

409 duplicado inline; validación formato si Backend expone reglas.

### 3.8 Contexto

Hint: «Debe ser único en [ámbito: tenant / empresa]».  
No mostrar formato `{PREF}{NNN}` — no aplica.

### 3.10 Componente

`CodigoField` con `policy="MANUAL_ONLY"` renderiza textbox estándar — compatible con patrón catálogo V2 existente.

---

## 4. EXTERNAL

**Semántica Backend:** Campo **fuera** del Motor de Códigos.

**Ejemplos:** `ruc`, `codigo_ciiu`, `codigo_postal`, SKU de proveedor externo, número de factura SUNAT.

### 4.1 Regla absoluta

> **NO usar `CodigoField` para policy EXTERNAL.**

Usar input de dominio estándar con validación propia (RUC 11 dígitos, ubigeo, etc.).

### 4.2 Apariencia

Input normal del formulario — label de negocio («RUC *», «Código CIIU»), no «Código» genérico del motor.

### 4.3–4.10

| Pregunta | Respuesta |
|----------|-----------|
| Textbox | Sí — input dominio, no motor |
| Panel auto | **No** |
| Manual/auto toggle | **No** |
| CodigoField | **Prohibido** — `policy="EXTERNAL"` debe assert en dev |

---

## 5. Modo «Usar código manual» — decisión global

| Policy | ¿Existe? | Presentación |
|--------|----------|--------------|
| AUTO_DEFAULT | **Sí** | Link colapsable + gated por rol |
| AUTO_REQUIRED | **No** | — |
| MANUAL_ONLY | N/A | Siempre manual |
| EXTERNAL | **No** | Campo ajeno al motor |

**Gating recomendado:**

| Rol / condición | Override manual AUTO_DEFAULT |
|-----------------|------------------------------|
| Usuario operativo | Oculto |
| Admin cliente / implantación | Visible |
| Flag tenant `CODIGO_MANUAL_OVERRIDE=true` | Visible |
| Import / migración masiva | Flujo separado (CSV) — fuera de form modal |

---

## 6. Modo «Volver a automático» — decisión global

| Policy | ¿Existe? |
|--------|----------|
| AUTO_DEFAULT | **Sí** — solo si manual fue activado |
| Resto | No aplica |

**Comportamiento:**

1. Limpia valor del textbox.  
2. Estado interno → `assignmentMode: 'auto'`.  
3. Payload builder → `undefined` (omitir propiedad).  
4. Colapsa sección manual.  
5. Si había texto → ConfirmDialog `warning` (discard manual entry).

---

## 7. Reducción de errores sin perder flexibilidad

| Capa | Mecanismo |
|------|-----------|
| **Prevención** | Ocultar input en AUTO_DEFAULT default |
| **Progressive disclosure** | Manual solo bajo demanda + rol |
| **Validación** | Errores Backend inline en textbox manual |
| **Feedback** | Post-201 muestra código definitivo |
| **No hacer** | Preview correlativo calculado en FE |
| **No hacer** | Mostrar UUID o contador interno |
| **Flexibilidad** | Manual para implantación; auto para operación |
| **Rollback UX** | «Volver a automático» sin perder resto del form |

---

## 8. Información contextual — catálogo normativo

| ID | Mensaje | Policy | Momento |
|----|---------|--------|---------|
| CTX-01 | «El código se generará al guardar» | AUTO_DEFAULT, AUTO_REQUIRED | CREATE pre-submit |
| CTX-02 | «Formato típico: {ejemplo}» | AUTO_* | CREATE — solo si config metadata |
| CTX-03 | «Próximo estimado: {X}» | AUTO_* | Futuro — API cfg admin |
| CTX-04 | «Creado con código {X}» | AUTO_* | Post-201 toast |
| CTX-05 | «Debe ser único en esta empresa» | MANUAL_ONLY | CREATE/UPDATE |
| CTX-06 | «Modificar el código puede afectar referencias» | AUTO_DEFAULT | UPDATE al dirty código |
| CTX-07 | «Código asignado: {X}» | AUTO_* | Detalle inmediato post-create |

Copy en español; tono informativo; `text-text-soft`; sin IDs UUID (E-ME4).

---

## 9. Consistencia cross-módulo ERP

| Dimensión | Regla |
|-----------|-------|
| Mismo componente | `CodigoField` en todos los módulos |
| Misma policy → misma UI | Matriz §1–§4 |
| Mismo copy | Catálogo CTX-* centralizado |
| Mismos tokens | Capa 1 diseño — no `gray-*` |
| Mismo payload | Util `buildCodigoPayloadValue()` |
| Mismos errores | 409/400 inline en campo |
| Plantilla A modal | CodigoField en sección «Información general» — primera o segunda fila |
| UPDATE | Misma advertencia cross-módulo |

**ORG certifica el patrón; INV/LOG/COM/POS/HCM copian config, no reimplementan UI.**

---

## 10. Componente reutilizable — resumen

Ver especificación completa: [`02_CODIGO_FIELD_SPEC.md`](02_CODIGO_FIELD_SPEC.md).

```
CodigoField
├── policy: AUTO_DEFAULT | AUTO_REQUIRED | MANUAL_ONLY
├── mode: create | update | read
├── value / onChange (controlado)
├── assignmentMode / onAssignmentModeChange (AUTO_DEFAULT)
├── fieldKey (nombre API: codigo | codigo_empresa | …)
├── label, error, disabled
├── sequenceMeta? (prefijo, ejemplo, sequenceKey)
├── allowManualOverride? (override gating)
└── onPayloadValueChange?(undefined | string)
```

**Desacoplamiento ORG:** ningún import de `@/features/org/*`. Config declarativa en cada página.

---

## 11. Matriz comparativa rápida

| Dimensión | AUTO_DEFAULT | AUTO_REQUIRED | MANUAL_ONLY | EXTERNAL |
|-----------|--------------|---------------|-------------|----------|
| Panel auto CREATE | ✅ Default | ✅ Único | ❌ | ❌ |
| Textbox CREATE | Solo manual ON | ❌ | ✅ Siempre | Input dominio |
| Link manual | ✅ Colapsado | ❌ | ❌ | ❌ |
| Volver a auto | ✅ | ❌ | ❌ | ❌ |
| Post-201 toast código | ✅ | ✅ | Opcional | N/A |
| Usa CodigoField | ✅ | ✅ | ✅ | ❌ |
| ORG Ola 1 | ✅ 5 entidades | — | ParametrosPage | RUC, CIIU |

---

*Siguiente: [`02_CODIGO_FIELD_SPEC.md`](02_CODIGO_FIELD_SPEC.md)*
