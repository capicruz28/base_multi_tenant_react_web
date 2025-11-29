# app/api/v1/endpoints/superadmin_usuarios.py
"""
Módulo de endpoints exclusivos para Superadmin - Gestión de Usuarios.

Este módulo proporciona endpoints para que el Superadmin pueda ver y gestionar
usuarios de todos los clientes con filtrado opcional por cliente_id.

Características principales:
- NO modifica endpoints existentes en usuarios.py
- Solo accesible por Superadmin (nivel 5)
- Filtrado opcional por cliente_id en todos los endpoints
- Incluye información del cliente en respuestas
"""

from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import Optional

# Importar Schemas
from app.schemas.superadmin_usuario import (
    UsuarioSuperadminRead,
    PaginatedUsuarioSuperadminResponse,
    UsuarioActividadResponse,
    UsuarioSesionesResponse
)

# Importar Servicios
from app.services.superadmin_usuario_service import SuperadminUsuarioService

# Importar Excepciones personalizadas
from app.core.exceptions import CustomException

# Importar Dependencias de Autorización
from app.api.deps import get_current_active_user
from app.core.level_authorization import require_super_admin

# Logging
from app.core.logging_config import get_logger

logger = get_logger(__name__)

router = APIRouter()


@router.get(
    "/",
    response_model=PaginatedUsuarioSuperadminResponse,
    summary="Listado global de usuarios (Superadmin)",
    description="""
    Recupera una lista paginada de usuarios de todos los clientes.
    
    **Permisos requeridos:**
    - Nivel de acceso 5 (Super Administrador)
    
    **Parámetros de consulta:**
    - cliente_id (opcional): Filtrar por cliente específico. Si no se proporciona, muestra usuarios de todos los clientes.
    - page: Número de página a mostrar (comienza en 1)
    - limit: Número máximo de usuarios por página (1-100)
    - search: Término opcional para buscar en nombre, apellido, correo o nombre_usuario
    - es_activo: Filtrar por estado activo/inactivo
    - proveedor_autenticacion: Filtrar por método de autenticación
    - ordenar_por: Campo para ordenar (fecha_creacion, fecha_ultimo_acceso, nombre_usuario)
    - orden: 'asc' o 'desc' (default: 'desc')
    
    **Respuestas:**
    - 200: Lista paginada recuperada exitosamente
    - 403: Acceso denegado - se requiere nivel de super administrador
    - 422: Parámetros de consulta inválidos
    - 500: Error interno del servidor
    """
)
@require_super_admin()
async def list_usuarios_global(
    current_user = Depends(get_current_active_user),
    cliente_id: Optional[int] = Query(None, description="Filtrar por cliente específico (opcional)"),
    page: int = Query(1, ge=1, description="Número de página a mostrar"),
    limit: int = Query(20, ge=1, le=100, description="Número de usuarios por página"),
    search: Optional[str] = Query(None, min_length=1, max_length=50, 
                                 description="Término de búsqueda opcional"),
    es_activo: Optional[bool] = Query(None, description="Filtrar por estado activo/inactivo"),
    proveedor_autenticacion: Optional[str] = Query(None, description="Filtrar por método de autenticación"),
    ordenar_por: str = Query("fecha_creacion", description="Campo para ordenar"),
    orden: str = Query("desc", description="Orden: 'asc' o 'desc'")
):
    """
    Endpoint para obtener una lista paginada de usuarios de todos los clientes (Superadmin).
    """
    logger.info(
        f"Superadmin {current_user.usuario_id} solicitando listado global de usuarios - "
        f"cliente_id: {cliente_id}, page: {page}, limit: {limit}"
    )
    
    try:
        paginated_data = await SuperadminUsuarioService.get_usuarios_globales(
            cliente_id=cliente_id,
            page=page,
            limit=limit,
            search=search,
            es_activo=es_activo,
            proveedor_autenticacion=proveedor_autenticacion,
            ordenar_por=ordenar_por,
            orden=orden
        )
        
        logger.info(
            f"Listado global de usuarios recuperado - "
            f"Total: {paginated_data['total_usuarios']}, "
            f"Página: {paginated_data['pagina_actual']}"
        )
        return paginated_data
        
    except CustomException as ce:
        logger.warning(f"Error de negocio al listar usuarios globales: {ce.detail}")
        raise HTTPException(
            status_code=ce.status_code, 
            detail=ce.detail
        )
    except Exception as e:
        logger.exception("Error inesperado en endpoint GET /superadmin/usuarios/")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor al obtener la lista de usuarios."
        )


@router.get(
    "/{usuario_id}/",
    response_model=UsuarioSuperadminRead,
    summary="Obtener detalle de usuario (Superadmin)",
    description="""
    Recupera los detalles completos de un usuario específico (Superadmin puede ver usuarios de cualquier cliente).
    
    **Permisos requeridos:**
    - Nivel de acceso 5 (Super Administrador)
    
    **Parámetros de ruta:**
    - usuario_id: ID numérico del usuario a consultar
    
    **Respuestas:**
    - 200: Usuario encontrado y devuelto
    - 403: Acceso denegado - se requiere nivel de super administrador
    - 404: Usuario no encontrado
    - 500: Error interno del servidor
    """
)
@require_super_admin()
async def read_usuario_superadmin(
    usuario_id: int,
    current_user = Depends(get_current_active_user)
):
    """
    Endpoint para obtener los detalles completos de un usuario específico (Superadmin).
    """
    logger.debug(f"Superadmin {current_user.usuario_id} solicitando usuario ID {usuario_id}")
    
    try:
        usuario = await SuperadminUsuarioService.obtener_usuario_completo(usuario_id)
        
        if usuario is None:
            logger.warning(f"Usuario con ID {usuario_id} no encontrado")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Usuario con ID {usuario_id} no encontrado."
            )

        logger.debug(f"Usuario ID {usuario_id} encontrado: '{usuario['nombre_usuario']}'")
        return usuario
        
    except HTTPException:
        raise
    except CustomException as ce:
        logger.error(f"Error de negocio obteniendo usuario {usuario_id}: {ce.detail}")
        raise HTTPException(
            status_code=ce.status_code, 
            detail=ce.detail
        )
    except Exception as e:
        logger.exception(f"Error inesperado obteniendo usuario {usuario_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor al recuperar el usuario solicitado."
        )


@router.get(
    "/{usuario_id}/actividad/",
    response_model=UsuarioActividadResponse,
    summary="Obtener actividad de usuario (Superadmin)",
    description="""
    Recupera la actividad reciente de un usuario específico.
    
    **Permisos requeridos:**
    - Nivel de acceso 5 (Super Administrador)
    
    **Parámetros de ruta:**
    - usuario_id: ID numérico del usuario
    
    **Parámetros de query:**
    - limite: Número de eventos a retornar (1-200, default: 50)
    - tipo_evento: Filtrar por tipo de evento (opcional)
    
    **Respuestas:**
    - 200: Actividad recuperada exitosamente
    - 403: Acceso denegado
    - 404: Usuario no encontrado
    - 500: Error interno del servidor
    """
)
@require_super_admin()
async def read_usuario_actividad(
    usuario_id: int,
    current_user = Depends(get_current_active_user),
    limite: int = Query(50, ge=1, le=200, description="Número de eventos a retornar"),
    tipo_evento: Optional[str] = Query(None, description="Filtrar por tipo de evento")
):
    """
    Endpoint para obtener la actividad reciente de un usuario.
    """
    logger.debug(f"Superadmin {current_user.usuario_id} solicitando actividad de usuario ID {usuario_id}")
    
    try:
        actividad = await SuperadminUsuarioService.obtener_actividad_usuario(
            usuario_id=usuario_id,
            limite=limite,
            tipo_evento=tipo_evento
        )
        
        logger.debug(f"Actividad del usuario {usuario_id} recuperada - Total eventos: {actividad['total_eventos']}")
        return actividad
        
    except HTTPException:
        raise
    except CustomException as ce:
        logger.error(f"Error de negocio obteniendo actividad de usuario {usuario_id}: {ce.detail}")
        raise HTTPException(
            status_code=ce.status_code, 
            detail=ce.detail
        )
    except Exception as e:
        logger.exception(f"Error inesperado obteniendo actividad de usuario {usuario_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor al obtener la actividad del usuario."
        )


@router.get(
    "/{usuario_id}/sesiones/",
    response_model=UsuarioSesionesResponse,
    summary="Obtener sesiones de usuario (Superadmin)",
    description="""
    Recupera las sesiones activas de un usuario específico.
    
    **Permisos requeridos:**
    - Nivel de acceso 5 (Super Administrador)
    
    **Parámetros de ruta:**
    - usuario_id: ID numérico del usuario
    
    **Parámetros de query:**
    - solo_activas: Si solo mostrar sesiones activas (default: true)
    
    **Respuestas:**
    - 200: Sesiones recuperadas exitosamente
    - 403: Acceso denegado
    - 404: Usuario no encontrado
    - 500: Error interno del servidor
    """
)
@require_super_admin()
async def read_usuario_sesiones(
    usuario_id: int,
    current_user = Depends(get_current_active_user),
    solo_activas: bool = Query(True, description="Solo mostrar sesiones activas")
):
    """
    Endpoint para obtener las sesiones de un usuario.
    """
    logger.debug(f"Superadmin {current_user.usuario_id} solicitando sesiones de usuario ID {usuario_id}")
    
    try:
        sesiones = await SuperadminUsuarioService.obtener_sesiones_usuario(
            usuario_id=usuario_id,
            solo_activas=solo_activas
        )
        
        logger.debug(
            f"Sesiones del usuario {usuario_id} recuperadas - "
            f"Total: {sesiones['total_sesiones']}, "
            f"Activas: {sesiones['sesiones_activas']}"
        )
        return sesiones
        
    except HTTPException:
        raise
    except CustomException as ce:
        logger.error(f"Error de negocio obteniendo sesiones de usuario {usuario_id}: {ce.detail}")
        raise HTTPException(
            status_code=ce.status_code, 
            detail=ce.detail
        )
    except Exception as e:
        logger.exception(f"Error inesperado obteniendo sesiones de usuario {usuario_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor al obtener las sesiones del usuario."
        )


@router.get(
    "/clientes/{cliente_id}/usuarios/",
    response_model=PaginatedUsuarioSuperadminResponse,
    summary="Listar usuarios de un cliente específico (Superadmin)",
    description="""
    Recupera una lista paginada de usuarios de un cliente específico.
    
    **Permisos requeridos:**
    - Nivel de acceso 5 (Super Administrador)
    
    **Parámetros de ruta:**
    - cliente_id: ID del cliente
    
    **Parámetros de consulta:**
    - page: Número de página a mostrar
    - limit: Número máximo de usuarios por página
    - search: Término opcional para buscar
    - es_activo: Filtrar por estado activo/inactivo
    
    **Respuestas:**
    - 200: Lista paginada recuperada exitosamente
    - 403: Acceso denegado
    - 404: Cliente no encontrado
    - 500: Error interno del servidor
    """
)
@require_super_admin()
async def list_usuarios_por_cliente(
    cliente_id: int,
    current_user = Depends(get_current_active_user),
    page: int = Query(1, ge=1, description="Número de página a mostrar"),
    limit: int = Query(20, ge=1, le=100, description="Número de usuarios por página"),
    search: Optional[str] = Query(None, min_length=1, max_length=50, 
                                 description="Término de búsqueda opcional"),
    es_activo: Optional[bool] = Query(None, description="Filtrar por estado activo/inactivo")
):
    """
    Endpoint para obtener una lista paginada de usuarios de un cliente específico.
    """
    logger.info(
        f"Superadmin {current_user.usuario_id} solicitando usuarios del cliente {cliente_id} - "
        f"page: {page}, limit: {limit}"
    )
    
    try:
        paginated_data = await SuperadminUsuarioService.get_usuarios_globales(
            cliente_id=cliente_id,
            page=page,
            limit=limit,
            search=search,
            es_activo=es_activo
        )
        
        logger.info(
            f"Usuarios del cliente {cliente_id} recuperados - "
            f"Total: {paginated_data['total_usuarios']}, "
            f"Página: {paginated_data['pagina_actual']}"
        )
        return paginated_data
        
    except HTTPException:
        raise
    except CustomException as ce:
        logger.warning(f"Error de negocio al listar usuarios del cliente {cliente_id}: {ce.detail}")
        raise HTTPException(
            status_code=ce.status_code, 
            detail=ce.detail
        )
    except Exception as e:
        logger.exception(f"Error inesperado en endpoint GET /superadmin/usuarios/clientes/{cliente_id}/usuarios/")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor al obtener la lista de usuarios."
        )


# app/api/v1/endpoints/superadmin_auditoria.py
"""
Módulo de endpoints exclusivos para Superadmin - Auditoría.

Este módulo proporciona endpoints para que el Superadmin pueda ver logs de auditoría
de todos los clientes con filtrado opcional por cliente_id.

Características principales:
- NO modifica endpoints existentes
- Solo accesible por Superadmin (nivel 5)
- Filtrado opcional por cliente_id en todos los endpoints
- Incluye información de usuario y cliente en respuestas
"""

from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import Optional
from datetime import datetime

# Importar Schemas
from app.schemas.superadmin_auditoria import (
    AuthAuditLogRead,
    PaginatedAuthAuditLogResponse,
    LogSincronizacionRead,
    PaginatedLogSincronizacionResponse,
    AuditoriaEstadisticasResponse
)

# Importar Servicios
from app.services.superadmin_auditoria_service import SuperadminAuditoriaService

# Importar Excepciones personalizadas
from app.core.exceptions import CustomException

# Importar Dependencias de Autorización
from app.api.deps import get_current_active_user
from app.core.level_authorization import require_super_admin

# Logging
from app.core.logging_config import get_logger

logger = get_logger(__name__)

router = APIRouter()


@router.get(
    "/autenticacion/",
    response_model=PaginatedAuthAuditLogResponse,
    summary="Listar logs de autenticación (Superadmin)",
    description="""
    Recupera una lista paginada de logs de autenticación con filtros avanzados.
    
    **Permisos requeridos:**
    - Nivel de acceso 5 (Super Administrador)
    
    **Parámetros de consulta:**
    - cliente_id (opcional): Filtrar por cliente específico. Si no se proporciona, muestra logs de todos los clientes.
    - usuario_id (opcional): Filtrar por usuario específico
    - evento (opcional): Filtrar por tipo de evento (login_success, login_failed, etc.)
    - exito (opcional): Filtrar por éxito/fallo
    - fecha_desde (opcional): Fecha inicial
    - fecha_hasta (opcional): Fecha final
    - ip_address (opcional): Filtrar por IP
    - page: Número de página (default: 1)
    - limit: Registros por página (default: 50, max: 200)
    - ordenar_por: Campo para ordenar (default: fecha_evento)
    - orden: 'asc' o 'desc' (default: 'desc')
    
    **Respuestas:**
    - 200: Lista paginada recuperada exitosamente
    - 403: Acceso denegado
    - 422: Parámetros inválidos
    - 500: Error interno del servidor
    """
)
@require_super_admin()
async def list_logs_autenticacion(
    current_user = Depends(get_current_active_user),
    cliente_id: Optional[int] = Query(None, description="Filtrar por cliente específico (opcional)"),
    usuario_id: Optional[int] = Query(None, description="Filtrar por usuario específico"),
    evento: Optional[str] = Query(None, description="Filtrar por tipo de evento"),
    exito: Optional[bool] = Query(None, description="Filtrar por éxito/fallo"),
    fecha_desde: Optional[datetime] = Query(None, description="Fecha inicial"),
    fecha_hasta: Optional[datetime] = Query(None, description="Fecha final"),
    ip_address: Optional[str] = Query(None, description="Filtrar por IP"),
    page: int = Query(1, ge=1, description="Número de página"),
    limit: int = Query(50, ge=1, le=200, description="Registros por página"),
    ordenar_por: str = Query("fecha_evento", description="Campo para ordenar"),
    orden: str = Query("desc", description="Orden: 'asc' o 'desc'")
):
    """
    Endpoint para obtener logs de autenticación con filtros avanzados.
    """
    logger.info(
        f"Superadmin {current_user.usuario_id} solicitando logs de autenticación - "
        f"cliente_id: {cliente_id}, page: {page}"
    )
    
    try:
        paginated_data = await SuperadminAuditoriaService.get_logs_autenticacion(
            cliente_id=cliente_id,
            usuario_id=usuario_id,
            evento=evento,
            exito=exito,
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta,
            ip_address=ip_address,
            page=page,
            limit=limit,
            ordenar_por=ordenar_por,
            orden=orden
        )
        
        logger.info(
            f"Logs de autenticación recuperados - "
            f"Total: {paginated_data['total_logs']}, "
            f"Página: {paginated_data['pagina_actual']}"
        )
        return paginated_data
        
    except HTTPException:
        raise
    except CustomException as ce:
        logger.warning(f"Error de negocio al listar logs de autenticación: {ce.detail}")
        raise HTTPException(
            status_code=ce.status_code, 
            detail=ce.detail
        )
    except Exception as e:
        logger.exception("Error inesperado en endpoint GET /superadmin/auditoria/autenticacion/")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor al obtener los logs de autenticación."
        )


@router.get(
    "/autenticacion/{log_id}/",
    response_model=AuthAuditLogRead,
    summary="Obtener detalle de log de autenticación (Superadmin)",
    description="""
    Recupera el detalle completo de un log de autenticación específico.
    
    **Permisos requeridos:**
    - Nivel de acceso 5 (Super Administrador)
    
    **Parámetros de ruta:**
    - log_id: ID numérico del log
    
    **Respuestas:**
    - 200: Log encontrado y devuelto
    - 403: Acceso denegado
    - 404: Log no encontrado
    - 500: Error interno del servidor
    """
)
@require_super_admin()
async def read_log_autenticacion(
    log_id: int,
    current_user = Depends(get_current_active_user)
):
    """
    Endpoint para obtener el detalle completo de un log de autenticación.
    """
    logger.debug(f"Superadmin {current_user.usuario_id} solicitando log de autenticación ID {log_id}")
    
    try:
        log = await SuperadminAuditoriaService.obtener_log_autenticacion(log_id)
        
        if log is None:
            logger.warning(f"Log de autenticación con ID {log_id} no encontrado")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Log de autenticación con ID {log_id} no encontrado."
            )

        logger.debug(f"Log de autenticación ID {log_id} encontrado")
        return log
        
    except HTTPException:
        raise
    except CustomException as ce:
        logger.error(f"Error de negocio obteniendo log {log_id}: {ce.detail}")
        raise HTTPException(
            status_code=ce.status_code, 
            detail=ce.detail
        )
    except Exception as e:
        logger.exception(f"Error inesperado obteniendo log {log_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor al recuperar el log solicitado."
        )


@router.get(
    "/sincronizacion/",
    response_model=PaginatedLogSincronizacionResponse,
    summary="Listar logs de sincronización (Superadmin)",
    description="""
    Recupera una lista paginada de logs de sincronización entre instalaciones.
    
    **Permisos requeridos:**
    - Nivel de acceso 5 (Super Administrador)
    
    **Parámetros de consulta:**
    - cliente_origen_id (opcional): Filtrar por cliente origen
    - cliente_destino_id (opcional): Filtrar por cliente destino
    - usuario_id (opcional): Filtrar por usuario sincronizado
    - tipo_sincronizacion (opcional): manual/push_auto/pull_auto/scheduled
    - direccion (opcional): push/pull/bidireccional
    - operacion (opcional): create/update/delete
    - estado (opcional): exitoso/fallido/parcial/pendiente
    - fecha_desde (opcional): Fecha inicial
    - fecha_hasta (opcional): Fecha final
    - page: Número de página (default: 1)
    - limit: Registros por página (default: 50, max: 200)
    - ordenar_por: Campo para ordenar (default: fecha_sincronizacion)
    - orden: 'asc' o 'desc' (default: 'desc')
    
    **Respuestas:**
    - 200: Lista paginada recuperada exitosamente
    - 403: Acceso denegado
    - 422: Parámetros inválidos
    - 500: Error interno del servidor
    """
)
@require_super_admin()
async def list_logs_sincronizacion(
    current_user = Depends(get_current_active_user),
    cliente_origen_id: Optional[int] = Query(None, description="Filtrar por cliente origen"),
    cliente_destino_id: Optional[int] = Query(None, description="Filtrar por cliente destino"),
    usuario_id: Optional[int] = Query(None, description="Filtrar por usuario sincronizado"),
    tipo_sincronizacion: Optional[str] = Query(None, description="Tipo de sincronización"),
    direccion: Optional[str] = Query(None, description="Dirección (push/pull/bidireccional)"),
    operacion: Optional[str] = Query(None, description="Operación (create/update/delete)"),
    estado: Optional[str] = Query(None, description="Estado (exitoso/fallido/parcial/pendiente)"),
    fecha_desde: Optional[datetime] = Query(None, description="Fecha inicial"),
    fecha_hasta: Optional[datetime] = Query(None, description="Fecha final"),
    page: int = Query(1, ge=1, description="Número de página"),
    limit: int = Query(50, ge=1, le=200, description="Registros por página"),
    ordenar_por: str = Query("fecha_sincronizacion", description="Campo para ordenar"),
    orden: str = Query("desc", description="Orden: 'asc' o 'desc'")
):
    """
    Endpoint para obtener logs de sincronización con filtros avanzados.
    """
    logger.info(
        f"Superadmin {current_user.usuario_id} solicitando logs de sincronización - "
        f"page: {page}"
    )
    
    try:
        paginated_data = await SuperadminAuditoriaService.get_logs_sincronizacion(
            cliente_origen_id=cliente_origen_id,
            cliente_destino_id=cliente_destino_id,
            usuario_id=usuario_id,
            tipo_sincronizacion=tipo_sincronizacion,
            direccion=direccion,
            operacion=operacion,
            estado=estado,
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta,
            page=page,
            limit=limit,
            ordenar_por=ordenar_por,
            orden=orden
        )
        
        logger.info(
            f"Logs de sincronización recuperados - "
            f"Total: {paginated_data['total_logs']}, "
            f"Página: {paginated_data['pagina_actual']}"
        )
        return paginated_data
        
    except HTTPException:
        raise
    except CustomException as ce:
        logger.warning(f"Error de negocio al listar logs de sincronización: {ce.detail}")
        raise HTTPException(
            status_code=ce.status_code, 
            detail=ce.detail
        )
    except Exception as e:
        logger.exception("Error inesperado en endpoint GET /superadmin/auditoria/sincronizacion/")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor al obtener los logs de sincronización."
        )


@router.get(
    "/estadisticas/",
    response_model=AuditoriaEstadisticasResponse,
    summary="Obtener estadísticas de auditoría (Superadmin)",
    description="""
    Recupera estadísticas agregadas de auditoría (autenticación y sincronización).
    
    **Permisos requeridos:**
    - Nivel de acceso 5 (Super Administrador)
    
    **Parámetros de consulta:**
    - cliente_id (opcional): Filtrar por cliente específico. Si no se proporciona, muestra estadísticas de todos los clientes.
    - fecha_desde (opcional): Fecha inicial
    - fecha_hasta (opcional): Fecha final
    
    **Respuestas:**
    - 200: Estadísticas recuperadas exitosamente
    - 403: Acceso denegado
    - 422: Parámetros inválidos
    - 500: Error interno del servidor
    """
)
@require_super_admin()
async def get_estadisticas_auditoria(
    current_user = Depends(get_current_active_user),
    cliente_id: Optional[int] = Query(None, description="Filtrar por cliente específico (opcional)"),
    fecha_desde: Optional[datetime] = Query(None, description="Fecha inicial"),
    fecha_hasta: Optional[datetime] = Query(None, description="Fecha final")
):
    """
    Endpoint para obtener estadísticas agregadas de auditoría.
    """
    logger.info(
        f"Superadmin {current_user.usuario_id} solicitando estadísticas de auditoría - "
        f"cliente_id: {cliente_id}"
    )
    
    try:
        estadisticas = await SuperadminAuditoriaService.obtener_estadisticas(
            cliente_id=cliente_id,
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta
        )
        
        logger.info("Estadísticas de auditoría recuperadas exitosamente")
        return estadisticas
        
    except HTTPException:
        raise
    except CustomException as ce:
        logger.warning(f"Error de negocio al obtener estadísticas: {ce.detail}")
        raise HTTPException(
            status_code=ce.status_code, 
            detail=ce.detail
        )
    except Exception as e:
        logger.exception("Error inesperado en endpoint GET /superadmin/auditoria/estadisticas/")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor al obtener las estadísticas de auditoría."
        )


