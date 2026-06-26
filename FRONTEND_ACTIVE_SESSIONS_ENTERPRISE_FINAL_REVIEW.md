# FRONTEND — Active Sessions Enterprise UX — Revisión Final Pre-Implementación

**Documento:** `FRONTEND_ACTIVE_SESSIONS_ENTERPRISE_FINAL_REVIEW.md`  
**Versión:** 1.0  
**Fecha:** 2026-06-23  
**Estado:** **REVISIÓN CRÍTICA — READ ONLY**  
**Revisor:** Arquitecto Principal UX Enterprise (rol simulado)  
**Objeto revisado:** `FRONTEND_ACTIVE_SESSIONS_ENTERPRISE_UX_DESIGN.md` v1.0

**Restricciones respetadas:** Backend congelado · OpenAPI congelado · sin código.

---

## 0. Dictamen ejecutivo

### **Requiere Ajustes** (apto para implementación tras corrección del diseño v1.1)

El diseño v1.0 resuelve correctamente el problema raíz (10 columnas → scroll horizontal, redundancia dispositivo, fechas absolutas) y está alineado con el contrato `GET /auth/sessions/admin/` y la plantilla Admin IAM Tier C. **No debe reescribirse desde cero.**

Sin embargo, **siete observaciones P0/P1** deben incorporarse al documento de diseño **antes del kickoff de Fase 1** para evitar fricción normativa (V2), deuda de componentes inexistentes (Drawer/Sheet), ambigüedad en KPIs bajo filtros, y sobrecarga de red en tenants grandes.

**Condición de aprobación:** actualizar `FRONTEND_ACTIVE_SESSIONS_ENTERPRISE_UX_DESIGN.md` → **v1.1** con las modificaciones de la tabla §4. Tras ello, el diseño queda **Aprobado para Implementación** por fases.

---

## 1. Metodología de revisión

| Eje evaluado | Criterio |
|--------------|----------|
| Columnas | Escaneo <10 s, cero scroll en 1280 px, info P0 visible sin Drawer |
| KPIs | Valor operativo vs coste/red; honestidad bajo filtros |
| Drawer/Detalle | Progressive disclosure; sin duplicación; patrón IAM existente |
| Escala | 100–5000 sesiones; paginación server; sin full-load |
| Patrones Enterprise | Okta/Azure AD/AWS IAM session lists; ERP V2 IAM §9.1 |
| Riesgos | a11y, mantenimiento, normativa PB-15/B11, React Query fan-out |

**Referencias cruzadas:** código actual (`ActiveSessionsPage`, `UserManagementPage`), `ERP_FRONTEND_STANDARDS_V2.md`, `ERP-IAM-SESSIONS-FE-DESIGN-01.md` (Drawer deferido V1.1), inventario UI (`Dialog` + `DialogBody` — **sin** `Sheet`/Drawer en repo).

---

## 2. Evaluación por dimensión

### 2.1 Distribución de columnas — ¿óptima?

**Veredicto parcial:** la reducción 10 → **6** es direccionalmente correcta, pero **6 sigue siendo el máximo recomendable**; en 1024 px la columna Usuario (3 líneas) + Cliente (badge + label) puede producir **filas altas** que reducen filas visibles por viewport.

| Columna propuesta | ¿Visible sin Drawer? | ¿Imprescindible en grilla? | Observación |
|-------------------|----------------------|----------------------------|-------------|
| Usuario + empresa | ✅ Sí | ✅ Sí | Correcto para multiempresa |
| Cliente (tipo + device_label) | ✅ Sí | ✅ Sí | Sustituye 3 columnas actuales |
| IP + alerta mismatch | ✅ Sí | ✅ Sí | Decisión de seguridad acertada |
| Actividad (last_refresh relativo) | ✅ Sí | ⚠️ Parcial | Confundible con actividad ERP — requiere micro-copy |
| Vigencia (expires + badge) | ✅ Sí | ✅ Sí | Badge `expiring_soon` no debe ocultarse en Drawer |
| Acciones | ✅ Sí | ✅ Sí | Revocar debe permanecer en grilla (P0 operativo) |

**Información más consultada sin Drawer:** usuario, empresa, dispositivo/tipo, IP, estado caducidad, acción revocar — **cubierta**.

**Información que puede esperar al detalle:** fechas absolutas, `user_agent`, `login_ip` vs last seen explicado, `last_business_activity_at`, duración — **correctamente relegada**.

**Alternativa enterprise más densa (5 columnas):** fusionar **Actividad + Vigencia** en una columna **«Estado»** (línea 1: «Hace 5 min» · línea 2: «Expira en 2 h» + badge). Misma información, una columna menos. **Recomendado evaluar en v1.1** si QA en 1024 px confirma filas >72 px de alto con layout de 6 columnas.

**Conclusión:** ni demasiadas ni demasiado pocas para desktop 1280 px; **ajustar a 5 columnas es opcional pero preferible** si se prioriza densidad sobre separación semántica refresh/expira.

---

### 2.2 KPIs — ¿aportan valor?

| KPI | Valor | Coste | Recomendación revisión |
|-----|-------|-------|------------------------|
| **Sesiones activas (total)** | Alto — ancla situacional | 1 query `limit=1` | **Mantener** con etiqueta explícita «Total tenant» |
| **Web** | Medio — útil rollout mobile/web | 1 query | **Mantener** como filtro rápido |
| **Mobile** | Medio | 1 query | **Mantener** |
| **Expira pronto (conteo cota)** | Bajo-Medio — **riesgo de falsa precisión** | 1 query `limit=100` + cómputo FE | **Modificar** → enlace/preset sin número, o chip «Ver por expirar» |

**Problema P0 no resuelto en diseño v1.0:** cuando el admin aplica filtro Web, el total paginado (ej. 49) difiere del KPI total (247). Sin copy diferenciado, el admin interpretará bug.

**Modificación obligatoria v1.1:**

```
Sin filtros:  KPI «247 activas» = total paginación
Con filtros:  Subtítulo paginación «49 resultados (de 247 en el tenant)»
              KPIs globales permanecen sin filtrar OR se atenúan visualmente
```

**Patrón enterprise superior observado:** dashboards de identidad (Okta, Entra ID) muestran **total + lista filtrada** explícitamente; rara vez un KPI numérico aproximado de «expiring soon» sin endpoint stats.

**Carga en escala:** 4 KPI + 1 list = **5 requests** por visita; con auto-refresh 60 s × varios admins → aceptable si `staleTime` KPI ≥ 60 s e invalidación acotada. **No escala mal en miles de sesiones** (counts indexados server-side); escala mal si **cada admin** deja auto-refresh ON sin necesidad.

---

### 2.3 Drawer — ¿contenido correcto?

**Veredicto:** contenido **mayormente correcto**, con redundancias y un antipatrón de shell.

| Elemento Drawer | Decisión revisión | Motivo |
|-----------------|-------------------|--------|
| Avatar placeholder | **Eliminar** | No existe en API; ruido visual |
| Identidad usuario + empresa | Mantener | — |
| Sección DISPOSITIVO (label + browser/os + tipo) | **Modificar** → bloque único | Tres formas de decir lo mismo |
| RED (login_ip vs last seen) | Mantener | Valor forense real |
| TIEMPOS (4 timestamps + duración) | **Modificar** | Mantener timestamps; `duration_seconds` → secundario o eliminar |
| `last_business_activity_at` | Mantener con nota V2 | Educa sobre semántica refresh vs ERP |
| `user_agent` literal | **Modificar** → sección colapsable «Diagnóstico avanzado» | 90 % revocaciones no lo necesitan |
| Botón Revocar en Drawer | Mantener | Duplica fila — aceptable en detalle |

**Patrón shell UI — observación P0:**

El repositorio IAM usa **`Dialog` + `DialogBody`** (`UserCreateDialog`, `UserEditDialog`). **No existe** componente `Sheet`/Drawer en `shared/ui`. Introducir Drawer implica **nuevo primitivo** o dependencia — deuda no justificada frente a **Dialog lateral ancho** (`max-w-lg` + scroll interno, V2 MD-05…MD-08).

**Modificación obligatoria v1.1:** renombrar `SessionDetailDrawer` → **`SessionDetailDialog`**; wireframe Drawer → **Dialog modal** coherente con IAM Admin.

**Apertura por click en fila — observación P0 normativa:**

El diseño cita **PB-15 (B-L Hub)** para justificar click en fila. PB-15 aplica a **listados transaccionales B-L**, no a IAM Admin. Aun así, PB-15 refleja buena práctica de accesibilidad: **no depender del click en `<tr>`**.

**Modificación obligatoria v1.1:**

- **MUST:** botón **`Eye` «Ver detalle»** visible en columna Acciones (patrón `UserManagementPage` iconos fila).
- **MAY:** click fila abre detalle como acelerador, **sin** `cursor-pointer` como única vía.
- **MUST NOT:** revocar desde click fila.

---

### 2.4 Escalabilidad (cientos / miles de sesiones)

| Aspecto | Diseño v1.0 | Escala |
|---------|-------------|--------|
| Paginación server 10/25/50 | ✅ | Miles de sesiones OK |
| Sin full-load legacy | ✅ | OK |
| Búsqueda server `search` | ✅ | Crítica a >500 sesiones |
| KPI counts vía `total` | ✅ | OK independiente del volumen |
| Agrupación mismo usuario (Fase 5) | Solo página actual | Limitación aceptable documentada |
| Virtualización tabla | No propuesta | Innecesaria con page size ≤50 |

**Riesgo P1:** filas de 3 líneas × 50 = scroll vertical largo. Mitigación: 5 columnas, `limit` default **25** (ya es default), truncado con `title` en empresa.

**Conclusión escala:** **aprobado** con paginación; no requiere virtual scroll.

---

### 2.5 Patrones UX Enterprise más adecuados

Referencias de consolas IAM/SaaS y alineación ERP:

| Patrón enterprise | Diseño v1.0 | Ajuste sugerido |
|-------------------|-------------|-----------------|
| Tabla densa + detalle lateral/modal | ✅ | Dialog IAM, no Drawer nuevo |
| Tiempo relativo + tooltip absoluto | ✅ | Mantener |
| Acciones destructivas en fila + confirm | ✅ | Mantener |
| Filtro por identidad (usuario) | ✅ Fase 3 | **Subir a Fase 2** — param BE ya existe; alto valor soporte |
| Bulk revoke | No propuesto | Correcto — fuera contrato |
| Export CSV | No propuesto | Correcto — fuera contrato |
| KPI global vs filtrado explícito | ⚠️ Incompleto | Corregir copy |
| Iconos acción vs menú ⋯ | Menú propuesto | **Iconos** al estilo IAM |

---

### 2.6 Riesgos usabilidad, accesibilidad, mantenimiento

| ID | Riesgo | Sev | Mitigación v1.1 |
|----|--------|-----|-----------------|
| R-A11Y-01 | Revocar solo icono sin texto visible | P1 | `aria-label` + tooltip; mantener copy «Cerrar sesión» en confirm |
| R-A11Y-02 | Click fila invisible a teclado | P0 | Botón Eye obligatorio |
| R-A11Y-03 | Dialog/Confirm stack (B11-10) | P1 | Cerrar Dialog detalle antes de ConfirmDialog revoke |
| R-UX-01 | «Actividad» confundida con uso ERP | P1 | Renombrar columna **«Último refresh»**; tooltip educativo |
| R-UX-02 | KPI expira pronto engañoso | P1 | Eliminar número o mostrar «≥ N» con disclaimer permanente |
| R-MNT-01 | Nuevo primitivo Drawer | P0 | Usar Dialog existente |
| R-MNT-02 | Dual sort presets + headers | P2 | Una fuente de verdad; headers primarios, presets atajos |
| R-MNT-03 | 5 queries React Query | P1 | Hook `useActiveSessionsKpiSummary` con staleTime 60 s compartido |
| R-MNT-04 | Auto-refresh ON × 5 queries | P1 | Default **OFF**; refresh manual + timestamp |
| R-NORM-01 | Cita incorrecta PB-15 | P0 | Eliminar o acotar a «buena práctica a11y, no B-L» |

---

## 3. Observaciones priorizadas

### P0 — Bloqueantes pre-implementación

| ID | Observación | Acción requerida en diseño v1.1 |
|----|-------------|----------------------------------|
| **REV-P0-01** | **Drawer no existe en shell IAM** — deuda de componente nueva | Sustituir por **`SessionDetailDialog`** (`Dialog` + `DialogBody` scroll) |
| **REV-P0-02** | **Click fila como apertura principal** — insuficiente para a11y; cita PB-15 incorrecta | **Eye obligatorio** en Acciones; click fila opcional; corregir referencia normativa |
| **REV-P0-03** | **KPI vs paginación bajo filtros** — ambigüedad «total» | Copy dual: total tenant (KPI) vs resultados filtrados (paginación) |
| **REV-P0-04** | **Columna Acciones** — menú ⋯ + icono LogOut duplica affordances | **Dos iconos:** `Eye` + `LogOut`; eliminar dropdown |

### P1 — Ajustes recomendados antes o durante Fase 1

| ID | Observación | Acción requerida |
|----|-------------|------------------|
| **REV-P1-01** | **6 columnas** en 1024 px — filas altas | Evaluar **5 columnas** (fusionar Actividad+Vigencia) o fijar QA gate 1024 px |
| **REV-P1-02** | **KPI «Expira pronto» numérico** — impreciso | Sustituir por **preset/enlace** «Ver próximas a expirar» sin conteo, o chip sin número |
| **REV-P1-03** | **Auto-refresh ON por defecto** — 5× carga periódica | Default **OFF**; timestamp «Actualizado hace…» siempre visible |
| **REV-P1-04** | **Columna «Actividad»** — semántica incorrecta | Renombrar **«Último refresh»** (alineado BE `last_used_at`) |
| **REV-P1-05** | **Contenido Drawer redundante** | Unificar bloque dispositivo; quitar avatar |
| **REV-P1-06** | **Filtro usuario en Fase 3** — tarde para soporte | Mover a **Fase 2** junto con detalle (mismo perfil de uso) |
| **REV-P1-07** | **Fase 1 scope** — tabla + KPI juntos | Split **Fase 1a** (tabla 5-6 cols + relativo) / **Fase 1b** (KPI strip) |

### P2 — Mejoras no bloqueantes

| ID | Observación | Acción |
|----|-------------|--------|
| **REV-P2-01** | `user_agent` siempre visible en detalle | Sección colapsable «Diagnóstico avanzado» |
| **REV-P2-02** | `duration_seconds` en Drawer | Secundario o eliminar |
| **REV-P2-03** | Presets sort + headers sortables | Documentar sincronización de estado UI |
| **REV-P2-04** | Hook KPI dedicado | `useActiveSessionsKpiSummary` — diseño técnico en plan impl |
| **REV-P2-05** | Nota búsqueda sin empresa | Mantener UX-15; añadir en empty state filtrado |

---

## 4. Tabla Mantener / Modificar / Eliminar

| Elemento diseño v1.0 | Decisión | Justificación breve |
|----------------------|----------|---------------------|
| Reducción 10 → 6 columnas (direction) | **Mantener** | Resuelve scroll; base sólida |
| Usuario + empresa en columna 1 | **Mantener** | Multiempresa P0 |
| Columna Cliente condensada | **Mantener** | Elimina redundancia |
| Columna IP + alerta mismatch | **Mantener** | Seguridad visible sin detalle |
| Tiempo relativo + tooltip absoluto | **Mantener** | Patrón enterprise estándar |
| Columnas separadas Actividad + Vigencia | **Modificar** | Fusionar en «Estado» (5 cols) **o** renombrar Actividad |
| `SessionStatusBadge` en grilla | **Mantener** | BE-driven; no ocultar en Drawer solo |
| Revocar en columna Acciones | **Mantener** | Flujo P0 admin |
| Menú ⋯ acciones | **Eliminar** | Sustituir Eye + LogOut |
| Click fila → detalle (única vía) | **Modificar** | Eye obligatorio; fila opcional |
| **Drawer** lateral 400px | **Modificar** | → **Dialog** IAM (`DialogBody`) |
| Avatar en detalle | **Eliminar** | Sin dato API |
| Sección DISPOSITIVO triple | **Modificar** | Bloque único |
| RED login_ip vs last seen | **Mantener** | Valor forense |
| Timestamps absolutos en detalle | **Mantener** | Progressive disclosure correcta |
| `last_business_activity_at` + notas V2 | **Mantener** | Claridad semántica |
| `user_agent` en detalle | **Modificar** | Colapsable avanzado |
| `duration_seconds` | **Modificar** | Opcional / pie de sección |
| KPI total + Web + Mobile | **Mantener** | Valor real; coste bajo |
| KPI Expira pronto (número) | **Eliminar** o **Modificar** | Impreciso; usar preset |
| KPIs clickeables como filtros | **Mantener** | Patrón enterprise válido |
| Copy KPI vs filtros activos | **Modificar** | P0 ambigüedad |
| Búsqueda + tipo cliente | **Mantener** | Params BE |
| Filtro `usuario_id` combobox | **Mantener**; **Modificar** fase → Fase 2 | Alto valor |
| Presets orden | **Mantener** | Sin endpoint extra |
| Auto-refresh ON 60 s default | **Modificar** | → OFF default |
| Eliminar toggle Cards (Fase 4) | **Mantener** | Reduce deuda |
| Filas stacked móvil | **Mantener** | Responsive sin grid cards |
| Paginación ErpPagination 25 default | **Mantener** | Tier C |
| Agrupación visual mismo usuario (Fase 5) | **Mantener** | Nice-to-have |
| 5 requests paralelas KPI+list | **Modificar** | staleTime + hook dedicado |
| Nota limitación búsqueda empresa | **Mantener** | Honestidad BE |
| Plan 5 fases (estructura) | **Modificar** | 1a/1b split; Fase 2 incluye filtro usuario |

---

## 5. Propuesta de columnas revisada (v1.1 sugerida)

Para incorporar **REV-P1-01** y **REV-P1-04** sin perder información visible:

| # | Columna | Contenido | Sort BE |
|---|---------|-----------|---------|
| 1 | **Usuario** | `nombre_usuario` · nombre completo · `empresa_nombre` truncado + `title` · marker sesión actual | `nombre_usuario` |
| 2 | **Cliente** | Icono platform · chip Web/Mobile · `device_label` | `client_type` |
| 3 | **IP** | Last seen IP · ⚠ si mismatch `login_ip` | `ip_address` |
| 4 | **Estado** | L1: «Hace 5 min» (`last_refresh_at`) · L2: «Expira en 2 h» + badge | `last_used_at` / `expires_at` (header dual o sort primario `last_used_at`) |
| 5 | **Acciones** | `Eye` Ver detalle · `LogOut` Revocar | — |

**5 columnas** elimina columna Acciones dedicada al menú; **2 iconos** caben en ~10 % ancho.

---

## 6. Wireframe revisado (fragmento Acciones + KPI)

```
KPI:  [ 247 Totales tenant ] [ 198 Web ] [ 49 Mobile ] [ Ver próximas a expirar → ]
      Actualizado hace 2 min · Auto-refresh OFF                    [↻ Actualizar]

Paginación (filtro Web activo):  Mostrando 1–25 de 49 resultados · 247 en el tenant

| Usuario      | Cliente    | IP         | Estado              | Acciones    |
| juan.perez   | Web·Chrome | 181.49.x.x | Hace 5m / Exp. 2d   | [👁] [⎋]   |
| ACME Colombia|            |            | [Activa]            |             |
```

---

## 7. Plan de fases revisado (delta v1.1)

| Fase original | Ajuste revisión |
|---------------|-----------------|
| **Fase 1** | **1a:** tabla 5 cols + tiempo relativo + rename columnas. **1b:** KPI strip (3 tiles, sin conteo expira pronto) |
| **Fase 2** | Dialog detalle + filtro usuario + IP mismatch + B11 stack |
| **Fase 3** | Presets sort + auto-refresh OFF default + timestamp |
| **Fase 4** | Unificación vista / stacked móvil |
| **Fase 5** | Pulido a11y + agrupación + copiar UA |

---

## 8. Criterios de aceptación revisión (Gate pre-dev)

- [ ] Diseño v1.1 documenta Dialog (no Drawer) y botón Eye obligatorio.
- [ ] Copy KPI vs paginación filtrada especificado.
- [ ] KPI expira pronto sin número engañoso o con disclaimer permanente.
- [ ] Auto-refresh default OFF documentado.
- [ ] Wireframe Acciones = Eye + LogOut (sin ⋯).
- [ ] QA gate incluye **1024 px** además de 1280 px.
- [ ] ConfirmDialog revoke: Dialog detalle cerrado antes (B11-10).

---

## 9. Conclusión final de preparación

| Pregunta | Respuesta |
|----------|-----------|
| ¿Distribución columnas óptima? | **Casi** — preferir **5 columnas** «Estado» fusionada |
| ¿Demasiadas/pocas? | **6 aceptable; 5 preferible** en enterprise denso |
| ¿Info consultada sin Drawer? | **Sí**, con rename «Último refresh» en estado |
| ¿KPIs aportan valor? | **3 sí; expira pronto numérico no** — sustituir |
| ¿Drawer correcto? | **Contenido sí; shell no** — usar Dialog; simplificar secciones |
| ¿Escala a miles? | **Sí**, con paginación y búsqueda |
| ¿Patrones enterprise mejores? | Dialog IAM + iconos fila + KPI global/filtrado explícito |
| ¿Riesgos? | a11y fila, KPI ambiguo, fan-out queries, B11 stack |
| ¿Modificar antes de implementar? | **Sí — v1.1 obligatoria** |

### Dictamen final

# **Requiere Ajustes**

El diseño v1.0 es **fundamentalmente sólido y implementable** tras una revisión documental acotada (**v1.1**, estimada **0.5–1 día** de trabajo de diseño, sin código). Ningún ajuste P0 requiere cambio de Backend u OpenAPI.

**Tras aplicar REV-P0-01…04 y las modificaciones de §4**, el estado pasa a:

# **Aprobado para Implementación** (por fases 1a → 5)

---

## 10. Trazabilidad

| Documento | Relación |
|-----------|----------|
| `FRONTEND_ACTIVE_SESSIONS_ENTERPRISE_UX_DESIGN.md` v1.0 | Objeto revisado |
| `ERP-IAM-SESSIONS-FE-DESIGN-01.md` | Drawer ya marcado V1.1 — revisión confirma Dialog |
| `ERP_FRONTEND_STANDARDS_V2.md` §7.1, §9.1, PB-15 | Normativa IAM vs B-L |
| `UserManagementPage.tsx` | Patrón iconos fila + Dialog IAM |

---

**Fin del documento — READ ONLY. Siguiente paso: emitir `FRONTEND_ACTIVE_SESSIONS_ENTERPRISE_UX_DESIGN.md` v1.1 con delta §4.**
