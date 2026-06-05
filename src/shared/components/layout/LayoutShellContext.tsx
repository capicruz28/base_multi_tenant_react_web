import { createContext, useContext, type ReactNode } from 'react';
import type { LayoutShellVariant } from './layout-shell.types';

const LayoutShellContext = createContext<LayoutShellVariant | null>(null);

export function LayoutShellProvider({
  variant,
  children,
}: {
  variant: LayoutShellVariant;
  children: ReactNode;
}) {
  return (
    <LayoutShellContext.Provider value={variant}>{children}</LayoutShellContext.Provider>
  );
}

export function useLayoutShell(): LayoutShellVariant {
  const value = useContext(LayoutShellContext);
  if (!value) {
    throw new Error('useLayoutShell debe usarse dentro de LayoutShellProvider (App/Admin/SuperAdmin layout)');
  }
  return value;
}

export function useLayoutShellOptional(): LayoutShellVariant | null {
  return useContext(LayoutShellContext);
}
