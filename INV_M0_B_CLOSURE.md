# Cierre INV-M0-b — Corrección de regresiones

**Fecha:** 31 mayo 2026  
**Alcance:** Solo fixes P0/P1/P2 de auditoría post-M0-b. Sin INV-M1-UX. Sin commit.

---

## Incidencias cerradas

| ID | Sev. | Estado | Resumen |
|----|------|--------|---------|
| **REG-001** | P0 | **Cerrada** | `UnidadesMedidaPage`: `empresas.length` → `scopeEmpresaId` en empty state |
| **REG-002** | P1 | **Cerrada** | `ProductosPage`: botón Crear ya no queda deshabilitado por loading de UM |
| **REG-005** | P1 | **Cerrada** | Misma corrección que REG-002 (`sinUnidadesMedidaEnSesion`) |
| **REG-003** | P2 | **Cerrada** | `StockPage`: `cantidad_actual`, reservado/disponible con `.toFixed(2)` |
| **REG-004** | P2 | **Cerrada** | `StockPage`: columnas Mínimo, Valor total, banner alertas, botón Kardex |

---

## Motivo final — Productos “Crear producto” deshabilitado (REG-002 / REG-005)

**Causa confirmada:** **REG-005 (falso positivo en loading)** — no regresión de `scopeEmpresaId` ni de `canQueryCompanyScoped`.

La condición previa era:

```ts
unidadesMedida.length === 0
```

Mientras `useUnidadesMedida` está en estado inicial o cargando, `data` es `undefined` → `unidadesMedida` = `[]` → `length === 0` → el botón quedaba **deshabilitado aunque la sesión y los permisos fueran correctos**.

**Corrección aplicada:**

```ts
const sinUnidadesMedidaEnSesion =
  unidadesQuery.isSuccess && unidadesMedida.length === 0;
```

- **Habilitado** durante loading/error de UM (salvo falta de scope).
- **Deshabilitado** solo cuando la API respondió OK y la empresa de sesión **no tiene unidades de medida activas** (regla de negocio preexistente: producto requiere `unidad_medida_base_id`).

**Efecto en cadena REG-001:** Si Unidades no cargaba por crash, Productos podía parecer roto; con REG-001 corregido, el flujo de alta de UM vuelve a ser posible.

---

## Incidencias pendientes (fuera de cierre M0-b mínimo)

| ID | Sev. | Nota |
|----|------|------|
| **REG-006** | P2 | Kardex no consume query string desde Stock — backlog UX |
| **REG-007** | P3 | Hooks `*-detalle` con `empresa_id` manual — limpieza técnica |
| **REG-008** | P3 | `OrgSessionEmpresaField` usa `useOrgSessionScope` — aceptado (misma JWT) |

---

## Archivos modificados (este cierre)

- `src/features/inv/pages/UnidadesMedidaPage.tsx`
- `src/features/inv/pages/ProductosPage.tsx`
- `src/features/inv/pages/StockPage.tsx`
- `INV_M0_B_CLOSURE.md` (este documento)

---

## Checklist QA actualizado

### Bloqueante (P0/P1)

- [ ] **Unidades:** carga con lista vacía y con datos; sin error en consola; CTA empty “Crear unidad” visible con sesión activa.
- [ ] **Productos:** con sesión + UM existentes → **Crear producto** habilitado tras cargar UM (no gris permanente).
- [ ] **Productos:** sin UM en empresa → Crear deshabilitado (negocio esperado).
- [ ] **Stock:** columnas Actual, Reservado, Disponible, Mínimo, Valor total con valores; filas bajo mínimo resaltadas; banner inferior si aplica.

### Multiempresa (M0-b)

- [ ] Sin selector “Todas las empresas” en ninguna pantalla INV migrada.
- [ ] Cambio de empresa en header → listas INV se actualizan; filtros locales resetean.

### Transaccional

- [ ] Movimientos / IF: Nuevo/Nueva toma accesible con permiso `crear`.
- [ ] Forms: empresa readonly de sesión; guardar create OK.

### Regresión conocida no incluida

- [ ] Enlace Stock → Kardex con filtros en URL (REG-006) — opcional.

---

## Veredicto

**INV-M0-b puede declararse cerrado funcionalmente** para el alcance acordado (multiempresa JWT + regresiones REG-001–004), pendiente QA manual del checklist anterior.
