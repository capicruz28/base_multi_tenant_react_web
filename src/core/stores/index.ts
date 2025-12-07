/**
 * Core Stores - Exportaciones centralizadas
 * 
 * Este módulo exporta todos los servicios relacionados con stores:
 * - StoreRegistry: Sistema de registro y reset de stores
 * - TenantStoreSync: Sincronización de tenant entre pestañas
 */
export { storeRegistry, type StoreResetFunction } from './store-registry';
export { tenantStoreSync } from './tenant-store-sync';


