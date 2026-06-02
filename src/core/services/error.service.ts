// src/core/services/error.service.ts
import { SimplifiedApiError } from '../../features/auth/types/auth.types';
import axios, { AxiosError } from 'axios'; // Importar AxiosError para tipado más preciso

// Interfaz para la estructura esperada del error de FastAPI
interface FastAPIErrorDetail {
  detail: string | { msg: string; type: string; loc?: (string | number)[] }[]; // Pydantic: loc = path al campo
}

type PydanticValidationItem = { msg?: string; type?: string; loc?: (string | number)[] };

/** Extrae mensaje legible de `detail` (FastAPI). Si no hay texto útil, null → usar fallback HTTP. */
function messageFromDetail(detail: unknown): string | null {
  if (detail === undefined || detail === null) return null;
  if (typeof detail === 'string') {
    const t = detail.trim();
    return t.length > 0 ? detail : null;
  }
  if (Array.isArray(detail)) {
    if (detail.length === 0) return null;
    const parts: string[] = [];
    for (const item of detail) {
      if (typeof item === 'string') {
        const t = item.trim();
        if (t) parts.push(t);
      } else if (item && typeof item === 'object' && 'msg' in item) {
        const msg = (item as PydanticValidationItem).msg;
        if (typeof msg === 'string' && msg.trim()) parts.push(msg.trim());
      }
    }
    if (parts.length === 0) return null;
    return parts.join('; ');
  }
  return null;
}

/** Si el body de error llega como string JSON, intentar parsearlo para leer `detail`. */
function normalizeErrorPayload(data: unknown): unknown {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as unknown;
    } catch {
      return data;
    }
  }
  return data;
}

function messageFromHttpStatus(status: number): string {
  switch (status) {
    case 400:
      return 'Los datos enviados son incorrectos. Revisa los campos marcados en rojo y corrige los errores.';
    case 401:
      return 'Tu sesión ha expirado o las credenciales son inválidas. Por favor, inicia sesión nuevamente.';
    case 403:
      return 'No tienes permiso para realizar esta acción. Contacta al administrador si necesitas acceso.';
    case 404:
      return 'El recurso solicitado no existe o fue eliminado. Verifica que la información sea correcta.';
    case 409:
      return 'El recurso ya existe o hay un conflicto de duplicidad. Verifica que no esté duplicado (ej: subdominio, código).';
    case 422:
      return 'Los datos enviados no son válidos. Revisa el formato de los campos y vuelve a intentar.';
    case 500:
      return 'Error interno del servidor (500). Revise los logs del backend; suele deberse a base de datos, migraciones o un fallo en la API.';
    case 503:
      return 'El servicio no está disponible temporalmente. Intenta nuevamente en unos momentos.';
    default:
      return `Error del servidor (${status}). Intenta nuevamente o contacta al soporte si persiste.`;
  }
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
      const status = axiosError.response.status;
      const payload = normalizeErrorPayload(axiosError.response.data);
      const detail =
        payload && typeof payload === 'object' && 'detail' in payload
          ? (payload as FastAPIErrorDetail).detail
          : undefined;
      const fromDetail = messageFromDetail(detail);
      const message = fromDetail ?? messageFromHttpStatus(status);
      return { message, status };
    }

    if (axiosError.request) {
      // Error de conexión (no hubo respuesta)
      return {
        message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
        status: 0 // O algún código que represente error de red
      };
    }
  }

  // Errores de contrato FE (p. ej. respuesta vacía del servicio) — no reemplaza propagación Axios
  if (error instanceof Error) {
    const trimmed = error.message?.trim();
    if (trimmed) {
      return { message: trimmed, status: 0 };
    }
  }

  console.error('Error no manejado por Axios:', error);
  return {
    message: 'Ocurrió un error inesperado en la aplicación.',
    status: 0,
  };
};

/**
 * Extrae errores de validación 422 por campo para mostrarlos en formularios.
 * Si el error no es 422 o no tiene detail en formato array, devuelve fieldErrors vacío.
 */
export const getValidationErrors = (error: unknown): ValidationErrorsResult => {
  if (!axios.isAxiosError(error) || !error.response) {
    const base = getErrorMessage(error);
    return { ...base, fieldErrors: {} };
  }
  const status = error.response.status;
  const payload = normalizeErrorPayload(error.response.data);
  const detail =
    payload && typeof payload === 'object' && 'detail' in payload
      ? (payload as FastAPIErrorDetail).detail
      : undefined;
  const fieldErrors: Record<string, string> = {};

  if (Array.isArray(detail) && detail.length > 0) {
    for (const item of detail) {
      if (item && typeof item === 'object' && 'msg' in item) {
        const msg = (item as { msg: string }).msg;
        const loc = (item as { loc?: (string | number)[] }).loc;
        if (loc && Array.isArray(loc)) {
          const key = typeof loc[loc.length - 1] === 'string' ? loc[loc.length - 1] : String(loc[loc.length - 1]);
          if (key && key !== 'body') fieldErrors[key] = msg;
        }
      }
    }
  }

  const fromDetail = messageFromDetail(detail);
  const message =
    fromDetail ??
    (status === 422 && Object.keys(fieldErrors).length > 0
      ? 'Revisa los campos marcados.'
      : messageFromHttpStatus(status));

  return { message, status, fieldErrors };
};




