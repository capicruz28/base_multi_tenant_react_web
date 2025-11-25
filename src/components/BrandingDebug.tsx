/**
 * Componente de debug para verificar el branding
 * Muestra el estado actual del branding y las variables CSS aplicadas
 * Útil para desarrollo y troubleshooting
 */
import { useBranding } from '../hooks/useBranding';
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
  const colorPrimaryRGB = rootStyles.getPropertyValue('--color-primary-rgb').trim();
  const colorSecondaryRGB = rootStyles.getPropertyValue('--color-secondary-rgb').trim();

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border-2 border-brand-primary rounded-lg shadow-lg p-4 z-50 max-w-sm">
      <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
        🎨 Branding Debug
      </h3>
      
      <div className="space-y-2 text-xs">
        <div>
          <strong>Cliente:</strong> {clienteInfo?.nombre || 'N/A'} ({clienteInfo?.id || 'N/A'})
        </div>
        
        <div>
          <strong>Estado:</strong>{' '}
          {loading ? (
            <span className="text-yellow-600">Cargando...</span>
          ) : error ? (
            <span className="text-red-600">Error: {error}</span>
          ) : branding ? (
            <span className="text-green-600">✅ Cargado</span>
          ) : (
            <span className="text-gray-500">No cargado</span>
          )}
        </div>

        {branding && (
          <>
            <div>
              <strong>Color Primario:</strong>{' '}
              <span 
                className="inline-block w-4 h-4 rounded border border-gray-300"
                style={{ backgroundColor: branding.color_primario }}
              />
              {' '}
              <code className="text-xs">{branding.color_primario}</code>
            </div>
            
            <div>
              <strong>Color Secundario:</strong>{' '}
              <span 
                className="inline-block w-4 h-4 rounded border border-gray-300"
                style={{ backgroundColor: branding.color_secundario }}
              />
              {' '}
              <code className="text-xs">{branding.color_secundario}</code>
            </div>

            <div>
              <strong>Logo URL:</strong>{' '}
              {branding.logo_url ? (
                <span className="text-green-600">✅ {branding.logo_url.substring(0, 30)}...</span>
              ) : (
                <span className="text-gray-500">No configurado</span>
              )}
            </div>

            <div>
              <strong>Favicon URL:</strong>{' '}
              {branding.favicon_url ? (
                <span className="text-green-600">✅ {branding.favicon_url.substring(0, 30)}...</span>
              ) : (
                <span className="text-gray-500">No configurado</span>
              )}
            </div>
          </>
        )}

        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <strong>CSS Variables:</strong>
          <div className="mt-1 space-y-1">
            <div>
              <code className="text-xs">--color-primary:</code>{' '}
              <span className="text-xs">{colorPrimary || 'No definido'}</span>
            </div>
            <div>
              <code className="text-xs">--color-primary-rgb:</code>{' '}
              <span className="text-xs">{colorPrimaryRGB || 'No definido'}</span>
            </div>
            <div>
              <code className="text-xs">--color-secondary:</code>{' '}
              <span className="text-xs">{colorSecondary || 'No definido'}</span>
            </div>
            <div>
              <code className="text-xs">--color-secondary-rgb:</code>{' '}
              <span className="text-xs">{colorSecondaryRGB || 'No definido'}</span>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <div 
              className="flex-1 h-8 rounded"
              style={{ backgroundColor: colorPrimary || '#1976D2' }}
              title="Color Primario"
            />
            <div 
              className="flex-1 h-8 rounded"
              style={{ backgroundColor: colorSecondary || '#424242' }}
              title="Color Secundario"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

