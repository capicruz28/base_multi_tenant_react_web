# INV Wave 1 — Certificación Frontend (FCE)

**Paquete:** `docs/arquitectura/code-generation/inv-wave1-certification/`  
**Fecha de cierre:** 2026-07-17  
**Módulo:** INV (Inventario)  
**Alcance:** consumo del Frontend Code Generation Engine (FCE)  
**Estado:** **CERTIFICADO**

---

## 1. Dictamen

**INV Frontend queda oficialmente certificado como consumidor del Frontend Code Generation Engine y pasa a ser el Golden Reference ERP para futuros módulos operativos.**

---

## 2. Resumen ejecutivo

El módulo INV completó la adaptación Wave 1 al Motor de Códigos / FCE:

| Familia | Entidades | Policy | Estado |
|---------|-----------|--------|--------|
| Maestros | Categoría, Unidad de Medida, Tipo de Movimiento, Almacén, Producto | AUTO_DEFAULT | Certificado |
| Documentos | Movimiento, Inventario Físico | AUTO_REQUIRED | Certificado |

Referencias de autoridad usadas en esta certificación:

1. `app/docs/arquitectura/code-generation/inv-wave1-frontend-contract/`
2. OpenAPI Snapshot vigente del proyecto
3. ORG como Golden Reference UX AUTO_DEFAULT
4. Baseline V1 del Engine (`docs/arquitectura/code-generation-wave1/frontend-ux/`)

---

## 3. Hallazgos clave

- Infraestructura Fase 0 (`inv/codigo`) operativa y registrada en rutas INV.
- Siete `sequenceKey` canónicos declarados en el manifest.
- CREATE/UPDATE alineados a AUTO_DEFAULT, AUTO_REQUIRED y BR-IMM.
- UX AUTO_DEFAULT alineada a ORG (`allowManualOverride` no forzado).
- Toasts CREATE consumen el identificador del response Backend.
- Servicios no generan correlativos; solo transportan payloads.
- Suite `src/features/inv/codigo/__tests__`: **10 archivos / 53 tests — PASS**.

---

## 4. Documentos del paquete

| Doc | Contenido |
|------|-----------|
| `00_EXECUTIVE_SUMMARY.md` | Este resumen y dictamen |
| `01_ARCHITECTURE_CERTIFICATION.md` | Arquitectura e infraestructura |
| `02_ENGINE_CONSUMPTION_AUDIT.md` | Auditoría de consumo FCE (25 criterios) |
| `03_BACKEND_CONTRACT_ALIGNMENT.md` | Alineación Backend / OpenAPI / contrato INV |
| `04_TEST_CERTIFICATION.md` | Calidad y cobertura de pruebas |
| `05_FINAL_CERTIFICATION.md` | Acta de cierre oficial |

---

## 5. Fuera de alcance de esta certificación

- CFG (siguiente fase del programa)
- Cambios al Engine, ORG, Backend u OpenAPI
- Nuevas entidades o migraciones UX adicionales
- Certificación E2E runtime contra staging (queda como QA operativo)
