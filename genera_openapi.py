import json
import requests
from pathlib import Path

# =========================
# CONFIG
# =========================
OPENAPI_URL = "http://platform.app.local:8000/openapi.json"

modulos = {
    "ORG": "/api/v1/org",
    "INV": "/api/v1/inv",
    "PRC": "/api/v1/prc",
    "TAX": "/api/v1/tax",
    "PUR": "/api/v1/pur",
    "SLS": "/api/v1/sls",
    "CRM": "/api/v1/crm",
    "WMS": "/api/v1/wms",
    "QMS": "/api/v1/qms",    
    "MRP": "/api/v1/mrp",
    "MPS": "/api/v1/mps",
    "MFG": "/api/v1/mfg",
    "LOG": "/api/v1/log",
    "MNT": "/api/v1/mnt",
    "HCM": "/api/v1/hcm",
    "POS": "/api/v1/pos",
    "FIN": "/api/v1/fin",
    "BDG": "/api/v1/bdg",
    "CST": "/api/v1/cst",
    "INV_BILL": "/api/v1/inv-bill",
    "PM": "/api/v1/pm",
    "SVC": "/api/v1/svc",
    "TKT": "/api/v1/tkt",
    "DMS": "/api/v1/dms",
    "WFL": "/api/v1/wfl",
    "BI": "/api/v1/bi",
    "AUD": "/api/v1/aud",
    # agrega más módulos aquí
}

output_dir = Path("docs/api")
output_dir.mkdir(parents=True, exist_ok=True)

# =========================
# FUNCIONES
# =========================

def extraer_refs(obj, refs):
    """Busca todos los $ref dentro de un objeto JSON"""
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k == "$ref" and isinstance(v, str):
                refs.add(v.split("/")[-1])
            else:
                extraer_refs(v, refs)
    elif isinstance(obj, list):
        for item in obj:
            extraer_refs(item, refs)


def expandir_refs(schema_name, all_schemas, refs_encontrados):
    """Expande recursivamente dependencias de schemas"""
    if schema_name not in all_schemas:
        return
    
    schema = all_schemas[schema_name]
    nuevos_refs = set()
    
    extraer_refs(schema, nuevos_refs)
    
    for ref in nuevos_refs:
        if ref not in refs_encontrados:
            refs_encontrados.add(ref)
            expandir_refs(ref, all_schemas, refs_encontrados)


# =========================
# DESCARGAR OPENAPI
# =========================
response = requests.get(OPENAPI_URL)
openapi = response.json()

all_schemas = openapi.get("components", {}).get("schemas", {})

# =========================
# PROCESAMIENTO POR MÓDULO
# =========================

for codigo, prefix in modulos.items():

    # 1. Filtrar paths
    paths_filtrados = {
        path: data
        for path, data in openapi["paths"].items()
        if path.startswith(prefix)
    }

    # 2. Extraer refs usados en esos paths
    refs_usados = set()
    extraer_refs(paths_filtrados, refs_usados)

    # 3. Expandir refs (dependencias internas)
    refs_expandidos = set(refs_usados)
    for ref in list(refs_usados):
        expandir_refs(ref, all_schemas, refs_expandidos)

    # 4. Filtrar schemas
    schemas_filtrados = {
        k: v
        for k, v in all_schemas.items()
        if k in refs_expandidos
    }

    # 5. Construir OpenAPI limpio
    modulo_json = {
        "openapi": openapi["openapi"],
        "info": openapi["info"],
        "paths": paths_filtrados,
        "components": {
            "schemas": schemas_filtrados
        }
    }

    # 6. Guardar archivo
    with open(output_dir / f"{codigo}_API.json", "w", encoding="utf-8") as f:
        json.dump(modulo_json, f, ensure_ascii=False, indent=2)

    print(f"{codigo}: {len(paths_filtrados)} paths, {len(schemas_filtrados)} schemas")

print("Listo.")