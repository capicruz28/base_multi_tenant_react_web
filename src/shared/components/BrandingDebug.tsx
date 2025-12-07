/**
 * Componente de debug para verificar el branding
 * Muestra el estado actual del branding y las variables CSS aplicadas
 * Útil para desarrollo y troubleshooting
 */
import React from 'react';
import { useBranding } from '@/features/tenant/hooks/useBranding';
import { useAuth } from '../context/AuthContext';

export const BrandingDebug: React.FC = () => {
  const { branding, loading, error } = useBranding();
  const { clienteInfo } = useAuth();

  // Solo mostrar en desarrollo
  if (import.meta.env.PROD) {
    return null;
  }

  const rootStyles = getComputedStyle(document.documentElement);
  const colorPrimary = rootStyles.getPropertyValue('--color-primary').trim();
  const colorSecondary = rootStyles.getPropertyValue('--color-secondary').trim();
  const logoUrl = rootStyles.getPropertyValue('--logo-url').trim();

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4 shadow-lg z-50 max-w-md text-xs">
      <h3 className="font-bold mb-2 text-sm">🎨 Branding Debug</h3>
      
      <div className="space-y-1">
        <div>
          <strong>Estado:</strong>{' '}
          {loading ? '⏳ Cargando...' : error ? '❌ Error' : '✅ Cargado'}
        </div>
        
        {error && (
          <div className="text-red-600 dark:text-red-400">
            <strong>Error:</strong> {typeof error === 'string' ? error : 'Error desconocido'}
          </div>
        )}
        
        {branding && (
          <>
            <div>
              <strong>Logo URL:</strong>{' '}
              {branding.logo_url ? (
                <a href={branding.logo_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  Ver
                </a>
              ) : (
                'N/A'
              )}
            </div>
            <div>
              <strong>Color Primario:</strong>{' '}
              <span
                className="inline-block w-4 h-4 rounded border border-gray-300"
                style={{ backgroundColor: branding.color_primario || '#000' }}
              />{' '}
              {branding.color_primario || 'N/A'}
            </div>
            <div>
              <strong>Color Secundario:</strong>{' '}
              <span
                className="inline-block w-4 h-4 rounded border border-gray-300"
                style={{ backgroundColor: branding.color_secundario || '#000' }}
              />{' '}
              {branding.color_secundario || 'N/A'}
            </div>
          </>
        )}
        
        <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
          <strong>CSS Variables:</strong>
          <div className="mt-1 space-y-0.5">
            <div>
              <code>--color-primary:</code> {colorPrimary || 'N/A'}
            </div>
            <div>
              <code>--color-secondary:</code> {colorSecondary || 'N/A'}
            </div>
            <div>
              <code>--logo-url:</code> {logoUrl || 'N/A'}
            </div>
          </div>
        </div>
        
        {clienteInfo && (
          <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
            <strong>Cliente Info:</strong>
            <div className="mt-1">
              <div>ID: {clienteInfo.cliente_id}</div>
              <div>Nombre: {clienteInfo.razon_social || clienteInfo.nombre_comercial || 'N/A'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

