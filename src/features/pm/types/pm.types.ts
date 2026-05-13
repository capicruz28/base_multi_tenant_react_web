/**
 * Tipos del módulo PM (Gestión de Proyectos).
 * Base: /api/v1/pm
 */

export type EstadoProyecto = 'planificado' | 'en_curso' | 'pausado' | 'completado' | 'cancelado';

export interface Proyecto {
  proyecto_id: string;
  cliente_id: string;
  empresa_id: string;
  codigo_proyecto: string;
  nombre: string;
  descripcion?: string | null;
  cliente_venta_id?: string | null;
  fecha_inicio?: string | null;
  fecha_fin_estimada?: string | null;
  fecha_fin_real?: string | null;
  presupuesto?: number | null;
  costo_real?: number | null;
  responsable_usuario_id?: string | null;
  estado?: string | null;
  fecha_creacion?: string | null;
}

export interface ProyectoCreate {
  empresa_id: string;
  codigo_proyecto: string;
  nombre: string;
  descripcion?: string;
  cliente_venta_id?: string;
  fecha_inicio: string;
  fecha_fin_estimada?: string;
  fecha_fin_real?: string;
  presupuesto?: number;
  costo_real?: number;
  responsable_usuario_id?: string;
  estado?: EstadoProyecto;
}

export interface ProyectoUpdate {
  codigo_proyecto?: string;
  nombre?: string;
  descripcion?: string;
  cliente_venta_id?: string;
  fecha_inicio?: string;
  fecha_fin_estimada?: string;
  fecha_fin_real?: string;
  presupuesto?: number;
  costo_real?: number;
  responsable_usuario_id?: string;
  estado?: string;
}
