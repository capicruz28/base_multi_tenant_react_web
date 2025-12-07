// src/core/api/api.ts
/**
 * Instancia de Axios para servidor central
 * 
 * ⚠️ IMPORTANTE: Esta instancia se usa principalmente para endpoints de autenticación
 * que siempre van al servidor central (login, refresh, logout).
 * 
 * Para otros endpoints que pueden ir a servidor local (on-premise/hybrid),
 * usar el hook useApi() en componentes o getApiInstance() en servicios.
 */
import { apiCentral } from './axios-instances';

// Exportar apiCentral como 'api' por defecto para compatibilidad
// Los endpoints de auth siempre usan esta instancia
export default apiCentral;
