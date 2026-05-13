/**
 * Servicio del módulo HCM (Planillas y RRHH).
 * Base URL: /api/v1/hcm
 */
import api from '@/core/api/api';
import type {
  Empleado,
  EmpleadoCreate,
  EmpleadoUpdate,
  Contrato,
  ContratoCreate,
  ContratoUpdate,
  ConceptoPlanilla,
  ConceptoPlanillaCreate,
  ConceptoPlanillaUpdate,
  Planilla,
  PlanillaCreate,
  PlanillaUpdate,
  PlanillaEmpleado,
  PlanillaEmpleadoCreate,
  PlanillaEmpleadoUpdate,
  PlanillaDetalle,
  PlanillaDetalleCreate,
  PlanillaDetalleUpdate,
  Asistencia,
  AsistenciaCreate,
  AsistenciaUpdate,
  Vacaciones,
  VacacionesCreate,
  VacacionesUpdate,
  Prestamo,
  PrestamoCreate,
  PrestamoUpdate,
} from '../types/hcm.types';

const BASE = '/hcm';

// ─── Empleados ───────────────────────────────────────────────────────────

export const empleadoService = {
  list: async (params?: {
    empresa_id?: string;
    estado_empleado?: string;
    es_activo?: boolean;
    departamento_id?: string;
    cargo_id?: string;
    buscar?: string;
  }): Promise<Empleado[]> => {
    const { data } = await api.get<Empleado[]>(`${BASE}/empleados`, { params });
    return Array.isArray(data) ? data : [];
  },

  getById: async (empleadoId: string): Promise<Empleado> => {
    const { data } = await api.get<Empleado>(`${BASE}/empleados/${empleadoId}`);
    return data;
  },

  create: async (payload: EmpleadoCreate): Promise<Empleado> => {
    const { data } = await api.post<Empleado>(`${BASE}/empleados`, payload);
    return data;
  },

  update: async (empleadoId: string, payload: EmpleadoUpdate): Promise<Empleado> => {
    const { data } = await api.put<Empleado>(`${BASE}/empleados/${empleadoId}`, payload);
    return data;
  },
};

// ─── Contratos ────────────────────────────────────────────────────────────

export const contratoService = {
  list: async (params?: {
    empresa_id?: string;
    empleado_id?: string;
    estado_contrato?: string;
    es_contrato_vigente?: boolean;
  }): Promise<Contrato[]> => {
    const { data } = await api.get<Contrato[]>(`${BASE}/contratos`, { params });
    return Array.isArray(data) ? data : [];
  },

  getById: async (contratoId: string): Promise<Contrato> => {
    const { data } = await api.get<Contrato>(`${BASE}/contratos/${contratoId}`);
    return data;
  },

  create: async (payload: ContratoCreate): Promise<Contrato> => {
    const { data } = await api.post<Contrato>(`${BASE}/contratos`, payload);
    return data;
  },

  update: async (contratoId: string, payload: ContratoUpdate): Promise<Contrato> => {
    const { data } = await api.put<Contrato>(`${BASE}/contratos/${contratoId}`, payload);
    return data;
  },
};

// ─── Conceptos Planilla ────────────────────────────────────────────────────

export const conceptoPlanillaService = {
  list: async (params?: {
    empresa_id?: string;
    tipo_concepto?: string;
    es_activo?: boolean;
    buscar?: string;
  }): Promise<ConceptoPlanilla[]> => {
    const { data } = await api.get<ConceptoPlanilla[]>(`${BASE}/conceptos-planilla`, { params });
    return Array.isArray(data) ? data : [];
  },

  getById: async (conceptoId: string): Promise<ConceptoPlanilla> => {
    const { data } = await api.get<ConceptoPlanilla>(`${BASE}/conceptos-planilla/${conceptoId}`);
    return data;
  },

  create: async (payload: ConceptoPlanillaCreate): Promise<ConceptoPlanilla> => {
    const { data } = await api.post<ConceptoPlanilla>(`${BASE}/conceptos-planilla`, payload);
    return data;
  },

  update: async (conceptoId: string, payload: ConceptoPlanillaUpdate): Promise<ConceptoPlanilla> => {
    const { data } = await api.put<ConceptoPlanilla>(`${BASE}/conceptos-planilla/${conceptoId}`, payload);
    return data;
  },
};

// ─── Planillas ────────────────────────────────────────────────────────────

export const planillaService = {
  list: async (params?: {
    empresa_id?: string;
    tipo_planilla?: string;
    estado?: string;
    año?: number;
    mes?: number;
  }): Promise<Planilla[]> => {
    const { data } = await api.get<Planilla[]>(`${BASE}/planillas`, { params });
    return Array.isArray(data) ? data : [];
  },

  getById: async (planillaId: string): Promise<Planilla> => {
    const { data } = await api.get<Planilla>(`${BASE}/planillas/${planillaId}`);
    return data;
  },

  create: async (payload: PlanillaCreate): Promise<Planilla> => {
    const { data } = await api.post<Planilla>(`${BASE}/planillas`, payload);
    return data;
  },

  update: async (planillaId: string, payload: PlanillaUpdate): Promise<Planilla> => {
    const { data } = await api.put<Planilla>(`${BASE}/planillas/${planillaId}`, payload);
    return data;
  },
};

// ─── Planilla Empleados ───────────────────────────────────────────────────

export const planillaEmpleadoService = {
  list: async (params?: { planilla_id?: string; empleado_id?: string }): Promise<PlanillaEmpleado[]> => {
    const { data } = await api.get<PlanillaEmpleado[]>(`${BASE}/planilla-empleados`, { params });
    return Array.isArray(data) ? data : [];
  },

  getById: async (planillaEmpleadoId: string): Promise<PlanillaEmpleado> => {
    const { data } = await api.get<PlanillaEmpleado>(`${BASE}/planilla-empleados/${planillaEmpleadoId}`);
    return data;
  },

  create: async (payload: PlanillaEmpleadoCreate): Promise<PlanillaEmpleado> => {
    const { data } = await api.post<PlanillaEmpleado>(`${BASE}/planilla-empleados`, payload);
    return data;
  },

  update: async (
    planillaEmpleadoId: string,
    payload: PlanillaEmpleadoUpdate
  ): Promise<PlanillaEmpleado> => {
    const { data } = await api.put<PlanillaEmpleado>(
      `${BASE}/planilla-empleados/${planillaEmpleadoId}`,
      payload
    );
    return data;
  },
};

// ─── Planilla Detalle ────────────────────────────────────────────────────

export const planillaDetalleService = {
  list: async (params?: {
    planilla_empleado_id?: string;
    tipo_concepto?: string;
  }): Promise<PlanillaDetalle[]> => {
    const { data } = await api.get<PlanillaDetalle[]>(`${BASE}/planilla-detalle`, { params });
    return Array.isArray(data) ? data : [];
  },

  getById: async (planillaDetalleId: string): Promise<PlanillaDetalle> => {
    const { data } = await api.get<PlanillaDetalle>(`${BASE}/planilla-detalle/${planillaDetalleId}`);
    return data;
  },

  create: async (payload: PlanillaDetalleCreate): Promise<PlanillaDetalle> => {
    const { data } = await api.post<PlanillaDetalle>(`${BASE}/planilla-detalle`, payload);
    return data;
  },

  update: async (
    planillaDetalleId: string,
    payload: PlanillaDetalleUpdate
  ): Promise<PlanillaDetalle> => {
    const { data } = await api.put<PlanillaDetalle>(
      `${BASE}/planilla-detalle/${planillaDetalleId}`,
      payload
    );
    return data;
  },
};

// ─── Asistencia ───────────────────────────────────────────────────────────

export const asistenciaService = {
  list: async (params?: {
    empresa_id?: string;
    empleado_id?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
    tipo_asistencia?: string;
  }): Promise<Asistencia[]> => {
    const { data } = await api.get<Asistencia[]>(`${BASE}/asistencia`, { params });
    return Array.isArray(data) ? data : [];
  },

  getById: async (asistenciaId: string): Promise<Asistencia> => {
    const { data } = await api.get<Asistencia>(`${BASE}/asistencia/${asistenciaId}`);
    return data;
  },

  create: async (payload: AsistenciaCreate): Promise<Asistencia> => {
    const { data } = await api.post<Asistencia>(`${BASE}/asistencia`, payload);
    return data;
  },

  update: async (asistenciaId: string, payload: AsistenciaUpdate): Promise<Asistencia> => {
    const { data } = await api.put<Asistencia>(`${BASE}/asistencia/${asistenciaId}`, payload);
    return data;
  },
};

// ─── Vacaciones ────────────────────────────────────────────────────────────

export const vacacionesService = {
  list: async (params?: {
    empresa_id?: string;
    empleado_id?: string;
    estado?: string;
    año_periodo?: number;
  }): Promise<Vacaciones[]> => {
    const { data } = await api.get<Vacaciones[]>(`${BASE}/vacaciones`, { params });
    return Array.isArray(data) ? data : [];
  },

  getById: async (vacacionesId: string): Promise<Vacaciones> => {
    const { data } = await api.get<Vacaciones>(`${BASE}/vacaciones/${vacacionesId}`);
    return data;
  },

  create: async (payload: VacacionesCreate): Promise<Vacaciones> => {
    const { data } = await api.post<Vacaciones>(`${BASE}/vacaciones`, payload);
    return data;
  },

  update: async (vacacionesId: string, payload: VacacionesUpdate): Promise<Vacaciones> => {
    const { data } = await api.put<Vacaciones>(`${BASE}/vacaciones/${vacacionesId}`, payload);
    return data;
  },
};

// ─── Préstamos ────────────────────────────────────────────────────────────

export const prestamoService = {
  list: async (params?: {
    empresa_id?: string;
    empleado_id?: string;
    estado?: string;
  }): Promise<Prestamo[]> => {
    const { data } = await api.get<Prestamo[]>(`${BASE}/prestamos`, { params });
    return Array.isArray(data) ? data : [];
  },

  getById: async (prestamoId: string): Promise<Prestamo> => {
    const { data } = await api.get<Prestamo>(`${BASE}/prestamos/${prestamoId}`);
    return data;
  },

  create: async (payload: PrestamoCreate): Promise<Prestamo> => {
    const { data } = await api.post<Prestamo>(`${BASE}/prestamos`, payload);
    return data;
  },

  update: async (prestamoId: string, payload: PrestamoUpdate): Promise<Prestamo> => {
    const { data } = await api.put<Prestamo>(`${BASE}/prestamos/${prestamoId}`, payload);
    return data;
  },
};
