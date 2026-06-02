import {
  AuthenticationMode,
  InstallationType,
  SubscriptionPlan,
  SubscriptionStatus,
} from '@/core/constants';
import type { Cliente, ClienteCreate, ClienteUpdate } from '../../types/cliente.types';
import { bool, str } from '@/features/org/utils/org-form-dirty.helpers';

/** Baseline único para create — fuente de verdad para reset y dirty. */
export const CREATE_CLIENT_DEFAULT: ClienteCreate = {
  codigo_cliente: '',
  subdominio: '',
  razon_social: '',
  nombre_comercial: '',
  ruc: '',
  tipo_instalacion: InstallationType.SHARED,
  servidor_api_local: '',
  modo_autenticacion: AuthenticationMode.LOCAL,
  logo_url: '',
  favicon_url: '',
  color_primario: '#1976D2',
  color_secundario: '#424242',
  tema_personalizado: '',
  plan_suscripcion: SubscriptionPlan.TRIAL,
  estado_suscripcion: SubscriptionStatus.TRIAL,
  fecha_inicio_suscripcion: '',
  fecha_fin_trial: '',
  contacto_nombre: '',
  contacto_email: '',
  contacto_telefono: '',
  es_demo: false,
  api_key_sincronizacion: '',
  sincronizacion_habilitada: false,
};

export type ClienteFormNormalized = ReturnType<typeof normalizeClienteFormFields>;

function optNullable(value: string | null | undefined): string | null {
  const s = str(value);
  return s === '' ? null : s;
}

function normalizeDateField(value: string | null | undefined): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (trimmed.includes('T')) return trimmed.split('T')[0] ?? '';
  return trimmed;
}

/** Solo campos editables en UI de create/edit (B11-09). */
export function normalizeClienteFormFields(form: ClienteCreate | ClienteUpdate) {
  return {
    codigo_cliente: str(form.codigo_cliente),
    subdominio: str(form.subdominio),
    razon_social: str(form.razon_social),
    nombre_comercial: optNullable(form.nombre_comercial),
    ruc: optNullable(form.ruc),
    tipo_instalacion: str(form.tipo_instalacion) || InstallationType.SHARED,
    servidor_api_local: optNullable(form.servidor_api_local),
    modo_autenticacion: str(form.modo_autenticacion) || AuthenticationMode.LOCAL,
    logo_url: optNullable(form.logo_url),
    favicon_url: optNullable(form.favicon_url),
    color_primario: str(form.color_primario) || '#1976D2',
    color_secundario: str(form.color_secundario) || '#424242',
    tema_personalizado: optNullable(form.tema_personalizado),
    plan_suscripcion: str(form.plan_suscripcion) || SubscriptionPlan.TRIAL,
    estado_suscripcion: str(form.estado_suscripcion) || SubscriptionStatus.TRIAL,
    fecha_inicio_suscripcion: normalizeDateField(form.fecha_inicio_suscripcion),
    fecha_fin_trial: normalizeDateField(form.fecha_fin_trial),
    contacto_nombre: optNullable(form.contacto_nombre),
    contacto_email: str(form.contacto_email),
    contacto_telefono: optNullable(form.contacto_telefono),
    es_demo: bool(form.es_demo, false),
    api_key_sincronizacion: optNullable(form.api_key_sincronizacion),
    sincronizacion_habilitada: bool(form.sincronizacion_habilitada, false),
    es_activo: 'es_activo' in form ? bool(form.es_activo, true) : undefined,
  };
}

const CREATE_BASELINE = normalizeClienteFormFields(CREATE_CLIENT_DEFAULT);

export function isCreateClienteDirty(form: ClienteCreate): boolean {
  const current = normalizeClienteFormFields(form);
  const { es_activo: _ignored, ...currentCreate } = current;
  return JSON.stringify(currentCreate) !== JSON.stringify(CREATE_BASELINE);
}

export function buildEditClienteFormSnapshot(cliente: Cliente): ClienteFormNormalized {
  return normalizeClienteFormFields({
    codigo_cliente: cliente.codigo_cliente,
    subdominio: cliente.subdominio,
    razon_social: cliente.razon_social,
    nombre_comercial: cliente.nombre_comercial,
    ruc: cliente.ruc,
    tipo_instalacion: cliente.tipo_instalacion,
    servidor_api_local: cliente.servidor_api_local,
    modo_autenticacion: cliente.modo_autenticacion,
    logo_url: cliente.logo_url,
    favicon_url: cliente.favicon_url,
    color_primario: cliente.color_primario,
    color_secundario: cliente.color_secundario,
    tema_personalizado: cliente.tema_personalizado,
    plan_suscripcion: cliente.plan_suscripcion,
    estado_suscripcion: cliente.estado_suscripcion,
    fecha_inicio_suscripcion: cliente.fecha_inicio_suscripcion,
    fecha_fin_trial: cliente.fecha_fin_trial,
    contacto_nombre: cliente.contacto_nombre,
    contacto_email: cliente.contacto_email,
    contacto_telefono: cliente.contacto_telefono,
    es_demo: cliente.es_demo,
    api_key_sincronizacion: cliente.api_key_sincronizacion,
    sincronizacion_habilitada: cliente.sincronizacion_habilitada,
    es_activo: cliente.es_activo,
  });
}

export function isEditClienteDirty(
  form: ClienteUpdate,
  snapshot: ClienteFormNormalized | null,
): boolean {
  if (!snapshot) return false;
  return JSON.stringify(normalizeClienteFormFields(form)) !== JSON.stringify(snapshot);
}
