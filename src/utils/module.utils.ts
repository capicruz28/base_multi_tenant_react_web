/**
 * Utilidades para gestión de módulos
 * Funciones helper para cálculos de fechas, límites, estados, etc.
 */

import { ModuloActivacion, ModuloEstadisticas, ModuloAlerta, ConexionEstado } from '@/types/modulo.types';
import { EstadoConexion } from '@/types/conexion.types';

// ============================================
// UTILIDADES DE FECHAS
// ============================================

/**
 * Calcula los días restantes hasta el vencimiento
 */
export const calcularDiasRestantes = (fechaVencimiento: string | null): number | null => {
    if (!fechaVencimiento) return null;

    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diffTime = vencimiento.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
};

/**
 * Verifica si un módulo está vencido
 */
export const estaVencido = (fechaVencimiento: string | null): boolean => {
    if (!fechaVencimiento) return false;

    const dias = calcularDiasRestantes(fechaVencimiento);
    return dias !== null && dias < 0;
};

/**
 * Verifica si el vencimiento está próximo (menos de 30 días)
 */
export const vencimientoProximo = (fechaVencimiento: string | null): boolean => {
    if (!fechaVencimiento) return false;

    const dias = calcularDiasRestantes(fechaVencimiento);
    return dias !== null && dias >= 0 && dias <= 30;
};

/**
 * Formatea una fecha para mostrar
 */
export const formatearFecha = (fecha: string | null): string => {
    if (!fecha) return 'N/A';

    const date = new Date(fecha);
    return new Intl.DateTimeFormat('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(date);
};

/**
 * Formatea una fecha con hora
 */
export const formatearFechaHora = (fecha: string | null): string => {
    if (!fecha) return 'N/A';

    const date = new Date(fecha);
    return new Intl.DateTimeFormat('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};

// ============================================
// UTILIDADES DE LÍMITES
// ============================================

/**
 * Calcula el porcentaje de uso de un límite
 */
export const calcularPorcentajeUso = (actual: number, limite: number | null): number => {
    if (!limite || limite === 0) return 0;
    return Math.min((actual / limite) * 100, 100);
};

/**
 * Verifica si se está cerca del límite (>= 80%)
 */
export const cercaDelLimite = (actual: number, limite: number | null): boolean => {
    if (!limite) return false;
    return calcularPorcentajeUso(actual, limite) >= 80;
};

/**
 * Verifica si se alcanzó el límite
 */
export const limiteAlcanzado = (actual: number, limite: number | null): boolean => {
    if (!limite) return false;
    return actual >= limite;
};

/**
 * Obtiene el color para la barra de progreso según el porcentaje
 */
export const getColorPorcentaje = (porcentaje: number): string => {
    if (porcentaje >= 90) return 'bg-red-500';
    if (porcentaje >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
};

// ============================================
// UTILIDADES DE ESTADO DE CONEXIÓN
// ============================================

/**
 * Obtiene el estado de una conexión basado en sus propiedades
 */
export const obtenerEstadoConexion = (conexion: ConexionEstado): EstadoConexion => {
    if (!conexion.es_activo) return 'desconectado';
    if (conexion.ultimo_error && conexion.fecha_ultimo_error) {
        const errorReciente = new Date(conexion.fecha_ultimo_error).getTime() >
            (conexion.ultima_conexion_exitosa ? new Date(conexion.ultima_conexion_exitosa).getTime() : 0);
        if (errorReciente) return 'error';
    }
    if (conexion.ultima_conexion_exitosa) return 'conectado';
    return 'no_probado';
};

/**
 * Obtiene el color del badge según el estado de conexión
 */
export const getColorEstadoConexion = (estado: EstadoConexion): string => {
    switch (estado) {
        case 'conectado':
            return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        case 'desconectado':
            return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        case 'error':
            return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
        case 'no_probado':
            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        default:
            return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
};

/**
 * Obtiene el texto del estado de conexión
 */
export const getTextoEstadoConexion = (estado: EstadoConexion): string => {
    switch (estado) {
        case 'conectado':
            return 'Conectado';
        case 'desconectado':
            return 'Desconectado';
        case 'error':
            return 'Error';
        case 'no_probado':
            return 'No Probado';
        default:
            return 'Desconocido';
    }
};

// ============================================
// UTILIDADES DE ALERTAS
// ============================================

/**
 * Genera alertas basadas en el estado del módulo
 */
export const generarAlertas = (
    activacion: ModuloActivacion | null,
    estadisticas: ModuloEstadisticas | null,
    conexiones: ConexionEstado[]
): ModuloAlerta[] => {
    const alertas: ModuloAlerta[] = [];
    const ahora = new Date().toISOString();

    if (!activacion) return alertas;

    // Alerta de vencimiento
    if (activacion.fecha_vencimiento) {
        if (estaVencido(activacion.fecha_vencimiento)) {
            alertas.push({
                tipo: 'vencido',
                severidad: 'error',
                mensaje: 'El módulo ha vencido',
                fecha_generacion: ahora,
            });
        } else if (vencimientoProximo(activacion.fecha_vencimiento)) {
            const dias = calcularDiasRestantes(activacion.fecha_vencimiento);
            alertas.push({
                tipo: 'vencimiento_proximo',
                severidad: 'warning',
                mensaje: `El módulo vence en ${dias} días`,
                fecha_generacion: ahora,
            });
        }
    }

    // Alertas de límites
    if (estadisticas) {
        if (activacion.limite_usuarios && cercaDelLimite(estadisticas.usuarios_activos, activacion.limite_usuarios)) {
            alertas.push({
                tipo: 'limite_usuarios',
                severidad: limiteAlcanzado(estadisticas.usuarios_activos, activacion.limite_usuarios) ? 'error' : 'warning',
                mensaje: `Límite de usuarios: ${estadisticas.usuarios_activos}/${activacion.limite_usuarios}`,
                fecha_generacion: ahora,
            });
        }

        if (activacion.limite_registros && cercaDelLimite(estadisticas.registros_actuales, activacion.limite_registros)) {
            alertas.push({
                tipo: 'limite_registros',
                severidad: limiteAlcanzado(estadisticas.registros_actuales, activacion.limite_registros) ? 'error' : 'warning',
                mensaje: `Límite de registros: ${estadisticas.registros_actuales}/${activacion.limite_registros}`,
                fecha_generacion: ahora,
            });
        }
    }

    // Alertas de conexión
    const conexionesConError = conexiones.filter(c => obtenerEstadoConexion(c) === 'error');
    if (conexionesConError.length > 0) {
        alertas.push({
            tipo: 'conexion_error',
            severidad: 'error',
            mensaje: `${conexionesConError.length} conexión(es) con error`,
            fecha_generacion: ahora,
        });
    }

    return alertas;
};

/**
 * Obtiene el color del badge según la severidad de la alerta
 */
export const getColorSeveridad = (severidad: 'info' | 'warning' | 'error'): string => {
    switch (severidad) {
        case 'info':
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
        case 'warning':
            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        case 'error':
            return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
        default:
            return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
};

// ============================================
// UTILIDADES DE TIPO DE BD
// ============================================

/**
 * Obtiene el ícono para el tipo de base de datos
 */
export const getIconoTipoBD = (tipoBD: string): string => {
    switch (tipoBD.toLowerCase()) {
        case 'sqlserver':
            return '🗄️';
        case 'postgresql':
            return '🐘';
        case 'mysql':
            return '🐬';
        case 'oracle':
            return '🔶';
        default:
            return '💾';
    }
};

/**
 * Obtiene el nombre completo del tipo de BD
 */
export const getNombreTipoBD = (tipoBD: string): string => {
    switch (tipoBD.toLowerCase()) {
        case 'sqlserver':
            return 'SQL Server';
        case 'postgresql':
            return 'PostgreSQL';
        case 'mysql':
            return 'MySQL';
        case 'oracle':
            return 'Oracle';
        default:
            return tipoBD;
    }
};

// ============================================
// UTILIDADES DE FORMATO
// ============================================

/**
 * Formatea un número con separadores de miles
 */
export const formatearNumero = (numero: number): string => {
    return new Intl.NumberFormat('es-ES').format(numero);
};

/**
 * Formatea bytes a un formato legible
 */
export const formatearBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};
