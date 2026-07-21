# Motor de Códigos — Estándar UX/UI Frontend (ERP)

**Etapa:** Diseño arquitectónico UX — sin implementación  
**Fecha:** 2026-07-12  
**Estado:** **PROPUESTA NORMATIVA** — pendiente aprobación  
**Alcance:** Componente reutilizable `CodigoField` + guía cross-módulo  
**Primer consumidor planificado:** ORG (5 entidades AUTO_DEFAULT)  
**Consumidores futuros:** INV, LOG, COM, POS, HCM, …

---

## 1. Propósito

Definir el **estándar oficial de experiencia de usuario** para cualquier entidad del ERP que utilice el Motor de Códigos Backend, independiente del módulo de negocio.

Este paquete **no diseña ORG**. Diseña la plataforma UX reutilizable que ORG adoptará como referencia certificada.

---

## 2. Principio rector

> **La política Backend (`generation_policy`) gobierna la UX, no al revés.**

El Frontend **no infiere** comportamiento desde si el campo es optional en OpenAPI.  
El Frontend **declara** la policy por entidad y el componente `CodigoField` renderiza el patrón correcto.

| Policy Backend | Significado UX resumido |
|----------------|-------------------------|
| **AUTO_DEFAULT** | Automático por defecto; manual solo bajo demanda explícita |
| **AUTO_REQUIRED** | Siempre automático; usuario **nunca** escribe en CREATE |
| **MANUAL_ONLY** | Siempre manual; textbox obligatorio |
| **EXTERNAL** | **No usar** `CodigoField` — campo externo al motor |

---

## 3. Decisión clave — AUTO_DEFAULT

**No mostrar textbox editable por defecto en CREATE**, aunque Backend acepte código manual.

Patrón adoptado (referencia industria ERP):

| Sistema / patrón | Analogía |
|------------------|----------|
| SAP Business One / ByDesign | Número de documento asignado al contabilizar — usuario no lo elige |
| Odoo / ERPNext | Secuencia automática; override solo modo desarrollador / import |
| NetSuite | Auto-numbering default; override restringido por rol |
| Microsoft Dynamics | Number sequence — entrada manual excepcional |

**AUTO_DEFAULT en CAXIS:** panel informativo + modo automático silencioso; override manual colapsado y gated por rol.

---

## 4. Documentos de este paquete

| # | Documento | Contenido |
|---|-----------|-----------|
| 00 | Este archivo | Resumen, principios, índice |
| 01 | [`01_POLICY_UX_MATRIX.md`](01_POLICY_UX_MATRIX.md) | Matriz visual por policy — responde las 10 preguntas |
| 02 | [`02_CODIGO_FIELD_SPEC.md`](02_CODIGO_FIELD_SPEC.md) | Especificación componente desacoplado |
| 03 | [`03_ERP_CONSISTENCY_GUIDELINES.md`](03_ERP_CONSISTENCY_GUIDELINES.md) | Consistencia cross-módulo, errores, post-201 |
| 04 | [`04_ORG_REFERENCE_ROLLOUT_PLAN.md`](04_ORG_REFERENCE_ROLLOUT_PLAN.md) | Plan conservador — ORG primer consumidor |

---

## 5. Componente oficial propuesto

| Atributo | Valor |
|----------|-------|
| **Nombre** | `CodigoField` |
| **Ubicación** | `src/shared/components/codigo/CodigoField.tsx` |
| **Capa** | Shared / plataforma — **cero imports de features/** |
| **Acoplamiento ORG** | Ninguno — config declarativa por props |
| **Tokens diseño** | Capa 1 (`bg-surface`, `text-text-soft`, semánticos) |

---

## 6. Relación con PR-1 ORG

| Aspecto | PR-1 (congelado) | Este estándar |
|---------|------------------|---------------|
| Payload optional | ✅ Implementado | ✅ Compatible |
| Textbox CREATE visible | Sí (legacy transitorio) | **No** — panel auto |
| Manual override | Input libre | Sección colapsada + rol |
| Post-201 feedback | Pendiente | Norma en §03 |

PR-1 es **compatible técnica** con este estándar. La adopción de `CodigoField` es una **capa UX** posterior, no un cambio de contrato API.

---

## 7. Veredicto de diseño

| Pregunta | Respuesta |
|----------|-----------|
| ¿Textbox siempre visible en AUTO_DEFAULT? | **No** |
| ¿Modo manual disponible? | **Sí**, colapsado + gated |
| ¿Modo volver a automático? | **Sí**, obligatorio si se activó manual |
| ¿Componente reutilizable? | **Sí** — `CodigoField` |
| ¿ORG como referencia? | **Sí** — rollout plan §04 |

---

## 8. Próximo paso

1. Aprobar este paquete normativo.  
2. Implementar `CodigoField` + utilidades (PR-UX-1).  
3. Migrar 5 formularios CREATE ORG como consumidor certificador.  
4. Replicar patrón en INV, LOG, COM, POS, HCM con misma API.

---

*Contrato Backend: `codigo-generation-wave1/frontend-contract/` · Alineación técnica: `frontend-alignment/`*
