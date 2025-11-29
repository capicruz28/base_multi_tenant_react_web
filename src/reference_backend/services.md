# app/services/superadmin_usuario_service.py
"""
Servicio exclusivo para Superadmin - Gestión de Usuarios.

Este servicio proporciona operaciones de Superadmin sobre usuarios,
incluyendo vista global de todos los clientes con filtrado opcional.

Características principales:
- NO modifica servicios existentes en usuario_service.py
- Reutiliza métodos de UsuarioService cuando es posible
- Filtrado opcional por cliente_id
- Incluye información del cliente en respuestas
"""

from datetime import datetime
import math
from typing import Dict, List, Optional, Any
import logging
import json

# Importaciones de base de datos
from app.db.queries import execute_query, execute_auth_query

# Schemas
from app.schemas.superadmin_usuario import (
    UsuarioSuperadminRead,
    PaginatedUsuarioSuperadminResponse,
    ClienteInfo,
    RolInfo,
    UsuarioActividadResponse,
    UsuarioSesionesResponse,
    RefreshTokenInfo
)

# Servicios existentes (reutilizar)
from app.services.usuario_service import UsuarioService
from app.services.cliente_service import ClienteService

# Excepciones
from app.core.exceptions import (
    ValidationError, NotFoundError, ServiceError, DatabaseError
)

# Base Service
from app.services.base_service import BaseService

logger = logging.getLogger(__name__)


class SuperadminUsuarioService(BaseService):
    """
    Servicio para operaciones Superadmin sobre usuarios.
    Permite ver usuarios de todos los clientes con filtrado opcional.
    """

    @staticmethod
    @BaseService.handle_service_errors
    async def get_usuarios_globales(
        cliente_id: Optional[int] = None,
        page: int = 1,
        limit: int = 20,
        search: Optional[str] = None,
        es_activo: Optional[bool] = None,
        proveedor_autenticacion: Optional[str] = None,
        ordenar_por: str = "fecha_creacion",
        orden: str = "desc"
    ) -> Dict:
        """
        Obtiene usuarios globales con filtro opcional por cliente.
        
        Args:
            cliente_id: ID del cliente para filtrar (opcional)
            page: Número de página
            limit: Registros por página
            search: Término de búsqueda
            es_activo: Filtrar por estado activo
            proveedor_autenticacion: Filtrar por método de autenticación
            ordenar_por: Campo para ordenar
            orden: 'asc' o 'desc'
            
        Returns:
            Dict con usuarios paginados y metadatos
        """
        logger.info(f"Obteniendo usuarios globales - cliente_id: {cliente_id}, page: {page}, limit: {limit}")

        # Validar parámetros
        if page < 1:
            raise ValidationError(
                detail="El número de página debe ser mayor o igual a 1.",
                internal_code="INVALID_PAGE_NUMBER"
            )
        if limit < 1 or limit > 100:
            raise ValidationError(
                detail="El límite por página debe estar entre 1 y 100.",
                internal_code="INVALID_LIMIT"
            )

        # Validar cliente_id si se proporciona y obtener información del cliente
        cliente_info = None
        if cliente_id:
            cliente = await ClienteService.obtener_cliente_por_id(cliente_id)
            if not cliente:
                raise NotFoundError(
                    detail=f"Cliente con ID {cliente_id} no encontrado.",
                    internal_code="CLIENT_NOT_FOUND"
                )
            # Construir ClienteInfo desde el cliente obtenido
            cliente_info = ClienteInfo(
                cliente_id=cliente.cliente_id,
                razon_social=cliente.razon_social,
                subdominio=cliente.subdominio,
                codigo_cliente=cliente.codigo_cliente,
                nombre_comercial=cliente.nombre_comercial,
                tipo_instalacion=getattr(cliente, 'tipo_instalacion', 'cloud'),
                estado_suscripcion=getattr(cliente, 'estado_suscripcion', 'activo')
            )

        offset = (page - 1) * limit
        search_param = f"%{search}%" if search else None

        # Construir query base
        where_conditions = ["u.es_eliminado = 0"]
        params = []

        # Filtro por cliente_id
        if cliente_id:
            where_conditions.append("u.cliente_id = ?")
            params.append(cliente_id)

        # Filtro por búsqueda
        if search_param:
            where_conditions.append(
                "(? IS NULL OR u.nombre_usuario LIKE ? OR u.correo LIKE ? "
                "OR u.nombre LIKE ? OR u.apellido LIKE ?)"
            )
            params.extend([search_param, search_param, search_param, search_param, search_param])

        # Filtro por estado activo
        if es_activo is not None:
            where_conditions.append("u.es_activo = ?")
            params.append(1 if es_activo else 0)

        # Filtro por proveedor de autenticación
        if proveedor_autenticacion:
            where_conditions.append("u.proveedor_autenticacion = ?")
            params.append(proveedor_autenticacion)

        where_clause = " AND ".join(where_conditions)

        # Validar ordenar_por
        valid_order_fields = {
            "fecha_creacion": "u.fecha_creacion",
            "fecha_ultimo_acceso": "u.fecha_ultimo_acceso",
            "nombre_usuario": "u.nombre_usuario",
            "nombre": "u.nombre",
            "apellido": "u.apellido"
        }
        order_field = valid_order_fields.get(ordenar_por, "u.fecha_creacion")
        order_dir = "DESC" if orden.lower() == "desc" else "ASC"

        # Query para contar total
        count_query = f"""
        SELECT COUNT(*) as total
        FROM dbo.usuario u
        WHERE {where_clause}
        """
        # Si se filtra por cliente_id, usar la conexión de ese cliente
        count_result = execute_query(count_query, tuple(params), client_id=cliente_id)
        total_usuarios = count_result[0]['total'] if count_result else 0

        # Query para obtener datos (SIN JOIN con cliente, ya que cliente está en BD centralizada)
        data_query = f"""
        SELECT 
            u.usuario_id,
            u.cliente_id,
            u.nombre_usuario,
            u.correo,
            u.nombre,
            u.apellido,
            u.dni,
            u.telefono,
            u.es_activo,
            u.es_eliminado,
            u.proveedor_autenticacion,
            u.referencia_externa_id,
            u.referencia_externa_email,
            u.correo_confirmado,
            u.intentos_fallidos,
            u.fecha_bloqueo,
            u.ultimo_ip,
            u.fecha_creacion,
            u.fecha_ultimo_acceso,
            u.fecha_actualizacion,
            u.sincronizado_desde,
            u.fecha_ultima_sincronizacion
        FROM dbo.usuario u
        WHERE {where_clause}
        ORDER BY {order_field} {order_dir}
        OFFSET ? ROWS
        FETCH NEXT ? ROWS ONLY
        """
        params.extend([offset, limit])
        # Si se filtra por cliente_id, usar la conexión de ese cliente
        usuarios_raw = execute_query(data_query, tuple(params), client_id=cliente_id)

        # Procesar usuarios y obtener roles
        usuarios_procesados = []
        for usuario_row in usuarios_raw:
            # Usar la información del cliente obtenida previamente, o obtenerla si no está disponible
            if not cliente_info and usuario_row.get('cliente_id'):
                # Si no tenemos la info del cliente, obtenerla desde ADMIN
                from app.db.connection import DatabaseConnection
                query_cliente = """
                SELECT cliente_id, razon_social, subdominio, codigo_cliente, 
                       nombre_comercial, tipo_instalacion, estado_suscripcion
                FROM dbo.cliente
                WHERE cliente_id = ?
                """
                cliente_raw = execute_query(query_cliente, (usuario_row['cliente_id'],), connection_type=DatabaseConnection.ADMIN)
                if cliente_raw:
                    cliente_row = cliente_raw[0]
                    cliente_info = ClienteInfo(
                        cliente_id=cliente_row['cliente_id'],
                        razon_social=cliente_row['razon_social'],
                        subdominio=cliente_row['subdominio'],
                        codigo_cliente=cliente_row.get('codigo_cliente'),
                        nombre_comercial=cliente_row.get('nombre_comercial'),
                        tipo_instalacion=cliente_row.get('tipo_instalacion', 'cloud'),
                        estado_suscripcion=cliente_row.get('estado_suscripcion', 'activo')
                    )
            
            # Si aún no tenemos cliente_info, crear uno básico
            if not cliente_info:
                cliente_info = ClienteInfo(
                    cliente_id=usuario_row.get('cliente_id', 0),
                    razon_social="N/A",
                    subdominio="N/A",
                    codigo_cliente=None,
                    nombre_comercial=None,
                    tipo_instalacion='cloud',
                    estado_suscripcion='activo'
                )

            # Obtener roles del usuario
            roles = await SuperadminUsuarioService._obtener_roles_usuario(
                usuario_row['usuario_id'],
                usuario_row['cliente_id']
            )

            # Obtener niveles de acceso
            level_info = await UsuarioService.get_user_level_info(
                usuario_row['usuario_id'],
                usuario_row['cliente_id']
            )

            # Construir usuario completo
            usuario = UsuarioSuperadminRead(
                usuario_id=usuario_row['usuario_id'],
                cliente_id=usuario_row['cliente_id'],
                cliente=cliente_info,
                nombre_usuario=usuario_row['nombre_usuario'],
                correo=usuario_row.get('correo'),
                nombre=usuario_row.get('nombre'),
                apellido=usuario_row.get('apellido'),
                dni=usuario_row.get('dni'),
                telefono=usuario_row.get('telefono'),
                es_activo=bool(usuario_row['es_activo']),
                es_eliminado=bool(usuario_row.get('es_eliminado', False)),
                proveedor_autenticacion=usuario_row.get('proveedor_autenticacion', 'local'),
                referencia_externa_id=usuario_row.get('referencia_externa_id'),
                referencia_externa_email=usuario_row.get('referencia_externa_email'),
                correo_confirmado=bool(usuario_row.get('correo_confirmado', False)),
                intentos_fallidos=usuario_row.get('intentos_fallidos', 0),
                fecha_bloqueo=usuario_row.get('fecha_bloqueo'),
                ultimo_ip=usuario_row.get('ultimo_ip'),
                fecha_creacion=usuario_row['fecha_creacion'],
                fecha_ultimo_acceso=usuario_row.get('fecha_ultimo_acceso'),
                fecha_actualizacion=usuario_row.get('fecha_actualizacion'),
                sincronizado_desde=usuario_row.get('sincronizado_desde'),
                fecha_ultima_sincronizacion=usuario_row.get('fecha_ultima_sincronizacion'),
                roles=roles,
                access_level=level_info.get('access_level', 1),
                is_super_admin=level_info.get('is_super_admin', False),
                user_type=level_info.get('user_type', 'user')
            )
            usuarios_procesados.append(usuario)

        total_paginas = math.ceil(total_usuarios / limit) if limit > 0 else 0

        return {
            "usuarios": [u.model_dump() for u in usuarios_procesados],
            "total_usuarios": total_usuarios,
            "pagina_actual": page,
            "total_paginas": total_paginas
        }

    @staticmethod
    async def _obtener_roles_usuario(usuario_id: int, cliente_id: int) -> List[RolInfo]:
        """Obtiene roles activos de un usuario."""
        try:
            query = """
            SELECT 
                r.rol_id,
                r.nombre,
                r.codigo_rol,
                r.nivel_acceso,
                r.es_rol_sistema,
                ur.fecha_asignacion,
                ur.es_activo
            FROM dbo.rol r
            INNER JOIN dbo.usuario_rol ur ON r.rol_id = ur.rol_id
            WHERE ur.usuario_id = ? 
              AND ur.cliente_id = ?
              AND ur.es_activo = 1 
              AND r.es_activo = 1
            ORDER BY r.nombre
            """
            # Usar la conexión del cliente del usuario
            roles_raw = execute_query(query, (usuario_id, cliente_id), client_id=cliente_id)
            
            roles = []
            for rol_row in roles_raw:
                rol = RolInfo(
                    rol_id=rol_row['rol_id'],
                    nombre=rol_row['nombre'],
                    codigo_rol=rol_row.get('codigo_rol'),
                    nivel_acceso=rol_row.get('nivel_acceso', 1),
                    es_rol_sistema=bool(rol_row.get('es_rol_sistema', False)),
                    fecha_asignacion=rol_row.get('fecha_asignacion'),
                    es_activo=True
                )
                roles.append(rol)
            
            return roles
        except Exception as e:
            logger.error(f"Error obteniendo roles para usuario {usuario_id}: {e}")
            return []

    @staticmethod
    @BaseService.handle_service_errors
    async def obtener_usuario_completo(usuario_id: int) -> Optional[Dict]:
        """
        Obtiene información completa de un usuario (Superadmin puede ver cualquier usuario).
        """
        logger.info(f"Obteniendo usuario completo ID {usuario_id} (Superadmin)")

        # Primero obtener el cliente_id del usuario desde la BD centralizada (ADMIN)
        # para saber qué conexión usar
        from app.db.connection import DatabaseConnection
        query_cliente = """
        SELECT cliente_id
        FROM dbo.usuario
        WHERE usuario_id = ? AND es_eliminado = 0
        """
        cliente_info_raw = execute_query(query_cliente, (usuario_id,), connection_type=DatabaseConnection.ADMIN)
        
        if not cliente_info_raw:
            return None
        
        usuario_cliente_id = cliente_info_raw[0]['cliente_id']
        
        # Obtener usuario básico usando la conexión del cliente (SIN JOIN con cliente)
        query = """
        SELECT 
            u.*
        FROM dbo.usuario u
        WHERE u.usuario_id = ? AND u.es_eliminado = 0
        """
        usuario_raw = execute_query(query, (usuario_id,), client_id=usuario_cliente_id)
        
        if not usuario_raw:
            return None
        
        usuario_row = usuario_raw[0]
        
        # Obtener información del cliente desde BD centralizada (ADMIN)
        from app.db.connection import DatabaseConnection
        query_cliente = """
        SELECT cliente_id, razon_social, subdominio, codigo_cliente, 
               nombre_comercial, tipo_instalacion, estado_suscripcion
        FROM dbo.cliente
        WHERE cliente_id = ?
        """
        cliente_raw = execute_query(query_cliente, (usuario_cliente_id,), connection_type=DatabaseConnection.ADMIN)
        
        if not cliente_raw:
            return None
        
        cliente_row = cliente_raw[0]

        # Información del cliente
        cliente_info = ClienteInfo(
            cliente_id=cliente_row['cliente_id'],
            razon_social=cliente_row['razon_social'],
            subdominio=cliente_row['subdominio'],
            codigo_cliente=cliente_row.get('codigo_cliente'),
            nombre_comercial=cliente_row.get('nombre_comercial'),
            tipo_instalacion=cliente_row.get('tipo_instalacion', 'cloud'),
            estado_suscripcion=cliente_row.get('estado_suscripcion', 'activo')
        )

        # Obtener roles
        roles = await SuperadminUsuarioService._obtener_roles_usuario(
            usuario_id,
            usuario_row['cliente_id']
        )

        # Obtener niveles de acceso
        level_info = await UsuarioService.get_user_level_info(
            usuario_id,
            usuario_row['cliente_id']
        )

        # Construir respuesta
        usuario = UsuarioSuperadminRead(
            usuario_id=usuario_row['usuario_id'],
            cliente_id=usuario_row['cliente_id'],
            cliente=cliente_info,
            nombre_usuario=usuario_row['nombre_usuario'],
            correo=usuario_row.get('correo'),
            nombre=usuario_row.get('nombre'),
            apellido=usuario_row.get('apellido'),
            dni=usuario_row.get('dni'),
            telefono=usuario_row.get('telefono'),
            es_activo=bool(usuario_row['es_activo']),
            es_eliminado=bool(usuario_row.get('es_eliminado', False)),
            proveedor_autenticacion=usuario_row.get('proveedor_autenticacion', 'local'),
            referencia_externa_id=usuario_row.get('referencia_externa_id'),
            referencia_externa_email=usuario_row.get('referencia_externa_email'),
            correo_confirmado=bool(usuario_row.get('correo_confirmado', False)),
            intentos_fallidos=usuario_row.get('intentos_fallidos', 0),
            fecha_bloqueo=usuario_row.get('fecha_bloqueo'),
            ultimo_ip=usuario_row.get('ultimo_ip'),
            fecha_creacion=usuario_row['fecha_creacion'],
            fecha_ultimo_acceso=usuario_row.get('fecha_ultimo_acceso'),
            fecha_actualizacion=usuario_row.get('fecha_actualizacion'),
            sincronizado_desde=usuario_row.get('sincronizado_desde'),
            fecha_ultima_sincronizacion=usuario_row.get('fecha_ultima_sincronizacion'),
            roles=roles,
            access_level=level_info.get('access_level', 1),
            is_super_admin=level_info.get('is_super_admin', False),
            user_type=level_info.get('user_type', 'user')
        )

        return usuario.model_dump()

    @staticmethod
    @BaseService.handle_service_errors
    async def obtener_actividad_usuario(
        usuario_id: int,
        limite: int = 50,
        tipo_evento: Optional[str] = None
    ) -> Dict:
        """
        Obtiene actividad reciente de un usuario.
        """
        logger.info(f"Obteniendo actividad para usuario {usuario_id}")

        # Validar límite
        if limite < 1 or limite > 200:
            raise ValidationError(
                detail="El límite debe estar entre 1 y 200.",
                internal_code="INVALID_LIMIT"
            )

        # Primero obtener el cliente_id del usuario desde la BD centralizada (ADMIN)
        from app.db.connection import DatabaseConnection
        query_cliente = """
        SELECT cliente_id
        FROM dbo.usuario
        WHERE usuario_id = ? AND es_eliminado = 0
        """
        cliente_info_raw = execute_query(query_cliente, (usuario_id,), connection_type=DatabaseConnection.ADMIN)
        
        if not cliente_info_raw:
            raise NotFoundError(
                detail=f"Usuario con ID {usuario_id} no encontrado.",
                internal_code="USER_NOT_FOUND"
            )
        
        usuario_cliente_id = cliente_info_raw[0]['cliente_id']
        
        # Obtener información básica del usuario usando la conexión del cliente
        query_usuario = """
        SELECT 
            usuario_id, cliente_id, nombre_usuario, correo, nombre, apellido,
            dni, telefono, proveedor_autenticacion, es_activo, correo_confirmado,
            fecha_creacion, fecha_ultimo_acceso, fecha_actualizacion, ultimo_ip,
            sincronizado_desde, fecha_ultima_sincronizacion, es_eliminado,
            intentos_fallidos, fecha_bloqueo, referencia_externa_id, referencia_externa_email
        FROM dbo.usuario
        WHERE usuario_id = ? AND es_eliminado = 0
        """
        usuario_raw = execute_query(query_usuario, (usuario_id,), client_id=usuario_cliente_id)
        
        if not usuario_raw:
            raise NotFoundError(
                detail=f"Usuario con ID {usuario_id} no encontrado.",
                internal_code="USER_NOT_FOUND"
            )
        
        usuario = usuario_raw[0]

        # Construir query para eventos
        where_conditions = ["a.usuario_id = ?"]
        params = [usuario_id]

        if tipo_evento:
            where_conditions.append("a.evento = ?")
            params.append(tipo_evento)

        where_clause = " AND ".join(where_conditions)

        query = f"""
        SELECT TOP (?)
            a.log_id,
            a.fecha_evento,
            a.evento,
            a.exito,
            a.ip_address,
            a.user_agent,
            a.device_info,
            a.descripcion,
            a.codigo_error,
            a.metadata_json
        FROM dbo.auth_audit_log a
        WHERE {where_clause}
        ORDER BY a.fecha_evento DESC
        """
        params.append(limite)

        # Usar la conexión del cliente del usuario
        eventos_raw = execute_query(query, tuple(params), client_id=usuario_cliente_id)

        eventos = []
        for evento_row in eventos_raw:
            metadata = None
            if evento_row.get('metadata_json'):
                try:
                    metadata = json.loads(evento_row['metadata_json'])
                except:
                    pass

            eventos.append({
                "log_id": evento_row['log_id'],
                "fecha_evento": evento_row['fecha_evento'].isoformat() if evento_row['fecha_evento'] else None,
                "evento": evento_row['evento'],
                "exito": bool(evento_row['exito']),
                "ip_address": evento_row.get('ip_address'),
                "user_agent": evento_row.get('user_agent'),
                "device_info": evento_row.get('device_info'),
                "descripcion": evento_row.get('descripcion'),
                "codigo_error": evento_row.get('codigo_error'),
                "metadata": metadata
            })

        # Contar total
        count_query = f"""
        SELECT COUNT(*) as total
        FROM dbo.auth_audit_log a
        WHERE {where_clause}
        """
        # Usar la conexión del cliente del usuario
        count_result = execute_query(count_query, tuple(params[:-1]), client_id=usuario_cliente_id)  # Excluir límite
        total_eventos = count_result[0]['total'] if count_result else 0

        return {
            "usuario_id": usuario_id,
            "ultimo_acceso": usuario.get('fecha_ultimo_acceso'),
            "ultimo_ip": usuario.get('ultimo_ip'),
            "total_eventos": total_eventos,
            "eventos": eventos
        }

    @staticmethod
    @BaseService.handle_service_errors
    async def obtener_sesiones_usuario(
        usuario_id: int,
        solo_activas: bool = True
    ) -> Dict:
        """
        Obtiene sesiones (tokens refresh) de un usuario.
        """
        logger.info(f"Obteniendo sesiones para usuario {usuario_id}")

        # Primero obtener el cliente_id del usuario desde la BD centralizada (ADMIN)
        from app.db.connection import DatabaseConnection
        query_cliente = """
        SELECT cliente_id
        FROM dbo.usuario
        WHERE usuario_id = ? AND es_eliminado = 0
        """
        cliente_info_raw = execute_query(query_cliente, (usuario_id,), connection_type=DatabaseConnection.ADMIN)
        
        if not cliente_info_raw:
            raise NotFoundError(
                detail=f"Usuario con ID {usuario_id} no encontrado.",
                internal_code="USER_NOT_FOUND"
            )
        
        usuario_cliente_id = cliente_info_raw[0]['cliente_id']
        
        # Validar que usuario existe usando la conexión del cliente
        query_usuario = """
        SELECT usuario_id, cliente_id
        FROM dbo.usuario
        WHERE usuario_id = ? AND es_eliminado = 0
        """
        usuario_raw = execute_query(query_usuario, (usuario_id,), client_id=usuario_cliente_id)
        
        if not usuario_raw:
            raise NotFoundError(
                detail=f"Usuario con ID {usuario_id} no encontrado.",
                internal_code="USER_NOT_FOUND"
            )

        # Construir query
        where_conditions = ["rt.usuario_id = ?"]
        params = [usuario_id]

        if solo_activas:
            where_conditions.append("rt.is_revoked = 0")
            where_conditions.append("rt.expires_at > GETDATE()")

        where_clause = " AND ".join(where_conditions)

        query = f"""
        SELECT 
            rt.token_id,
            rt.client_type,
            rt.device_name,
            rt.device_id,
            rt.ip_address,
            rt.user_agent,
            rt.created_at,
            rt.expires_at,
            rt.is_revoked,
            rt.last_used_at,
            rt.uso_count,
            rt.revoked_at,
            rt.revoked_reason
        FROM dbo.refresh_tokens rt
        WHERE {where_clause}
        ORDER BY rt.created_at DESC
        """
        # Usar la conexión del cliente del usuario
        sesiones_raw = execute_query(query, tuple(params), client_id=usuario_cliente_id)

        sesiones = []
        sesiones_activas = 0
        for sesion_row in sesiones_raw:
            is_active = not sesion_row['is_revoked'] and sesion_row['expires_at'] > datetime.now()
            if is_active:
                sesiones_activas += 1

            sesion = RefreshTokenInfo(
                token_id=sesion_row['token_id'],
                client_type=sesion_row['client_type'],
                device_name=sesion_row.get('device_name'),
                device_id=sesion_row.get('device_id'),
                ip_address=sesion_row.get('ip_address'),
                user_agent=sesion_row.get('user_agent'),
                created_at=sesion_row['created_at'],
                expires_at=sesion_row['expires_at'],
                is_revoked=bool(sesion_row['is_revoked']),
                last_used_at=sesion_row.get('last_used_at'),
                uso_count=sesion_row.get('uso_count', 0),
                revoked_at=sesion_row.get('revoked_at'),
                revoked_reason=sesion_row.get('revoked_reason')
            )
            sesiones.append(sesion)

        return {
            "usuario_id": usuario_id,
            "total_sesiones": len(sesiones),
            "sesiones_activas": sesiones_activas,
            "sesiones": [s.model_dump() for s in sesiones]
        }

# app/services/superadmin_auditoria_service.py
"""
Servicio exclusivo para Superadmin - Auditoría.

Este servicio proporciona operaciones de Superadmin sobre auditoría,
incluyendo logs de autenticación y sincronización con filtrado opcional por cliente.

Características principales:
- NO modifica servicios existentes
- Filtrado opcional por cliente_id
- Incluye información de usuario y cliente en respuestas
"""

from datetime import datetime
import math
import json
from typing import Dict, List, Optional, Any
import logging

# Importaciones de base de datos
from app.db.queries import execute_query

# Schemas
from app.schemas.superadmin_auditoria import (
    AuthAuditLogRead,
    PaginatedAuthAuditLogResponse,
    LogSincronizacionRead,
    PaginatedLogSincronizacionResponse,
    AuditoriaEstadisticasResponse,
    PeriodoInfo,
    AutenticacionStats,
    SincronizacionStats,
    IPStats,
    UsuarioStats,
    ClienteInfo,
    UsuarioInfo
)

# Servicios existentes (reutilizar)
from app.services.cliente_service import ClienteService

# Excepciones
from app.core.exceptions import (
    ValidationError, NotFoundError, ServiceError, DatabaseError
)

# Base Service
from app.services.base_service import BaseService

logger = logging.getLogger(__name__)


class SuperadminAuditoriaService(BaseService):
    """
    Servicio para operaciones Superadmin sobre auditoría.
    Permite ver logs de todos los clientes con filtrado opcional.
    """

    @staticmethod
    @BaseService.handle_service_errors
    async def get_logs_autenticacion(
        cliente_id: Optional[int] = None,
        usuario_id: Optional[int] = None,
        evento: Optional[str] = None,
        exito: Optional[bool] = None,
        fecha_desde: Optional[datetime] = None,
        fecha_hasta: Optional[datetime] = None,
        ip_address: Optional[str] = None,
        page: int = 1,
        limit: int = 50,
        ordenar_por: str = "fecha_evento",
        orden: str = "desc"
    ) -> Dict:
        """
        Obtiene logs de autenticación con filtros avanzados.
        """
        logger.info(f"Obteniendo logs de autenticación - cliente_id: {cliente_id}, page: {page}")

        # Validar parámetros
        if page < 1:
            raise ValidationError(
                detail="El número de página debe ser mayor o igual a 1.",
                internal_code="INVALID_PAGE_NUMBER"
            )
        if limit < 1 or limit > 200:
            raise ValidationError(
                detail="El límite por página debe estar entre 1 y 200.",
                internal_code="INVALID_LIMIT"
            )
        if fecha_desde and fecha_hasta and fecha_desde > fecha_hasta:
            raise ValidationError(
                detail="fecha_desde debe ser anterior a fecha_hasta.",
                internal_code="INVALID_DATE_RANGE"
            )

        # Validar cliente_id si se proporciona y obtener información del cliente
        cliente_info_cache: Optional[ClienteInfo] = None
        if cliente_id:
            cliente = await ClienteService.obtener_cliente_por_id(cliente_id)
            if not cliente:
                raise NotFoundError(
                    detail=f"Cliente con ID {cliente_id} no encontrado.",
                    internal_code="CLIENT_NOT_FOUND"
                )
            # Cachear información del cliente
            cliente_info_cache = ClienteInfo(
                cliente_id=cliente.cliente_id,
                razon_social=cliente.razon_social,
                subdominio=cliente.subdominio,
                codigo_cliente=cliente.codigo_cliente,
                nombre_comercial=cliente.nombre_comercial,
                tipo_instalacion=getattr(cliente, 'tipo_instalacion', 'cloud'),
                estado_suscripcion=getattr(cliente, 'estado_suscripcion', 'activo')
            )

        offset = (page - 1) * limit

        # Construir condiciones WHERE
        where_conditions = []
        params = []

        if cliente_id:
            where_conditions.append("a.cliente_id = ?")
            params.append(cliente_id)

        if usuario_id:
            where_conditions.append("a.usuario_id = ?")
            params.append(usuario_id)

        if evento:
            where_conditions.append("a.evento = ?")
            params.append(evento)

        if exito is not None:
            where_conditions.append("a.exito = ?")
            params.append(1 if exito else 0)

        if fecha_desde:
            where_conditions.append("a.fecha_evento >= ?")
            params.append(fecha_desde)

        if fecha_hasta:
            where_conditions.append("a.fecha_evento <= ?")
            params.append(fecha_hasta)

        if ip_address:
            where_conditions.append("a.ip_address = ?")
            params.append(ip_address)

        where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"

        # Validar ordenar_por
        valid_order_fields = {
            "fecha_evento": "a.fecha_evento",
            "evento": "a.evento",
            "usuario_id": "a.usuario_id"
        }
        order_field = valid_order_fields.get(ordenar_por, "a.fecha_evento")
        order_dir = "DESC" if orden.lower() == "desc" else "ASC"

        # Query para contar total
        count_query = f"""
        SELECT COUNT(*) as total
        FROM dbo.auth_audit_log a
        WHERE {where_clause}
        """
        # Si se filtra por cliente_id, usar la conexión de ese cliente
        count_result = execute_query(count_query, tuple(params), client_id=cliente_id)
        total_logs = count_result[0]['total'] if count_result else 0

        # Query para obtener datos (SIN JOIN con cliente, ya que cliente está en BD centralizada)
        data_query = f"""
        SELECT 
            a.log_id,
            a.cliente_id,
            a.usuario_id,
            a.evento,
            a.nombre_usuario_intento,
            a.descripcion,
            a.exito,
            a.codigo_error,
            a.ip_address,
            a.user_agent,
            a.device_info,
            a.geolocation,
            a.metadata_json,
            a.fecha_evento,
            u.nombre_usuario,
            u.correo
        FROM dbo.auth_audit_log a
        LEFT JOIN dbo.usuario u ON a.usuario_id = u.usuario_id
        WHERE {where_clause}
        ORDER BY {order_field} {order_dir}
        OFFSET ? ROWS
        FETCH NEXT ? ROWS ONLY
        """
        params.extend([offset, limit])
        # Si se filtra por cliente_id, usar la conexión de ese cliente
        logs_raw = execute_query(data_query, tuple(params), client_id=cliente_id)

        # Procesar logs
        logs = []
        for log_row in logs_raw:
            # Información del cliente (usar cache si está disponible, sino obtener desde ADMIN)
            cliente_info = None
            if log_row.get('cliente_id'):
                if cliente_info_cache and cliente_info_cache.cliente_id == log_row['cliente_id']:
                    cliente_info = cliente_info_cache
                else:
                    # Obtener desde BD centralizada (ADMIN)
                    from app.db.connection import DatabaseConnection
                    query_cliente = """
                    SELECT cliente_id, razon_social, subdominio, codigo_cliente, 
                           nombre_comercial, tipo_instalacion, estado_suscripcion
                    FROM dbo.cliente
                    WHERE cliente_id = ?
                    """
                    cliente_raw = execute_query(query_cliente, (log_row['cliente_id'],), connection_type=DatabaseConnection.ADMIN)
                    if cliente_raw:
                        cliente_row = cliente_raw[0]
                        cliente_info = ClienteInfo(
                            cliente_id=cliente_row['cliente_id'],
                            razon_social=cliente_row['razon_social'],
                            subdominio=cliente_row['subdominio'],
                            codigo_cliente=cliente_row.get('codigo_cliente'),
                            nombre_comercial=cliente_row.get('nombre_comercial'),
                            tipo_instalacion=cliente_row.get('tipo_instalacion', 'cloud'),
                            estado_suscripcion=cliente_row.get('estado_suscripcion', 'activo')
                        )

            # Información del usuario
            usuario_info = None
            if log_row.get('usuario_id'):
                usuario_info = UsuarioInfo(
                    usuario_id=log_row['usuario_id'],
                    nombre_usuario=log_row.get('nombre_usuario', ''),
                    correo=log_row.get('correo')
                )

            # Parsear metadata_json
            metadata = None
            if log_row.get('metadata_json'):
                try:
                    metadata = json.loads(log_row['metadata_json'])
                except:
                    pass

            log = AuthAuditLogRead(
                log_id=log_row['log_id'],
                cliente_id=log_row['cliente_id'],
                cliente=cliente_info,
                usuario_id=log_row.get('usuario_id'),
                usuario=usuario_info,
                evento=log_row['evento'],
                nombre_usuario_intento=log_row.get('nombre_usuario_intento'),
                descripcion=log_row.get('descripcion'),
                exito=bool(log_row['exito']),
                codigo_error=log_row.get('codigo_error'),
                ip_address=log_row.get('ip_address'),
                user_agent=log_row.get('user_agent'),
                device_info=log_row.get('device_info'),
                geolocation=log_row.get('geolocation'),
                metadata_json=metadata,
                fecha_evento=log_row['fecha_evento']
            )
            logs.append(log)

        total_paginas = math.ceil(total_logs / limit) if limit > 0 else 0

        return {
            "logs": [l.model_dump() for l in logs],
            "total_logs": total_logs,
            "pagina_actual": page,
            "total_paginas": total_paginas
        }

    @staticmethod
    @BaseService.handle_service_errors
    async def obtener_log_autenticacion(log_id: int) -> Optional[Dict]:
        """
        Obtiene detalle completo de un log de autenticación.
        """
        logger.info(f"Obteniendo log de autenticación ID {log_id}")

        query = """
        SELECT 
            a.*,
            c.razon_social as cliente_razon_social,
            c.subdominio as cliente_subdominio,
            c.codigo_cliente,
            c.nombre_comercial,
            c.tipo_instalacion,
            c.estado_suscripcion,
            u.nombre_usuario,
            u.correo
        FROM dbo.auth_audit_log a
        LEFT JOIN dbo.cliente c ON a.cliente_id = c.cliente_id
        LEFT JOIN dbo.usuario u ON a.usuario_id = u.usuario_id
        WHERE a.log_id = ?
        """
        # Primero obtener el cliente_id del log desde la BD centralizada (ADMIN)
        from app.db.connection import DatabaseConnection
        query_cliente = """
        SELECT cliente_id
        FROM dbo.auth_audit_log
        WHERE log_id = ?
        """
        cliente_info_raw = execute_query(query_cliente, (log_id,), connection_type=DatabaseConnection.ADMIN)
        
        if not cliente_info_raw:
            raise NotFoundError(
                detail=f"Log de autenticación con ID {log_id} no encontrado.",
                internal_code="LOG_NOT_FOUND"
            )
        
        log_cliente_id = cliente_info_raw[0]['cliente_id']
        
        # Obtener el log usando la conexión del cliente
        log_raw = execute_query(query, (log_id,), client_id=log_cliente_id)

        if not log_raw:
            return None

        log_row = log_raw[0]

        # Información del cliente
        cliente_info = None
        if log_row.get('cliente_id'):
            cliente_info = ClienteInfo(
                cliente_id=log_row['cliente_id'],
                razon_social=log_row.get('cliente_razon_social', ''),
                subdominio=log_row.get('cliente_subdominio', ''),
                codigo_cliente=log_row.get('codigo_cliente'),
                nombre_comercial=log_row.get('nombre_comercial'),
                tipo_instalacion=log_row.get('tipo_instalacion', 'cloud'),
                estado_suscripcion=log_row.get('estado_suscripcion', 'activo')
            )

        # Información del usuario
        usuario_info = None
        if log_row.get('usuario_id'):
            usuario_info = UsuarioInfo(
                usuario_id=log_row['usuario_id'],
                nombre_usuario=log_row.get('nombre_usuario', ''),
                correo=log_row.get('correo')
            )

        # Parsear metadata_json
        metadata = None
        if log_row.get('metadata_json'):
            try:
                metadata = json.loads(log_row['metadata_json'])
            except:
                pass

        log = AuthAuditLogRead(
            log_id=log_row['log_id'],
            cliente_id=log_row['cliente_id'],
            cliente=cliente_info,
            usuario_id=log_row.get('usuario_id'),
            usuario=usuario_info,
            evento=log_row['evento'],
            nombre_usuario_intento=log_row.get('nombre_usuario_intento'),
            descripcion=log_row.get('descripcion'),
            exito=bool(log_row['exito']),
            codigo_error=log_row.get('codigo_error'),
            ip_address=log_row.get('ip_address'),
            user_agent=log_row.get('user_agent'),
            device_info=log_row.get('device_info'),
            geolocation=log_row.get('geolocation'),
            metadata_json=metadata,
            fecha_evento=log_row['fecha_evento']
        )

        return log.model_dump()

    @staticmethod
    @BaseService.handle_service_errors
    async def get_logs_sincronizacion(
        cliente_origen_id: Optional[int] = None,
        cliente_destino_id: Optional[int] = None,
        usuario_id: Optional[int] = None,
        tipo_sincronizacion: Optional[str] = None,
        direccion: Optional[str] = None,
        operacion: Optional[str] = None,
        estado: Optional[str] = None,
        fecha_desde: Optional[datetime] = None,
        fecha_hasta: Optional[datetime] = None,
        page: int = 1,
        limit: int = 50,
        ordenar_por: str = "fecha_sincronizacion",
        orden: str = "desc"
    ) -> Dict:
        """
        Obtiene logs de sincronización con filtros avanzados.
        """
        logger.info(f"Obteniendo logs de sincronización - page: {page}")

        # Validar parámetros
        if page < 1:
            raise ValidationError(
                detail="El número de página debe ser mayor o igual a 1.",
                internal_code="INVALID_PAGE_NUMBER"
            )
        if limit < 1 or limit > 200:
            raise ValidationError(
                detail="El límite por página debe estar entre 1 y 200.",
                internal_code="INVALID_LIMIT"
            )
        if fecha_desde and fecha_hasta and fecha_desde > fecha_hasta:
            raise ValidationError(
                detail="fecha_desde debe ser anterior a fecha_hasta.",
                internal_code="INVALID_DATE_RANGE"
            )

        # Validar clientes si se proporcionan
        if cliente_origen_id:
            cliente = await ClienteService.obtener_cliente_por_id(cliente_origen_id)
            if not cliente:
                raise NotFoundError(
                    detail=f"Cliente origen con ID {cliente_origen_id} no encontrado.",
                    internal_code="CLIENT_ORIGIN_NOT_FOUND"
                )

        if cliente_destino_id:
            cliente = await ClienteService.obtener_cliente_por_id(cliente_destino_id)
            if not cliente:
                raise NotFoundError(
                    detail=f"Cliente destino con ID {cliente_destino_id} no encontrado.",
                    internal_code="CLIENT_DEST_NOT_FOUND"
                )

        offset = (page - 1) * limit

        # Construir condiciones WHERE
        where_conditions = []
        params = []

        if cliente_origen_id:
            where_conditions.append("l.cliente_origen_id = ?")
            params.append(cliente_origen_id)

        if cliente_destino_id:
            where_conditions.append("l.cliente_destino_id = ?")
            params.append(cliente_destino_id)

        if usuario_id:
            where_conditions.append("l.usuario_id = ?")
            params.append(usuario_id)

        if tipo_sincronizacion:
            where_conditions.append("l.tipo_sincronizacion = ?")
            params.append(tipo_sincronizacion)

        if direccion:
            where_conditions.append("l.direccion = ?")
            params.append(direccion)

        if operacion:
            where_conditions.append("l.operacion = ?")
            params.append(operacion)

        if estado:
            where_conditions.append("l.estado = ?")
            params.append(estado)

        if fecha_desde:
            where_conditions.append("l.fecha_sincronizacion >= ?")
            params.append(fecha_desde)

        if fecha_hasta:
            where_conditions.append("l.fecha_sincronizacion <= ?")
            params.append(fecha_hasta)

        where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"

        # Validar ordenar_por
        valid_order_fields = {
            "fecha_sincronizacion": "l.fecha_sincronizacion",
            "estado": "l.estado",
            "usuario_id": "l.usuario_id"
        }
        order_field = valid_order_fields.get(ordenar_por, "l.fecha_sincronizacion")
        order_dir = "DESC" if orden.lower() == "desc" else "ASC"

        # Query para contar total
        count_query = f"""
        SELECT COUNT(*) as total
        FROM dbo.log_sincronizacion_usuario l
        WHERE {where_clause}
        """
        # Determinar qué cliente usar para la conexión (priorizar origen, luego destino)
        target_client_id = cliente_origen_id or cliente_destino_id
        # Si se filtra por cliente, usar la conexión de ese cliente
        count_result = execute_query(count_query, tuple(params), client_id=target_client_id)
        total_logs = count_result[0]['total'] if count_result else 0

        # Query para obtener datos (SIN JOIN con cliente, ya que cliente está en BD centralizada)
        data_query = f"""
        SELECT 
            l.*,
            u.nombre_usuario,
            u.correo,
            ue.nombre_usuario as ejecutor_nombre_usuario,
            ue.correo as ejecutor_correo
        FROM dbo.log_sincronizacion_usuario l
        LEFT JOIN dbo.usuario u ON l.usuario_id = u.usuario_id
        LEFT JOIN dbo.usuario ue ON l.usuario_ejecutor_id = ue.usuario_id
        WHERE {where_clause}
        ORDER BY {order_field} {order_dir}
        OFFSET ? ROWS
        FETCH NEXT ? ROWS ONLY
        """
        params.extend([offset, limit])
        # Determinar qué cliente usar para la conexión (priorizar origen, luego destino)
        target_client_id = cliente_origen_id or cliente_destino_id
        # Si se filtra por cliente, usar la conexión de ese cliente
        logs_raw = execute_query(data_query, tuple(params), client_id=target_client_id)
        
        # Obtener información de clientes desde BD centralizada (ADMIN) si es necesario
        clientes_cache = {}
        from app.db.connection import DatabaseConnection
        for log_row in logs_raw:
            if log_row.get('cliente_origen_id') and log_row['cliente_origen_id'] not in clientes_cache:
                query_cliente = """
                SELECT cliente_id, razon_social, subdominio, codigo_cliente, 
                       nombre_comercial, tipo_instalacion, estado_suscripcion
                FROM dbo.cliente
                WHERE cliente_id = ?
                """
                cliente_raw = execute_query(query_cliente, (log_row['cliente_origen_id'],), connection_type=DatabaseConnection.ADMIN)
                if cliente_raw:
                    cliente_row = cliente_raw[0]
                    clientes_cache[log_row['cliente_origen_id']] = ClienteInfo(
                        cliente_id=cliente_row['cliente_id'],
                        razon_social=cliente_row['razon_social'],
                        subdominio=cliente_row['subdominio'],
                        codigo_cliente=cliente_row.get('codigo_cliente'),
                        nombre_comercial=cliente_row.get('nombre_comercial'),
                        tipo_instalacion=cliente_row.get('tipo_instalacion', 'cloud'),
                        estado_suscripcion=cliente_row.get('estado_suscripcion', 'activo')
                    )
            if log_row.get('cliente_destino_id') and log_row['cliente_destino_id'] not in clientes_cache:
                query_cliente = """
                SELECT cliente_id, razon_social, subdominio, codigo_cliente, 
                       nombre_comercial, tipo_instalacion, estado_suscripcion
                FROM dbo.cliente
                WHERE cliente_id = ?
                """
                cliente_raw = execute_query(query_cliente, (log_row['cliente_destino_id'],), connection_type=DatabaseConnection.ADMIN)
                if cliente_raw:
                    cliente_row = cliente_raw[0]
                    clientes_cache[log_row['cliente_destino_id']] = ClienteInfo(
                        cliente_id=cliente_row['cliente_id'],
                        razon_social=cliente_row['razon_social'],
                        subdominio=cliente_row['subdominio'],
                        codigo_cliente=cliente_row.get('codigo_cliente'),
                        nombre_comercial=cliente_row.get('nombre_comercial'),
                        tipo_instalacion=cliente_row.get('tipo_instalacion', 'cloud'),
                        estado_suscripcion=cliente_row.get('estado_suscripcion', 'activo')
                    )

        # Procesar logs
        logs = []
        for log_row in logs_raw:
            # Cliente origen (usar cache)
            cliente_origen = clientes_cache.get(log_row.get('cliente_origen_id')) if log_row.get('cliente_origen_id') else None

            # Cliente destino (usar cache)
            cliente_destino = clientes_cache.get(log_row.get('cliente_destino_id')) if log_row.get('cliente_destino_id') else None

            # Usuario sincronizado
            usuario = None
            if log_row.get('usuario_id'):
                usuario = UsuarioInfo(
                    usuario_id=log_row['usuario_id'],
                    nombre_usuario=log_row.get('nombre_usuario', ''),
                    correo=log_row.get('correo')
                )

            # Usuario ejecutor
            usuario_ejecutor = None
            if log_row.get('usuario_ejecutor_id'):
                usuario_ejecutor = UsuarioInfo(
                    usuario_id=log_row['usuario_ejecutor_id'],
                    nombre_usuario=log_row.get('ejecutor_nombre_usuario', ''),
                    correo=log_row.get('ejecutor_correo')
                )

            # Parsear JSON fields
            campos_sincronizados = None
            if log_row.get('campos_sincronizados'):
                try:
                    campos_sincronizados = json.loads(log_row['campos_sincronizados'])
                except:
                    pass

            cambios_detectados = None
            if log_row.get('cambios_detectados'):
                try:
                    cambios_detectados = json.loads(log_row['cambios_detectados'])
                except:
                    pass

            log = LogSincronizacionRead(
                log_id=log_row['log_id'],
                cliente_origen_id=log_row.get('cliente_origen_id'),
                cliente_origen=cliente_origen,
                cliente_destino_id=log_row.get('cliente_destino_id'),
                cliente_destino=cliente_destino,
                usuario_id=log_row['usuario_id'],
                usuario=usuario,
                tipo_sincronizacion=log_row['tipo_sincronizacion'],
                direccion=log_row['direccion'],
                operacion=log_row['operacion'],
                estado=log_row['estado'],
                mensaje_error=log_row.get('mensaje_error'),
                campos_sincronizados=campos_sincronizados,
                cambios_detectados=cambios_detectados,
                hash_antes=log_row.get('hash_antes'),
                hash_despues=log_row.get('hash_despues'),
                fecha_sincronizacion=log_row['fecha_sincronizacion'],
                usuario_ejecutor_id=log_row.get('usuario_ejecutor_id'),
                usuario_ejecutor=usuario_ejecutor,
                duracion_ms=log_row.get('duracion_ms')
            )
            logs.append(log)

        total_paginas = math.ceil(total_logs / limit) if limit > 0 else 0

        return {
            "logs": [l.model_dump() for l in logs],
            "total_logs": total_logs,
            "pagina_actual": page,
            "total_paginas": total_paginas
        }

    @staticmethod
    @BaseService.handle_service_errors
    async def obtener_estadisticas(
        cliente_id: Optional[int] = None,
        fecha_desde: Optional[datetime] = None,
        fecha_hasta: Optional[datetime] = None
    ) -> Dict:
        """
        Obtiene estadísticas agregadas de auditoría.
        """
        logger.info(f"Obteniendo estadísticas de auditoría - cliente_id: {cliente_id}")

        # Validar fechas
        if fecha_desde and fecha_hasta and fecha_desde > fecha_hasta:
            raise ValidationError(
                detail="fecha_desde debe ser anterior a fecha_hasta.",
                internal_code="INVALID_DATE_RANGE"
            )

        # Validar cliente_id si se proporciona
        if cliente_id:
            cliente = await ClienteService.obtener_cliente_por_id(cliente_id)
            if not cliente:
                raise NotFoundError(
                    detail=f"Cliente con ID {cliente_id} no encontrado.",
                    internal_code="CLIENT_NOT_FOUND"
                )

        # Construir condiciones WHERE para autenticación
        where_auth = []
        params_auth = []
        if cliente_id:
            where_auth.append("a.cliente_id = ?")
            params_auth.append(cliente_id)
        if fecha_desde:
            where_auth.append("a.fecha_evento >= ?")
            params_auth.append(fecha_desde)
        if fecha_hasta:
            where_auth.append("a.fecha_evento <= ?")
            params_auth.append(fecha_hasta)
        where_auth_clause = " AND ".join(where_auth) if where_auth else "1=1"

        # Estadísticas de autenticación
        auth_stats_query = f"""
        SELECT 
            COUNT(*) as total_eventos,
            SUM(CASE WHEN evento IN ('login_success', 'sso_login_success') AND exito = 1 THEN 1 ELSE 0 END) as login_exitosos,
            SUM(CASE WHEN evento IN ('login_failed', 'sso_login_failed') AND exito = 0 THEN 1 ELSE 0 END) as login_fallidos,
            evento,
            COUNT(*) as eventos_por_tipo
        FROM dbo.auth_audit_log a
        WHERE {where_auth_clause}
        GROUP BY evento
        """
        # Si se filtra por cliente_id, usar la conexión de ese cliente
        auth_stats_raw = execute_query(auth_stats_query, tuple(params_auth), client_id=cliente_id)

        # Procesar estadísticas de autenticación
        total_eventos = 0
        login_exitosos = 0
        login_fallidos = 0
        eventos_por_tipo = {}
        
        if auth_stats_raw:
            for row in auth_stats_raw:
                total_eventos += row.get('total_eventos', 0)
                login_exitosos += row.get('login_exitosos', 0)
                login_fallidos += row.get('login_fallidos', 0)
                if row.get('evento'):
                    eventos_por_tipo[row['evento']] = row.get('eventos_por_tipo', 0)

        # Construir condiciones WHERE para sincronización
        where_sync = []
        params_sync = []
        if cliente_id:
            where_sync.append("(l.cliente_origen_id = ? OR l.cliente_destino_id = ?)")
            params_sync.extend([cliente_id, cliente_id])
        if fecha_desde:
            where_sync.append("l.fecha_sincronizacion >= ?")
            params_sync.append(fecha_desde)
        if fecha_hasta:
            where_sync.append("l.fecha_sincronizacion <= ?")
            params_sync.append(fecha_hasta)
        where_sync_clause = " AND ".join(where_sync) if where_sync else "1=1"

        # Estadísticas de sincronización
        sync_stats_query = f"""
        SELECT 
            COUNT(*) as total_sincronizaciones,
            SUM(CASE WHEN estado = 'exitoso' THEN 1 ELSE 0 END) as exitosas,
            SUM(CASE WHEN estado = 'fallido' THEN 1 ELSE 0 END) as fallidas,
            tipo_sincronizacion,
            COUNT(*) as por_tipo
        FROM dbo.log_sincronizacion_usuario l
        WHERE {where_sync_clause}
        GROUP BY tipo_sincronizacion
        """
        # Si se filtra por cliente_id, usar la conexión de ese cliente
        sync_stats_raw = execute_query(sync_stats_query, tuple(params_sync), client_id=cliente_id)

        # Procesar estadísticas de sincronización
        total_sincronizaciones = 0
        exitosas = 0
        fallidas = 0
        por_tipo = {}
        
        if sync_stats_raw:
            for row in sync_stats_raw:
                total_sincronizaciones += row.get('total_sincronizaciones', 0)
                exitosas += row.get('exitosas', 0)
                fallidas += row.get('fallidas', 0)
                if row.get('tipo_sincronizacion'):
                    por_tipo[row['tipo_sincronizacion']] = row.get('por_tipo', 0)

        # Top IPs
        top_ips_query = f"""
        SELECT TOP 10
            ip_address,
            COUNT(*) as total_eventos,
            SUM(CASE WHEN exito = 0 THEN 1 ELSE 0 END) as eventos_fallidos
        FROM dbo.auth_audit_log a
        WHERE {where_auth_clause} AND ip_address IS NOT NULL
        GROUP BY ip_address
        ORDER BY total_eventos DESC
        """
        # Si se filtra por cliente_id, usar la conexión de ese cliente
        top_ips_raw = execute_query(top_ips_query, tuple(params_auth), client_id=cliente_id)
        top_ips = [
            IPStats(
                ip_address=row['ip_address'],
                total_eventos=row['total_eventos'],
                eventos_fallidos=row['eventos_fallidos']
            ) for row in top_ips_raw
        ] if top_ips_raw else []

        # Top usuarios
        top_usuarios_query = f"""
        SELECT TOP 10
            u.usuario_id,
            u.nombre_usuario,
            COUNT(*) as total_eventos
        FROM dbo.auth_audit_log a
        INNER JOIN dbo.usuario u ON a.usuario_id = u.usuario_id
        WHERE {where_auth_clause} AND a.usuario_id IS NOT NULL
        GROUP BY u.usuario_id, u.nombre_usuario
        ORDER BY total_eventos DESC
        """
        # Si se filtra por cliente_id, usar la conexión de ese cliente
        top_usuarios_raw = execute_query(top_usuarios_query, tuple(params_auth), client_id=cliente_id)
        top_usuarios = [
            UsuarioStats(
                usuario_id=row['usuario_id'],
                nombre_usuario=row['nombre_usuario'],
                total_eventos=row['total_eventos']
            ) for row in top_usuarios_raw
        ] if top_usuarios_raw else []

        # Construir respuesta
        periodo = PeriodoInfo(
            fecha_desde=fecha_desde or datetime.min,
            fecha_hasta=fecha_hasta or datetime.now()
        )

        autenticacion = AutenticacionStats(
            total_eventos=total_eventos,
            login_exitosos=login_exitosos,
            login_fallidos=login_fallidos,
            eventos_por_tipo=eventos_por_tipo
        )

        sincronizacion = SincronizacionStats(
            total_sincronizaciones=total_sincronizaciones,
            exitosas=exitosas,
            fallidas=fallidas,
            por_tipo=por_tipo
        )

        estadisticas = AuditoriaEstadisticasResponse(
            periodo=periodo,
            autenticacion=autenticacion,
            sincronizacion=sincronizacion,
            top_ips=top_ips if top_ips else None,
            top_usuarios=top_usuarios if top_usuarios else None
        )

        return estadisticas.model_dump()

