/**
 * Tipos del módulo WFL (Flujos de Trabajo).
 * Base: /api/v1/wfl
 */

export type TipoFlujo = 'aprobacion' | 'revision' | 'notificacion';

export interface FlujoTrabajoCreate {
  empresa_id: string;
  codigo_flujo: string;
  nombre: string;
  descripcion?: string;
  tipo_flujo: TipoFlujo;
  modulo_aplicable?: string;
  definicion_pasos?: string;
  es_activo?: boolean;
}

export interface FlujoTrabajoUpdate {
  codigo_flujo?: string;
  nombre?: string;
  descripcion?: string;
  tipo_flujo?: TipoFlujo | string;
  modulo_aplicable?: string;
  definicion_pasos?: string;
  es_activo?: boolean;
}

export interface FlujoTrabajoRead {
  flujo_id: string;
  cliente_id: string;
  empresa_id: string;
  codigo_flujo: string;
  nombre: string;
  descripcion?: string | null;
  tipo_flujo: string;
  modulo_aplicable?: string | null;
  definicion_pasos?: string | null;
  es_activo?: boolean;
  fecha_creacion: string;
}
