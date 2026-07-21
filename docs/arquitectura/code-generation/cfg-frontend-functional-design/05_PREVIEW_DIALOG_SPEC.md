# CFG — Especificación Dialog de Preview

**Versión:** 1.0  
**Nombre funcional:** `CfgSecuenciaPreviewDialog`  
**Permiso:** `cfg.secuencias.consultar`  
**operationId:** `preview_cfg_codigo_secuencia`

---

## 1. Propósito

Mostrar una **estimación** del próximo código (`codigo_estimado`) **sin consumir** el contador.

No es allocate. No reserva número. No muta la secuencia.

---

## 2. Cuándo mostrar el trigger

| Condición | Botón Preview |
|-----------|---------------|
| Sin `consultar` | Oculto |
| `supports_preview === false` | Oculto |
| `supports_preview` ausente/true | Visible |
| Secuencia inactiva | Visible (con aviso en resultado) |
| `config_locked` | Visible (preview no edita) |

Triggers: columna Acciones del listado y footer del Edit Dialog.

---

## 3. Apertura y request

| Paso | Detalle |
|------|---------|
| Click Preview | Abrir dialog → estado `previewing` |
| Request | `POST /api/v1/cfg/secuencias/{secuencia_id}/preview` |
| Body | Vacío |
| Cache | **No** cachear como dato maestro; resultado de la mutación/query one-shot |

---

## 4. Contenido del dialog

### Loading (`previewing`)

- Spinner centrado + texto “Calculando estimación…”
- Botón Cerrar disponible (cancela visualmente; si request en vuelo, ignorar resultado al cerrar).

### Success 200

| Elemento | Fuente | UI |
|----------|--------|-----|
| Título | Fijo | “Código estimado” |
| Valor | `codigo_estimado` | Tipografía destacada (mono / text-lg+), centrado |
| Disclaimer | `disclaimer` (API) | Siempre visible, `text-text-soft` |
| No consume | `consume_contador === false` | Texto fijo: “Esta estimación no consume el correlativo.” |
| Contador actual | `ultimo_numero_actual` | Secundario, label “Último número actual” |
| Número inicial | `numero_inicial` | Secundario opcional |
| Inactiva | `es_activo === false` | Banner warning: “La secuencia está inactiva.” |

Referencia visual: estilo `CodigoFieldAutoPanel` + `CodigoFieldWarningBanner` (sin acoplar FCE).

### Error 422 `PREVIEW_NOT_ALLOWED`

- Mensaje: “La previsualización no está disponible para esta secuencia.”
- Cerrar o mostrar empty en dialog; **ocultar/deshabilitar** Preview para esa secuencia en la sesión UI.

### Error 403 / 404 / 5xx

- Toast vía `onError`; cerrar dialog en 404; reintento manual solo en 5xx/red.

---

## 5. Footer

| Botón | Acción |
|-------|--------|
| Cerrar | Cierra dialog; no invalida listado |

Sin botón “Usar este código” ni “Confirmar”.

---

## 6. Relación con cache / refresh

| Acción | ¿Invalidar listado? | ¿Invalidar detail? | ¿Asumir cambio ultimo_numero? |
|--------|:-------------------:|:------------------:|:-----------------------------:|
| Preview 200 | **No** | **No** (obligatorio) | **No** |
| Preview error | No | No | No |

Opcional: no guardar resultado en React Query, o key `['cfg','preview', id]` con `gcTime`/`staleTime` muy corto y sin uso como source of truth.

---

## 7. Stack con Edit Dialog

- Preview puede montarse **encima** del Edit (ver `02_SCREEN_DESIGN` §4.1).
- Al cerrar Preview, Edit permanece con su estado.
- Si hay Confirm de desactivar, Preview no debe estar abierto.

---

## 8. Copy prohibido

- “Código reservado”
- “Próximo código asignado”
- “Se usará este código al guardar”
- Cualquier promesa de allocate

---

## 9. Accesibilidad

- Título anunciado al abrir.
- Valor estimado con contraste adecuado.
- Disclaimer no solo por color (texto explícito).
- Focus trap en dialog; retorno de foco al botón Preview trigger.
