// src/shared/components/layout/Header.tsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useBreadcrumb } from '../../context/BreadcrumbContext';
import { User, Mail, Settings, LogOut, ChevronDown, ChevronRight, Home, Shield, Building2, Crown } from 'lucide-react';
import useUserType from '../../../core/hooks/useUserType';

const Header = () => {
  const { auth, logout } = useAuth();
  const { breadcrumbs } = useBreadcrumb();
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
    <header className="bg-white dark:bg-gray-800 shadow-sm h-16 flex-shrink-0 w-full border-b border-gray-200 dark:border-gray-700"> 
      <div className="h-full px-4 flex justify-between items-center">
        
        {/* Breadcrumb Section */}
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {breadcrumbs.length > 0 ? (
            <nav className="flex items-center space-x-2 text-sm overflow-x-auto">
              {/* Home Icon */}
              <button
                onClick={() => navigate('/')}
                className="flex items-center text-gray-500 hover:text-brand-primary dark:text-gray-400 dark:hover:text-brand-primary transition-colors flex-shrink-0"
                title="Inicio"
              >
                <Home className="w-4 h-4" />
              </button>
              
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                const hasRoute = crumb.ruta && crumb.ruta !== '#';
                
                return (
                  <div key={index} className="flex items-center space-x-2 flex-shrink-0">
                    <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    
                    {hasRoute && !isLast ? (
                      <button
                        onClick={() => handleBreadcrumbClick(crumb.ruta)}
                        className="text-gray-600 hover:text-brand-primary dark:text-gray-300 dark:hover:text-brand-primary transition-colors font-medium truncate max-w-xs"
                        title={crumb.nombre}
                      >
                        {crumb.nombre}
                      </button>
                    ) : (
                      <span 
                        className={`truncate max-w-xs ${
                          isLast 
                            ? 'text-brand-primary dark:text-brand-primary font-semibold' 
                            : 'text-gray-500 dark:text-gray-400'
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
              <span className="text-lg font-semibold text-gray-800 dark:text-white">
                Dashboard
              </span>
            </div>
          )}
        </div>

        {/* ✅ NUEVO: Badge de tipo de usuario (solo en desktop) */}
        {!isMenuOpen && (
          <div className="hidden md:flex items-center mr-4">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold ${userBadge.color}`}>
              <BadgeIcon className={`w-3 h-3 ${userBadge.iconColor}`} />
              <span className="truncate max-w-32">{userBadge.text}</span>
            </div>
          </div>
        )}

        {/* User Menu Section */}
        <div className="relative ml-4 flex-shrink-0" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-primary text-white font-semibold text-sm">
              {getInitials()}
            </div>
            <span className="text-sm font-medium text-gray-800 dark:text-white hidden sm:inline">
              {auth.user?.nombre}
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isMenuOpen ? 'rotate-180' : 'rotate-0'}`} />
          </button>
          
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 origin-top-right bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-1 z-50">
              
              {/* ✅ NUEVO: Información de usuario y tipo */}
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-primary text-white font-semibold text-sm">
                    {getInitials()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {auth.user?.nombre} {auth.user?.apellido}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {auth.user?.correo}
                    </p>
                    <div className="flex items-center space-x-1 mt-1">
                      <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium ${userBadge.color}`}>
                        <BadgeIcon className={`w-3 h-3 ${userBadge.iconColor}`} />
                        <span>{userBadge.text}</span>
                      </div>
                      {accessLevel > 0 && (
                        <div className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs font-medium">
                          Nivel {accessLevel}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ✅ NUEVO: Información del cliente para tenant admin */}
              {clienteInfo && (
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                    <Building2 className="w-3 h-3" />
                    <span className="truncate" title={clienteInfo.razon_social || clienteInfo.nombre_comercial || ''}>
                      {clienteInfo.razon_social || clienteInfo.nombre_comercial || 'Cliente'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Subdominio: {clienteInfo.subdominio}
                  </div>
                </div>
              )}

              {/* Menú de opciones */}
              <button
                className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
              >
                <User className="w-4 h-4 mr-3" />
                Mi perfil
              </button>

              <button
                className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
              >
                <Mail className="w-4 h-4 mr-3" />
                Bandeja de entrada
              </button>

              <button
                className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
              >
                <Settings className="w-4 h-4 mr-3" />
                Configuraciones de la cuenta
              </button>

              {/* ✅ NUEVO: Enlace rápido a administración según tipo de usuario */}
              {(isSuperAdminUser || isTenantAdminUser) && (
                <>
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                  <button
                    onClick={() => {
                      if (isSuperAdminUser) {
                        navigate('/super-admin/clientes');
                      } else {
                        navigate('/admin/usuarios');
                      }
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-sm text-left text-brand-primary dark:text-brand-primary hover:bg-brand-primary/10 dark:hover:bg-brand-primary/20 flex items-center"
                  >
                    <Shield className="w-4 h-4 mr-3" />
                    {isSuperAdminUser ? 'Administración Global' : 'Administración del Tenant'}
                  </button>
                </>
              )}

              <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

              <button
                onClick={logout}
                className="w-full px-4 py-2 text-sm text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center"
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

