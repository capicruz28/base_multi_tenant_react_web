// src/core/services/error.service.ts
import { SimplifiedApiError } from '../../features/auth/types/auth.types';
import axios, { AxiosError } from 'axios';

interface FastAPIErrorDetail {
  detail: string | { msg: string; type: string; loc?: (string | number)[] }[];
}

type PydanticValidationItem = { msg?: string; type?: string; loc?: (string | number)[] };

export const FORM_VALIDATION_TOAST_MESSAGE =
  'Revisa los campos indicados en el formulario.';

const GENERIC_FIELD_MESSAGE = 'Revisa el valor ingresado en este campo.';

const PLATFORM_FIELD_MESSAGES: Record<string, string> = {
  contacto_email: 'El email de contacto no es válido.',
  codigo_cliente: 'El código de cliente no es válido o ya existe.',
  subdominio: 'El subdominio no es válido o no está disponible.',
  razon_social: 'La razón social es obligatoria o no cumple el formato esperado.',
  ruc: 'El RUC debe contener solo números (8–15 dígitos).',
  servidor_api_local: 'La URL debe comenzar con http:// o https://.',
  color_primario: 'Usa un color en formato #RRGGBB.',
  color_secundario: 'Usa un color en formato #RRGGBB.',
  tema_personalizado: 'El JSON del tema no es válido.',
  plan_suscripcion: 'Selecciona un plan de suscripción válido.',
  estado_suscripcion: 'Selecciona un estado de suscripción válido.',
  codigo: 'El código no es válido.',
  nombre: 'El nombre es obligatorio o no es válido.',
  categoria: 'La categoría es obligatoria.',
  color: 'El color debe ser hexadecimal (#RRGGBB).',
  orden: 'El orden debe ser un número mayor o igual a 0.',
  simbolo: 'Revisa el símbolo ingresado.',
  decimales: 'Revisa los decimales ingresados.',
  codigo_iso2: 'Código ISO o nombre no válido.',
  codigo_iso3: 'Código ISO o nombre no válido.',
  ubigeo: 'El ubigeo debe tener 6 dígitos.',
  pais_id: 'Selecciona un valor válido.',
  departamento_id: 'Selecciona un valor válido.',
  provincia_id: 'Selecciona un valor válido.',
};

function isEmailValidation(msg: string, type?: string): boolean {
  const lower = msg.toLowerCase();
  return (
    (type === 'value_error' && lower.includes('email')) ||
    lower.includes('valid email') ||
    lower.includes('email address') ||
    lower.includes('special-use or reserved name')
  );
}

function matchHeuristic(msg: string, type?: string): string | null {
  const lower = msg.toLowerCase();

  if (isEmailValidation(msg, type)) {
    if (lower.includes('special-use or reserved name')) {
      return 'El dominio del email no es válido para correo electrónico.';
    }
    return 'El email no es válido. Usa un dominio real (ej. @empresa.com).';
  }
  if (lower.includes('field required') || lower.includes('missing') || type === 'missing') {
    return 'Este campo es obligatorio.';
  }
  if (type === 'string_too_short' || lower.includes('at least')) {
    return 'El valor es demasiado corto.';
  }
  if (type === 'string_too_long' || lower.includes('at most')) {
    return 'El valor es demasiado largo.';
  }
  if (lower.includes('already exists') || lower.includes('duplicate')) {
    return 'Este valor ya está registrado.';
  }
  if (lower.includes('hex') || (lower.includes('color') && lower.includes('valid'))) {
    return 'Usa un color en formato #RRGGBB.';
  }

  return null;
}

/** Quita prefijos técnicos body./query./path. y prefijos campo: */
export function stripTechnicalPrefix(raw: string, fieldKey?: string): string {
  let text = raw.trim();
  text = text.replace(/^(body|query|path)\.[\w.[\]-]+:\s*/i, '');
  if (fieldKey) {
    const fieldPrefix = new RegExp(`^${fieldKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:\\s*`, 'i');
    text = text.replace(fieldPrefix, '');
  }
  text = text.replace(/^value error,?\s*/i, '');
  return text.trim();
}

/** Mensaje amigable para un ítem de validación Pydantic o string con prefijo técnico. */
export function sanitizeFieldMessage(
  input: string | PydanticValidationItem,
  fieldKey?: string,
): string {
  const msg = typeof input === 'string' ? input : (input.msg ?? '');
  const type = typeof input === 'string' ? undefined : input.type;
  const cleaned = stripTechnicalPrefix(msg, fieldKey);

  if (fieldKey === 'contacto_email' && isEmailValidation(cleaned || msg, type)) {
    return PLATFORM_FIELD_MESSAGES.contacto_email;
  }

  const heuristic = matchHeuristic(cleaned || msg, type);
  if (heuristic) return heuristic;

  if (fieldKey && PLATFORM_FIELD_MESSAGES[fieldKey]) {
    return PLATFORM_FIELD_MESSAGES[fieldKey];
  }

  return GENERIC_FIELD_MESSAGE;
}

function extractFieldKeyFromLoc(loc: (string | number)[]): string | null {
  if (!loc.length) return null;
  const last = loc[loc.length - 1];
  if (typeof last === 'string' && last !== 'body') return last;
  if (typeof last === 'number' && loc.length >= 2) {
    const prev = loc[loc.length - 2];
    if (typeof prev === 'string' && prev !== 'body') return prev;
  }
  return typeof last === 'string' ? last : String(last);
}

function parseFieldErrorsFromDetail(detail: unknown): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  if (Array.isArray(detail)) {
    for (const item of detail) {
      if (item && typeof item === 'object' && 'msg' in item) {
        const pydanticItem = item as PydanticValidationItem;
        const loc = pydanticItem.loc;
        if (loc && Array.isArray(loc)) {
          const key = extractFieldKeyFromLoc(loc);
          if (key && key !== 'body') {
            fieldErrors[key] = sanitizeFieldMessage(pydanticItem, key);
          }
        }
      }
    }
    return fieldErrors;
  }

  if (typeof detail === 'string') {
    const match = detail.match(/^(body|query|path)\.([\w.[\]-]+):\s*(.+)$/i);
    if (match) {
      const key = match[2].split('.').pop() ?? match[2];
      fieldErrors[key] = sanitizeFieldMessage(detail, key);
    }
  }

  return fieldErrors;
}

/** Extrae mensaje legible de `detail` (FastAPI). Si no hay texto útil, null → usar fallback HTTP. */
function messageFromDetail(detail: unknown): string | null {
  if (detail === undefined || detail === null) return null;
  if (typeof detail === 'string') {
    const t = detail.trim();
    if (t.length === 0) return null;
    if (/^(body|query|path)\./i.test(t)) return null;
    return detail;
  }
  if (Array.isArray(detail)) {
    if (detail.length === 0) return null;
    const parts: string[] = [];
    for (const item of detail) {
      if (typeof item === 'string') {
        const t = item.trim();
        if (t && !/^(body|query|path)\./i.test(t)) parts.push(t);
      } else if (item && typeof item === 'object' && 'msg' in item) {
        const msg = (item as PydanticValidationItem).msg;
        if (typeof msg === 'string' && msg.trim() && !/^(body|query|path)\./i.test(msg.trim())) {
          parts.push(msg.trim());
        }
      }
    }
    if (parts.length === 0) return null;
    return parts.join('; ');
  }
  return null;
}

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
      return 'Los datos enviados son incorrectos.';
    case 401:
      return 'Tu sesión ha expirado o las credenciales son inválidas. Por favor, inicia sesión nuevamente.';
    case 403:
      return 'No tienes permiso para realizar esta acción. Contacta al administrador si necesitas acceso.';
    case 404:
      return 'El recurso solicitado no existe o fue eliminado. Verifica que la información sea correcta.';
    case 409:
      return 'El recurso ya existe o hay un conflicto de duplicidad. Verifica que no esté duplicado (ej: subdominio, código).';
    case 422:
      return 'Los datos enviados no son válidos.';
    case 500:
      return 'Error interno del servidor (500). Revise los logs del backend; suele deberse a base de datos, migraciones o un fallo en la API.';
    case 503:
      return 'El servicio no está disponible temporalmente. Intenta nuevamente en unos momentos.';
    default:
      return `Error del servidor (${status}). Intenta nuevamente o contacta al soporte si persiste.`;
  }
}

export interface ValidationErrorsResult {
  message: string;
  status: number;
  fieldErrors: Record<string, string>;
}

export const getErrorMessage = (error: unknown): SimplifiedApiError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<FastAPIErrorDetail>;

    if (axiosError.response) {
      const status = axiosError.response.status;

      if (status === 422 || status === 400) {
        const validation = getValidationErrors(error);
        if (Object.keys(validation.fieldErrors).length > 0) {
          return { message: FORM_VALIDATION_TOAST_MESSAGE, status };
        }
      }

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
      return {
        message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
        status: 0,
      };
    }
  }

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

  const fieldErrors = parseFieldErrorsFromDetail(detail);
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;

  const message =
    hasFieldErrors && (status === 422 || status === 400)
      ? FORM_VALIDATION_TOAST_MESSAGE
      : messageFromDetail(detail) ?? messageFromHttpStatus(status);

  return { message, status, fieldErrors };
};
