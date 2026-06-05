// src/shared/components/layout/Header.tsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import GlobalSearch from './GlobalSearch';
import { useAuth } from '../../context/AuthContext';
import { useBreadcrumb } from '../../context/BreadcrumbContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavMode } from '../../context/NavModeContext';
import { User, Mail, Settings, LogOut, ChevronDown, ChevronRight, Home, Shield, Building2, Crown, Sun, Moon, PanelLeft, PanelTop } from 'lucide-react';
import useUserType from '../../../core/hooks/useUserType';
import { useLayoutShell } from './LayoutShellContext';
import { SHELL_HOME_PATH } from './layout-shell.types';
import { useAdminMenuItems } from './MenuSelector';
import { useShellBreadcrumbs } from './useShellBreadcrumbs';
import EmpresaSelector from './EmpresaSelector';
import ShellCrossNav from './ShellCrossNav';

const Header = () => {
  const shell = useLayoutShell();
  const { auth, logout, menuModulos } = useAuth();
  const { breadcrumbs, setBreadcrumbs } = useBreadcrumb();
  const { items: adminMenuItems } = useAdminMenuItems();
  const location = useLocation();
  const shellBreadcrumbs = useShellBreadcrumbs(
    menuModulos,
    shell,
    location.pathname,
    adminMenuItems,
  );
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { navMode, toggleNavMode } = useNavMode();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // ✅ CORREGIDO: Eliminadas variables no utilizadas
  const { 
    isSuperAdminUser, 
    isTenantAdminUser, 
    accessLevel, 
    clienteInfo 
  } = useUserType();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Única fuente de breadcrumbs (sidebar y navbar)
  useEffect(() => {
    setBreadcrumbs(shellBreadcrumbs);
  }, [shellBreadcrumbs, setBreadcrumbs]);

  const getInitials = () => {
    if (auth.user?.nombre && auth.user?.apellido) {
      return `${auth.user.nombre.charAt(0)}${auth.user.apellido.charAt(0)}`;
    }
    return 'U';
  };

  const handleBreadcrumbClick = (ruta?: string | null) => {
    if (ruta && ruta !== '#' && ruta !== null) {
      const normalizedPath = ruta.startsWith('/') ? ruta : `/${ruta}`;
      navigate(normalizedPath);
    }
  };

  // ✅ NUEVO: Obtener badge de tipo de usuario (usando tokens de branding)
  const getUserTypeBadge = () => {
    if (isSuperAdminUser) {
      return {
        text: 'ADMINISTRADOR GLOBAL',
        icon: Crown,
        color: 'bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20 dark:text-brand-primary',
        iconColor: 'text-brand-primary dark:text-brand-primary'
      };
    }
    if (isTenantAdminUser) {
      return {
        text: clienteInfo?.razon_social || clienteInfo?.nombre_comercial || 'ADMINISTRADOR',
        icon: Building2,
        color: 'bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20 dark:text-brand-primary',
        iconColor: 'text-brand-primary dark:text-brand-primary'
      };
    }
    return {
      text: 'USUARIO',
      icon: User,
      color: 'bg-brand-secondary/10 text-brand-secondary dark:bg-brand-secondary/20 dark:text-brand-secondary',
      iconColor: 'text-brand-secondary dark:text-brand-secondary'
    };
  };

  const userBadge = getUserTypeBadge();
  const BadgeIcon = userBadge.icon;

  return (
    <header className="bg-brand-surface shadow-sm h-16 flex-shrink-0 w-full border-b border-brand-border"> 
      <div className="h-full px-4 flex items-center relative">

        {/* Izquierda: Breadcrumb */}
        <div className="flex items-center space-x-2 flex-1 min-w-0 mr-2">
          {breadcrumbs.length > 0 ? (
            <nav className="flex items-center space-x-2 text-sm overflow-x-auto">
              {/* Home Icon */}
              <button
                onClick={() => navigate(SHELL_HOME_PATH[shell])}
                className="flex items-center text-brand-text-secondary hover:text-brand-primary transition-colors flex-shrink-0"
                title="Inicio"
              >
                <Home className="w-4 h-4" />
              </button>
              
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                const hasRoute = crumb.ruta && crumb.ruta !== '#';
                
                return (
                  <div key={index} className="flex items-center space-x-2 flex-shrink-0">
                    <ChevronRight className="w-4 h-4 text-brand-text-secondary" />
                    
                    {hasRoute && !isLast ? (
                      <button
                        onClick={() => handleBreadcrumbClick(crumb.ruta)}
                        className="text-brand-text-secondary hover:text-brand-primary transition-colors font-medium truncate max-w-xs"
                        title={crumb.nombre}
                      >
                        {crumb.nombre}
                      </button>
                    ) : (
                      <span 
                        className={`truncate max-w-xs ${
                          isLast 
                            ? 'text-brand-primary dark:text-brand-primary font-semibold' 
                            : 'text-brand-text-secondary'
                        }`}
                        title={crumb.nombre}
                      >
                        {crumb.nombre}
                      </span>
                    )}
                  </div>
                );
              })}
            </nav>
          ) : (
            <div className="flex items-center space-x-2">
              <Home className="w-5 h-5 text-brand-primary dark:text-brand-primary" />
              <span className="text-lg font-semibold text-brand-text-primary">
                Dashboard
              </span>
            </div>
          )}
        </div>


        {/* Centro: Buscador global (absolutamente centrado) */}
        <div className="absolute left-1/2 -translate-x-1/2 flex-shrink-0 hidden sm:block">
          <GlobalSearch />
        </div>

        {/* Derecha: empresa + cross-shell (tenant_admin) + botones + avatar */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
          {isTenantAdminUser && (shell === 'app' || shell === 'admin') && (
            <ShellCrossNav shell={shell} menuModulos={menuModulos} />
          )}
          {!isSuperAdminUser &&
            (shell === 'app' || (shell === 'admin' && isTenantAdminUser)) && (
              <EmpresaSelector />
            )}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg text-brand-text-secondary hover:bg-overlay transition-colors"
            title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {isDarkMode
              ? <Sun className="w-5 h-5 text-yellow-500" />
              : <Moon className="w-5 h-5" />
            }
          </button>
          <button
            onClick={toggleNavMode}
            className="p-2 rounded-lg text-brand-text-secondary hover:bg-overlay transition-colors"
            title={navMode === 'sidebar' ? 'Cambiar a vista navbar' : 'Cambiar a vista sidebar'}
          >
            {navMode === 'sidebar'
              ? <PanelTop className="w-5 h-5" />
              : <PanelLeft className="w-5 h-5" />
            }
          </button>
        </div>

        {/* User Menu Section */}
        <div className="relative ml-4 flex-shrink-0" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-overlay transition-colors"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-primary text-white font-semibold text-sm">
              {getInitials()}
            </div>
            <span className="text-sm font-medium text-brand-text-primary hidden sm:inline">
              {auth.user?.nombre}
            </span>
            <ChevronDown className={`w-4 h-4 text-brand-text-secondary transition-transform ${isMenuOpen ? 'rotate-180' : 'rotate-0'}`} />
          </button>
          
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 origin-top-right bg-brand-surface border border-brand-border rounded-md shadow-lg py-1 z-50">
              
              {/* ✅ NUEVO: Información de usuario y tipo */}
              <div className="px-4 py-3 border-b border-brand-border">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-primary text-white font-semibold text-sm">
                    {getInitials()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-text-primary truncate">
                      {auth.user?.nombre} {auth.user?.apellido}
                    </p>
                    <p className="text-xs text-brand-text-secondary truncate">
                      {auth.user?.correo}
                    </p>
                    <div className="flex items-center space-x-1 mt-1">
                      <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium ${userBadge.color}`}>
                        <BadgeIcon className={`w-3 h-3 ${userBadge.iconColor}`} />
                        <span>{userBadge.text}</span>
                      </div>
                      {accessLevel > 0 && (
                        <div className="bg-brand-surface-secondary text-brand-text-secondary px-2 py-0.5 rounded-full text-xs font-medium">
                          Nivel {accessLevel}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ✅ NUEVO: Información del cliente para tenant admin */}
              {clienteInfo && (
                <div className="px-4 py-2 border-b border-brand-border">
                  <div className="flex items-center space-x-2 text-xs text-brand-text-secondary">
                    <Building2 className="w-3 h-3" />
                    <span className="truncate" title={clienteInfo.razon_social || clienteInfo.nombre_comercial || ''}>
                      {clienteInfo.razon_social || clienteInfo.nombre_comercial || 'Cliente'}
                    </span>
                  </div>
                  <div className="text-xs text-brand-text-secondary mt-1">
                    Subdominio: {clienteInfo.subdominio}
                  </div>
                </div>
              )}

              {/* Menú de opciones */}
              <button
                className="w-full px-4 py-2 text-sm text-left text-brand-text-primary hover:bg-overlay flex items-center"
              >
                <User className="w-4 h-4 mr-3" />
                Mi perfil
              </button>

              <button
                className="w-full px-4 py-2 text-sm text-left text-brand-text-primary hover:bg-overlay flex items-center"
              >
                <Mail className="w-4 h-4 mr-3" />
                Bandeja de entrada
              </button>

              <button
                className="w-full px-4 py-2 text-sm text-left text-brand-text-primary hover:bg-overlay flex items-center"
              >
                <Settings className="w-4 h-4 mr-3" />
                Configuraciones de la cuenta
              </button>

              {/* ✅ NUEVO: Enlace rápido a administración según tipo de usuario */}
              {shell === 'super-admin' && isSuperAdminUser && (
                <>
                  <div className="border-t border-brand-border my-1"></div>
                  <button
                    onClick={() => {
                      navigate('/super-admin/clientes');
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-sm text-left text-brand-primary dark:text-brand-primary hover:bg-brand-primary/10 dark:hover:bg-brand-primary/20 flex items-center"
                  >
                    <Shield className="w-4 h-4 mr-3" />
                    Administración Global
                  </button>
                </>
              )}

              <div className="border-t border-brand-border my-1"></div>

              <button
                onClick={logout}
                className="w-full px-4 py-2 text-sm text-left text-error hover:bg-error/10 flex items-center"
                  >
                <LogOut className="w-4 h-4 mr-3" />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

