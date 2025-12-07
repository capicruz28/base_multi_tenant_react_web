import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/shared/context/ThemeContext';
import { AuthProvider } from '@/shared/context/AuthContext';
import { TenantProvider } from '@/features/tenant/components/TenantContext';
import { BrandingInitializer } from '@/shared/components/BrandingInitializer';
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

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TenantProvider>
            <BrandingInitializer />
            <DndProvider backend={HTML5Backend}>
              {children}
            </DndProvider>
          </TenantProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

