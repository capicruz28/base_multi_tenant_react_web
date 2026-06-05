# Auditoría patrón de módulo ERP — ORG vs INV

**Fecha:** 31 mayo 2026  
**Estado:** Solo auditoría estratégica — sin implementación, sin commit  
**Pregunta central:** ¿Qué módulo debe ser el **patrón** para futuros desarrollos?

---

## 1. Respuesta ejecutiva

| Pregunta | Respuesta |
|----------|-----------|
| ¿ORG debe ser el módulo patrón? | **Sí**, para **infraestructura multiempresa**, **listados CRUD**, **modales seguros (B.1.1)** y **UX de tabla** post E-UX. |
| ¿INV debe ser el módulo patrón? | **Sí**, pero **solo** para **transacciones cabecera+detalle**, **service layer INV** (deprecated) y **formularios en página completa** con líneas embebidas. |
| ¿Un solo módulo para todo? | **No.** El patrón correcto es **bifurcado**: ORG = plataforma operativa; INV = dominio inventario/transaccional. |

**Meta recomendada:** Extraer un paquete **`erp-platform`** (nombre ilustrativo) desde ORG + IAM, e importar patrones INV solo donde el dominio lo exija.

---

## 2. Matriz por dimensión de patrón

### 2.1 Infraestructura

| Criterio | ORG | INV | Patrón ganador |
|----------|-----|-----|----------------|
| Sesión JWT empresa | `useOrgSessionScope`, invalidación queries | `useEmpresaActiva` puntual + filter local | **ORG** |
| Tenant en query keys | Hooks ORG (direct `useQuery` + invalidate) | `useTenantQuery` | **INV** (ya en core; ORG debería adoptar **REC**) |
| Route guards empresa | `OrgCompanyRouteGuard` | Ninguno | **ORG** |
| Error scope 403 | `useOrgEmpresaScopeErrorHandler` | No | **ORG** |
| Impersonación / selection_pending | Integrado en scope | No considerado | **ORG** |

**Decisión:** **ORG** define infraestructura multiempresa; **INV** debe consumirla, no reinventarla.

**Justificación:** Meses de cierre P0/P1/E-SEC asumen header como fuente de verdad. INV con `empresaFilter` local contradice interceptores JWT y riesgo de datos ajenos.

---

### 2.2 Patrón funcional (dominio + API)

| Criterio | ORG | INV | Patrón ganador |
|----------|-----|-----|----------------|
| Maestros CRUD modal | 6 entidades homogéneas | 5 maestros similares | **Empate** (misma idea; ORG más maduro en guards) |
| Parámetros híbridos GLOBAL/OVERRIDE | `ParametrosPage` | N/A | **ORG** (único) |
| Tenant-wide empresa | `EmpresaPage` | N/A | **ORG** |
| Stock / Kardex lectura | N/A | Implementado | **INV** |
| Movimientos / inventario físico | N/A | `*FormPage` + `con-detalle` | **INV** |
| Respeto deprecated OpenAPI | org.service limpio | inv.service documentado + hooks deprecated marcados | **INV** (más explícito en contrato) |

**Decisión funcional:**

- **Maestros simples:** copiar flujo **ORG** (hook + modal + tabla + RBAC).  
- **Transacciones con líneas:** copiar flujo **INV** (`MovimientoFormPage` como plantilla).  
- **Híbridos tenant/company:** solo ORG tiene precedente.

---

### 2.3 Patrón UX

| Criterio | ORG (post E-UX.1) | INV | Patrón ganador |
|----------|-------------------|-----|----------------|
| Toolbar compacta | `OrgCompanyToolbar` + `OrgToolbarSearch` | `flex-wrap` + select empresa + búsqueda nativa | **ORG** |
| Empty state tabular | `IamTableEmptyState` + `hasSearch` | Inline manual | **ORG** |
| Skeleton listado | `OrgTableSkeleton` → `InvTableSkeleton` | Origen skeleton | **INV** (origen técnico) / **ORG** (integración con empty) |
| Sin H1 en body | `OrgPageLayout` | `InvPageLayout` (equivalente) | **Empate** |
| B.1.1 discard modales | 6/6 páginas | 0/6 maestros | **ORG** |
| Confirmación baja lógica | `ConfirmDialog` | `ConfirmDialog` | **Empate** |
| Debounce búsqueda | No | No | **Ninguno** (IAM tiene referencia) |

**Decisión UX:** **ORG** es patrón de listado; **INV** aporta skeleton y layout transaccional de secciones (`MovimientoFormPage`).

---

### 2.4 Patrón multiempresa

| Criterio | ORG | INV |
|----------|-----|-----|
| Selector empresa en página | ❌ Eliminado (correcto) | ✅ En 11 flujos (incorrecto vs cierre ORG) |
| UUID visible | E-ME4 cerrado | Selects muestran nombres; OK en UI; values internos OK |
| Body `empresa_id` | `assertBodyEmpresaMatchesSession` | Usuario elige en form |
| Cambio empresa header | Invalida cache ORG | Desincronización en mayoría páginas |

**Patrón ganador:** **ORG exclusivamente.**

INV **no** debe ser patrón multiempresa hasta completar INV-M0 (ver `INVENTORY_MULTIEMPRESA_AUDIT.md`).

---

### 2.5 Patrón formularios

| Criterio | ORG | INV |
|----------|-----|-----|
| Modales maestros | `FormSection`, dirty B.1.1 | Modales sin dirty guard |
| Form página completa | No (Empresa es excepción monolito) | Movimiento / Inventario físico |
| Líneas editables pre-submit | No | Sí (tabla líneas + agregar) |
| Geo cascada | Empresa, Sucursal | No |
| FK selects | Catálogos cargados | Producto, almacén, UM en forms |

**Decisión:**

- **Modal maestro:** ORG.  
- **Cabecera + líneas:** INV.  
- **EmpresaPage:** no copiar; plan refactor E-EMP aparte.

---

### 2.6 Patrón tablas

| Criterio | ORG | INV |
|----------|-----|-----|
| Columnas operativas | Curadas, sin UUID | Curadas en general |
| Acciones RBAC | No renderizar si no permiso | Igual |
| Loading | Skeleton | Skeleton en listas |
| Paginación | No en ORG (API sin page en muchos) | Igual en mayoría |

**Patrón ganador:** **ORG** para empty + toolbar; **INV** igual en skeleton (mismo componente).

---

### 2.7 Patrón cabecera / detalle

| Aspecto | ORG | INV |
|---------|-----|-----|
| Casos | No aplica | Movimientos, inventario físico |
| API | N/A | `con-detalle` único submit |
| UI | N/A | Página dedicada, secciones, líneas locales |

**Patrón ganador:** **INV** — único módulo con implementación completa y alineada a `.cursorrules`.

ORG no compite en esta dimensión.

---

## 3. ¿ORG o INV como “módulo patrón” global?

### Si se elige solo ORG

**Pros:** Multiempresa, UX cerrada, B.1.1, guards, menor riesgo SaaS.  
**Contras:** No enseña transacciones; `EmpresaPage` monolito puede inducir malas copias; hooks sin `useTenantQuery`.

### Si se elige solo INV

**Pros:** Cobertura inventario completa; `con-detalle`; service bien documentado.  
**Contras:** Multiempresa roto vs política actual; sin B.1.1; empty states débiles; duplicación `loadEmpresas`.

### Veredicto

```
Patrón global ERP = ORG (plataforma) + INV (transaccional)
```

Ninguno sustituye al otro. Documentar en PROMPT y `.cursorrules` **dos plantillas**:

1. **Plantilla A — Listado maestro** (ORG)  
2. **Plantilla B — Documento transaccional** (INV)

---

## 4. Qué copiar al iniciar INV (checklist estratégico)

| # | Desde ORG | Desde INV |
|---|-----------|-----------|
| 1 | `useOrgSessionScope` → generalizar | Mantener `inv.service` |
| 2 | `OrgCompanyToolbar` / `OrgToolbarSearch` | `InvTableSkeleton` |
| 3 | `IamTableEmptyState` | `MovimientoFormPage` estructura |
| 4 | B.1.1 discard stack | Hooks `*ConDetalle` |
| 5 | `OrgSessionEmpresaField` | Tipos embebidos detalle |
| 6 | Query gate + invalidate | `INV_LIST_STALE_TIME_MS` |
| 7 | — | No copiar `empresaFilter` |

---

## 5. Riesgo de declarar INV “listo” sin ORG patterns

| Riesgo | Probabilidad | Impacto |
|--------|--------------|---------|
| Datos de empresa B mientras header muestra A | Alta | Crítico |
| Regresión overlay modales | Media | Alto |
| Inconsistencia visual entre módulos | Alta | Medio |
| Deuda ProductosPage × 2 (mono + desalineado) | Alta | Alto |

---

## 6. Conclusión para steering

1. **Cerrar ORG** como módulo de negocio ✅  
2. **No cerrar INV** hasta INV-M0 multiempresa + paridad UX mínima  
3. **Invertir en extracción shared** antes de escalar a SLS/PUR/FIN  
4. **INV** sigue siendo el **mejor candidato patrón funcional transaccional**; **ORG** es el **mejor candidato patrón plataforma**

---

*Documento generado sin cambios en código. Sin commit.*
