/**
 * Tipos para el módulo de costura
 * Tipos relacionados con eficiencia y producción de costura
 */

export interface EficienciaCosturaItem {
  codigo_trabajador: string;
  nombre_trabajador: string | null;
  orden_produccion: string;
  linea: string | null;
  fecha_proceso: string;
  minutos_producidos_total: number;
  minutos_disponibles_jornada: number;
  cantidad_prendas_producidas: number;
}


