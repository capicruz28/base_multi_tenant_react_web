import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storeRegistry, StoreResetFunction } from '../store-registry';

describe('StoreRegistry', () => {
  beforeEach(() => {
    // Limpiar el registry antes de cada test
    const registeredStores = storeRegistry.getRegisteredStores();
    registeredStores.forEach(name => storeRegistry.unregister(name));
    storeRegistry.clearHistory();
  });

  it('should register a store', () => {
    const resetFn: StoreResetFunction = vi.fn();
    
    storeRegistry.register('test-store', resetFn, 'Test store');
    
    expect(storeRegistry.isRegistered('test-store')).toBe(true);
    expect(storeRegistry.getCount()).toBe(1);
  });

  it('should unregister a store', () => {
    const resetFn: StoreResetFunction = vi.fn();
    
    storeRegistry.register('test-store', resetFn);
    storeRegistry.unregister('test-store');
    
    expect(storeRegistry.isRegistered('test-store')).toBe(false);
    expect(storeRegistry.getCount()).toBe(0);
  });

  it('should reset a specific store', () => {
    const resetFn: StoreResetFunction = vi.fn();
    
    storeRegistry.register('test-store', resetFn);
    storeRegistry.reset('test-store', 'tenant-1');
    
    expect(resetFn).toHaveBeenCalledWith('tenant-1');
  });

  it('should reset all stores', () => {
    const resetFn1: StoreResetFunction = vi.fn();
    const resetFn2: StoreResetFunction = vi.fn();
    
    storeRegistry.register('store-1', resetFn1);
    storeRegistry.register('store-2', resetFn2);
    
    storeRegistry.resetAll('tenant-1');
    
    expect(resetFn1).toHaveBeenCalledWith('tenant-1');
    expect(resetFn2).toHaveBeenCalledWith('tenant-1');
  });

  it('should track reset history', () => {
    const resetFn: StoreResetFunction = vi.fn();
    
    storeRegistry.register('test-store', resetFn);
    storeRegistry.resetAll('tenant-1');
    
    const history = storeRegistry.getResetHistory();
    expect(history.length).toBeGreaterThan(0);
    expect(history[history.length - 1].tenantId).toBe('tenant-1');
  });

  it('should warn when registering duplicate store', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const resetFn: StoreResetFunction = vi.fn();
    
    storeRegistry.register('test-store', resetFn);
    storeRegistry.register('test-store', resetFn);
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('ya está registrado')
    );
    
    consoleSpy.mockRestore();
  });

  it('should clear all stores', () => {
    const resetFn: StoreResetFunction = vi.fn();
    
    storeRegistry.register('test-store', resetFn);
    storeRegistry.clearAll();
    
    expect(resetFn).toHaveBeenCalledWith(null);
  });
});
