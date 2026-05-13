// src/core/services/error.service.ts
import { SimplifiedApiError } from '../../features/auth/types/auth.types';
import axios, { AxiosError } from 'axios'; // Importar AxiosError para tipado más preciso

// Interfaz para la estructura esperada del error de FastAPI
interface FastAPIErrorDetail {
  detail: string | { msg: string; type: string; loc?: (string | number)[] }[]; // Pydantic: loc = path al campo
}

/** Resultado para mostrar errores 422 por campo en formularios */
export interface ValidationErrorsResult {
  message: string;
  status: number;
  /** Clave = nombre del campo (ej. codigo_empresa), valor = mensaje para ese campo */
  fieldErrors: Record<string, string>;
}

export const getErrorMessage = (error: unknown): SimplifiedApiError => {
  // Primero, verificar si es un error de Axios
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<FastAPIErrorDetail>; // Tipar la data esperada

    if (axiosError.response) {
      // Error de respuesta del servidor (4xx, 5xx)
      const status = axiosError.response.status;
      let message = 'Error desconocido del servidor.'; // Mensaje por defecto

      // --- PRIORIDAD 1: Usar el 'detail' del backend si existe ---
      if (axiosError.response.data?.detail) {
        const detail = axiosError.response.data.detail;
        if (typeof detail === 'string') {
          message = detail; // Usar el mensaje string directamente
        } else if (Array.isArray(detail) && detail.length > 0 && detail[0].msg) {
          // Si es un array de errores de validación Pydantic, tomar el primero
          message = detail[0].msg;
        }
        // Podrías añadir lógica para manejar múltiples errores de validación si quisieras
      } else {
        // --- PRIORIDAD 2: Mensajes específicos y accionables por status si no hay 'detail' ---
        switch (status) {
          case 400:
            message = 'Los datos enviados son incorrectos. Revisa los campos marcados en rojo y corrige los errores.';
            break;
          case 401:
            message = 'Tu sesión ha expirado o las credenciales son inválidas. Por favor, inicia sesión nuevamente.';
            break;
          case 403:
            message = 'No tienes permiso para realizar esta acción. Contacta al administrador si necesitas acceso.';
            break;
          case 404:
            message = 'El recurso solicitado no existe o fue eliminado. Verifica que la información sea correcta.';
            break;
          case 409:
            message = 'El recurso ya existe o hay un conflicto de duplicidad. Verifica que no esté duplicado (ej: subdominio, código).';
            break;
          case 422:
            message = 'Los datos enviados no son válidos. Revisa el formato de los campos y vuelve a intentar.';
            break;
          case 500:
            message = 'Error interno del servidor (500). Revise los logs del backend; suele deberse a base de datos, migraciones o un fallo en la API.';
            break;
          case 503:
            message = 'El servicio no está disponible temporalmente. Intenta nuevamente en unos momentos.';
            break;
          default:
            message = `Error del servidor (${status}). Intenta nuevamente o contacta al soporte si persiste.`;
        }
      }

      return { message, status };

    } else if (axiosError.request) {
      // Error de conexión (no hubo respuesta)
      return {
        message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
        status: 0 // O algún código que represente error de red
      };
    }
  }

  // Si no es un error de Axios o es otro tipo de error
  console.error("Error no manejado por Axios:", error); // Loggear el error original
  return {
    message: 'Ocurrió un error inesperado en la aplicación.',
    status: 0 // O algún código genérico de error de cliente
  };
};

/**
 * Extrae errores de validación 422 por campo para mostrarlos en formularios.
 * Si el error no es 422 o no tiene detail en formato array, devuelve fieldErrors vacío.
 */
export const getValidationErrors = (error: unknown): ValidationErrorsResult => {
  const fallback = { message: 'Error de validación.', status: 422, fieldErrors: {} as Record<string, string> };
  if (!axios.isAxiosError(error) || !error.response) {
    const base = getErrorMessage(error);
    return { ...base, fieldErrors: {} };
  }
  const status = error.response.status;
  const data = error.response.data as FastAPIErrorDetail | undefined;
  const detail = data?.detail;
  const fieldErrors: Record<string, string> = {};
  let message = status === 422 ? 'Revisa los campos marcados.' : (data && typeof (data as { message?: string }).message === 'string' ? (data as { message: string }).message : 'Error del servidor.');

  if (Array.isArray(detail) && detail.length > 0) {
    for (const item of detail) {
      if (item && typeof item === 'object' && 'msg' in item) {
        const msg = (item as { msg: string }).msg;
        const loc = (item as { loc?: (string | number)[] }).loc;
        if (loc && Array.isArray(loc)) {
          // loc suele ser ["body", "codigo_empresa"] o ["query", "empresa_id"]; usar el último segmento como clave
          const key = typeof loc[loc.length - 1] === 'string' ? loc[loc.length - 1] : String(loc[loc.length - 1]);
          if (key && key !== 'body') fieldErrors[key] = msg;
        }
        if (!message || message === 'Revisa los campos marcados.') message = msg;
      }
    }
  } else if (typeof detail === 'string') {
    message = detail;
  }

  return { message, status, fieldErrors };
};




