# CFG — Responsive y accesibilidad

**Versión:** 1.0

---

## 1. Breakpoints (guía)

| Viewport | Listado | Dialogs |
|----------|---------|---------|
| ≥1024px (desktop) | Tabla completa + todos los filtros en toolbar | Dialog ancho medio (`sm`/`md`); grid 2 cols formato |
| 768–1023px (tablet) | Tabla con scroll horizontal; filtros wrap | Grid 1–2 cols |
| &lt;768px (móvil) | Scroll-X tabla; filtros apilados; acciones en menú fila o iconos | Dialog casi full-width; 1 col; footer sticky |

El ERP no es mobile-first crítico; debe **usar sin romper**.

---

## 2. Toolbar responsive

- Filtros: `flex flex-wrap gap-2`.
- Search: ancho fijo en desktop (`w-52`); `w-full` en móvil.
- Limpiar filtros: visible cuando hay filtros activos.

---

## 3. Tabla responsive

- `min-w-full` + contenedor `overflow-x-auto`.
- Prioridad de columnas en viewports estrechos (ocultar visualmente con CSS si hace falta):

| Prioridad | Columnas |
|-----------|----------|
| Alta | `sequence_key`, Estado, Acciones |
| Media | Prefijo, Último N.º |
| Baja | Módulo, Ámbito, Fecha |

Nunca eliminar Acciones en móvil.

---

## 4. Dialogs responsive

- `DialogBody` con scroll interno (MD-05…08).
- Footer acciones: en móvil apilar botones o wrap; Guardar full-width opcional.
- Preview: valor estimado legible (no overflow oculto).

---

## 5. Accesibilidad (a11y)

| Requisito | Spec |
|-----------|------|
| Teclado | Tab order lógico en toolbar → tabla → paginación → dialogs |
| Focus trap | Dialogs Radix / Confirm |
| Escape | Cierra dialog si no dirty; si dirty → discard flow |
| Labels | Todo input con `<Label>` asociado |
| Botones icono | `aria-label` (Editar, Ver, Preview, Desactivar, Reactivar) |
| Badges | Texto visible, no solo color |
| Tabla | Headers `<th>` con sort anunciable |
| Live regions | Toasts existentes de la app; errores de campo junto al input |
| Contraste | Tokens Capa 1 / semánticos |
| Reduced motion | No animaciones esenciales al significado |

---

## 6. Touch

- Targets de acción ≥ 32–40px en móvil.
- Confirm dialogs con botones claros (no solo iconos).

---

## 7. Impresión / export

Fuera de MVP. No diseñar exportar listado en esta versión.
