import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Boxes, Shield } from 'lucide-react';
import type { AuthMenuModulo } from '@/core/auth/types/auth-menu.types';
import { findFirstRouteWithPrefix } from '@/core/routing/resolve-post-login-from-menu';
import { SHELL_HOME_PATH } from './layout-shell.types';
import type { LayoutShellVariant } from './layout-shell.types';

interface ShellCrossNavProps {
  shell: LayoutShellVariant;
  menuModulos: AuthMenuModulo[] | null;
}

/**
 * Acceso rápido entre shells para tenant_admin (sin fusionar sidebars).
 * Destinos desde GET /auth/menu (primer ítem visible por prefijo).
 */
const ShellCrossNav: React.FC<ShellCrossNavProps> = ({ shell, menuModulos }) => {
  const navigate = useNavigate();

  const { target, label, Icon } = useMemo(() => {
    if (shell === 'app') {
      const adminRoute =
        findFirstRouteWithPrefix(menuModulos, '/admin') ?? SHELL_HOME_PATH.admin;
      return {
        target: adminRoute,
        label: 'Administración',
        Icon: Shield,
      };
    }
    if (shell === 'admin') {
      const appRoute =
        findFirstRouteWithPrefix(menuModulos, '/app') ?? SHELL_HOME_PATH.app;
      return {
        target: appRoute,
        label: 'Módulos',
        Icon: Boxes,
      };
    }
    return null;
  }, [shell, menuModulos]);

  if (!target || !label || !Icon) return null;

  return (
    <button
      type="button"
      onClick={() => navigate(target)}
      className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-border bg-brand-surface-secondary text-sm font-medium text-brand-text-primary hover:bg-overlay hover:text-brand-primary transition-colors flex-shrink-0"
      title={
        shell === 'app'
          ? 'Ir al panel de administración del tenant'
          : 'Ir al panel de módulos ERP'
      }
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span>{label}</span>
    </button>
  );
};

export default ShellCrossNav;
