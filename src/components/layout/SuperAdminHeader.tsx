import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useUserType } from '../../hooks/useUserType';
import { useNavigate } from 'react-router-dom';
import { AccessLevel, UserType } from '../../types/auth.types';

/**
 * Header específico para Super Administradores
 * Muestra información global del sistema y controles de super admin
 */
const SuperAdminHeader: React.FC = () => {
  const { auth, logout, clienteInfo } = useAuth();
  const { 
    isSuperAdminUser, 
    userType, 
    accessLevel, 
    capabilities,
    hasMinimumAccessLevel 
  } = useUserType();
  const navigate = useNavigate();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleProfile = () => {
    // TODO: Implementar vista de perfil de super admin
    console.log('Abrir perfil de super admin');
    setIsDropdownOpen(false);
  };

  const handleSettings = () => {
    // TODO: Implementar configuración global
    console.log('Abrir configuración global');
    setIsDropdownOpen(false);
  };

  // Obtener etiqueta del tipo de usuario
  const getUserTypeLabel = (): string => {
    switch (userType) {
      case 'super_admin':
        return 'Super Administrador';
      case 'tenant_admin':
        return 'Administrador de Tenant';
      case 'user':
        return 'Usuario';
      default:
        return 'Usuario';
    }
  };

  // Obtener color del nivel de acceso
  const getAccessLevelColor = (level: number): string => {
    if (level >= AccessLevel.SUPER_ADMIN) return 'from-purple-500 to-pink-600';
    if (level >= AccessLevel.TENANT_ADMIN) return 'from-blue-500 to-blue-600';
    return 'from-gray-500 to-gray-600';
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Lado izquierdo - Información global */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 bg-gradient-to-r ${getAccessLevelColor(accessLevel)} rounded-lg flex items-center justify-center`}>
              <span className="text-white font-bold text-sm">SA</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Administración Global
              </h1>
              <p className="text-sm text-gray-500">
                Gestión Multi-Tenant del Sistema
              </p>
            </div>
          </div>
          
          {/* Badge de Super Admin */}
          <div className="flex items-center space-x-2">
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
              {getUserTypeLabel().toUpperCase()}
            </span>
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
              Nivel {accessLevel}
            </span>
            {capabilities.canManageUsers && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                Gestión Usuarios
              </span>
            )}
          </div>
        </div>

        {/* Lado derecho - Controles de usuario */}
        <div className="flex items-center space-x-4">
          {/* Estadísticas rápidas */}
          <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600">
            <div className="text-center">
              <div className="font-semibold text-gray-900">Sistema</div>
              <div className="text-xs">Global</div>
            </div>
            <div className="w-px h-6 bg-gray-300"></div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">Modo</div>
              <div className="text-xs text-green-600 font-medium">Activo</div>
            </div>
            <div className="w-px h-6 bg-gray-300"></div>
            <div className="text-center">
              <div className="font-semibold text-gray-900">Capacidades</div>
              <div className="text-xs text-blue-600 font-medium">
                {Object.values(capabilities).filter(Boolean).length}
              </div>
            </div>
          </div>

          {/* Separador */}
          <div className="w-px h-8 bg-gray-300"></div>

          {/* Dropdown de usuario */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-3 bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors duration-200 border border-gray-200"
            >
              {/* Avatar del usuario */}
              <div className={`w-8 h-8 bg-gradient-to-r ${getAccessLevelColor(accessLevel)} rounded-full flex items-center justify-center`}>
                <span className="text-white font-bold text-sm">
                  {auth.user?.nombre?.charAt(0)}{auth.user?.apellido?.charAt(0)}
                </span>
              </div>
              
              {/* Información del usuario */}
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium text-gray-900">
                  {auth.user?.nombre} {auth.user?.apellido}
                </div>
                <div className="text-xs text-gray-500">
                  {auth.user?.nombre_usuario}
                </div>
              </div>
              
              {/* Icono de dropdown */}
              <div className={`transform transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180' : ''
              }`}>
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Menú dropdown */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                {/* Header del dropdown */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="text-sm font-semibold text-gray-900">
                    {auth.user?.nombre} {auth.user?.apellido}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {auth.user?.correo}
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {getUserTypeLabel()}
                    </span>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      Nivel {accessLevel}
                    </span>
                  </div>
                  
                  {/* Capacidades del usuario */}
                  {Object.values(capabilities).some(Boolean) && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-500 mb-1">Capacidades:</div>
                      <div className="flex flex-wrap gap-1">
                        {capabilities.canAccessSuperAdmin && (
                          <span className="bg-purple-100 text-purple-800 text-xs px-1 py-0.5 rounded">Super Admin</span>
                        )}
                        {capabilities.canAccessTenantAdmin && (
                          <span className="bg-blue-100 text-blue-800 text-xs px-1 py-0.5 rounded">Tenant Admin</span>
                        )}
                        {capabilities.canManageUsers && (
                          <span className="bg-green-100 text-green-800 text-xs px-1 py-0.5 rounded">Gestión Usuarios</span>
                        )}
                        {capabilities.canManageRoles && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-1 py-0.5 rounded">Gestión Roles</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Opciones del dropdown */}
                <div className="py-2">
                  <button
                    onClick={handleProfile}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                  >
                    <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Mi Perfil
                  </button>
                  
                  <button
                    onClick={handleSettings}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                  >
                    <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Configuración Global
                  </button>
                </div>

                {/* Separador */}
                <div className="border-t border-gray-100"></div>

                {/* Opción de logout */}
                <div className="py-2">
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default SuperAdminHeader;