/**
 * Tipos de planes de suscripción
 * 
 * Basado en la tabla cliente de la BD:
 * - trial: Periodo de prueba
 * - basico: Plan básico
 * - profesional: Plan profesional
 * - enterprise: Plan empresarial
 */
export enum SubscriptionPlan {
  TRIAL = 'trial',
  BASIC = 'basico',
  PROFESSIONAL = 'profesional',
  ENTERPRISE = 'enterprise',
}

/**
 * Estados de suscripción
 * 
 * Basado en la tabla cliente de la BD:
 * - trial: En periodo de prueba
 * - activo: Suscripción activa
 * - suspendido: Suscripción suspendida
 * - cancelado: Suscripción cancelada
 * - moroso: Cliente moroso
 */
export enum SubscriptionStatus {
  TRIAL = 'trial',
  ACTIVE = 'activo',
  SUSPENDED = 'suspendido',
  CANCELLED = 'cancelado',
  OVERDUE = 'moroso',
}

/**
 * Valida si un string es un plan de suscripción válido
 */
export const isValidSubscriptionPlan = (value: string): value is SubscriptionPlan => {
  return Object.values(SubscriptionPlan).includes(value as SubscriptionPlan);
};

/**
 * Valida si un string es un estado de suscripción válido
 */
export const isValidSubscriptionStatus = (value: string): value is SubscriptionStatus => {
  return Object.values(SubscriptionStatus).includes(value as SubscriptionStatus);
};

/**
 * Obtiene el label legible para un plan de suscripción
 */
export const getSubscriptionPlanLabel = (plan: SubscriptionPlan): string => {
  const labels: Record<SubscriptionPlan, string> = {
    [SubscriptionPlan.TRIAL]: 'Prueba',
    [SubscriptionPlan.BASIC]: 'Básico',
    [SubscriptionPlan.PROFESSIONAL]: 'Profesional',
    [SubscriptionPlan.ENTERPRISE]: 'Empresarial',
  };
  return labels[plan] || plan;
};

/**
 * Obtiene el label legible para un estado de suscripción
 */
export const getSubscriptionStatusLabel = (status: SubscriptionStatus): string => {
  const labels: Record<SubscriptionStatus, string> = {
    [SubscriptionStatus.TRIAL]: 'Prueba',
    [SubscriptionStatus.ACTIVE]: 'Activo',
    [SubscriptionStatus.SUSPENDED]: 'Suspendido',
    [SubscriptionStatus.CANCELLED]: 'Cancelado',
    [SubscriptionStatus.OVERDUE]: 'Moroso',
  };
  return labels[status] || status;
};

