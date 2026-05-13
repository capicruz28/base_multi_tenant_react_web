import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/shared/context/ThemeContext';
import { NavModeProvider } from '@/shared/context/NavModeContext';
import { AuthProvider } from '@/shared/context/AuthContext';
import { AuthGate } from '@/core/auth/AuthGate';
import { PermissionProvider } from '@/core/auth/PermissionContext';
import { useAuth } from '@/shared/context/AuthContext';
import { usePermission } from '@/core/auth/PermissionContext';
import { TenantProvider } from '@/features/tenant/components/TenantContext';
import { BrandingInitializer } from '@/shared/components/BrandingInitializer';
import LoadingSpinner from '@/shared/components/LoadingSpinner';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Configuración de React Query con invalidación por tenant
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos - datos frescos por defecto
      gcTime: 10 * 60 * 1000, // 10 minutos - tiempo de garbage collection (antes cacheTime)
      retry: 1, // Reintentar 1 vez en caso de error
      refetchOnWindowFocus: false, // No refetch automático al enfocar ventana
    },
    mutations: {
      retry: 0, // No reintentar mutaciones
    },
  },
});

function AppReadyGate({ children }: { children: ReactNode }) {
  const { loading: authLoading } = useAuth();
  const { loading: permissionLoading } = usePermission();

  const appReady = !authLoading && !permissionLoading;

  if (!appReady) {
    return <LoadingSpinner fullScreen message="Inicializando sesión..." />;
  }

  return <>{children}</>;
}

// Orden exacto para evitar reinicialización: Auth → Tenant → Permission.
// Sin keys en estos providers para que no se desmonten al cambiar estado.
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AuthGate>
            <TenantProvider>
              <PermissionProvider>
                <AppReadyGate>
                  <BrandingInitializer />
                  <DndProvider backend={HTML5Backend}>
                    <NavModeProvider>
                      {children}
                    </NavModeProvider>
                  </DndProvider>
                </AppReadyGate>
              </PermissionProvider>
            </TenantProvider>
          </AuthGate>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

