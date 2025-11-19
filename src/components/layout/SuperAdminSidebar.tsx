import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMenuItemsByUserType } from './MenuSelector';
import { useUserType } from '../../hooks/useUserType';

/**
 * Sidebar específico para Super Administradores
 * Diseño diferenciado con branding de administración global
 */
const SuperAdminSidebar: React.FC = () => {
  const location = useLocation();
  const { isSuperAdminUser, capabilities } = useUserType();
  const { auth } = useAuth();

  // Obtener items del menú para Super Admin
  const menuItems = getMenuItemsByUserType(isSuperAdminUser, false);

  return (
    <div className="w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white flex flex-col shadow-xl">
      {/* Header del Sidebar */}
      <div className="p-6 border-b border-blue-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">SA</span>
          </div>
          <div>
            <h1 className="text-lg font-bold">Sistema Multi-Tenant</h1>
            <div className="flex items-center space-x-1 mt-1">
              <span className="text-xs bg-blue-600 px-2 py-1 rounded-full font-medium">
                SUPER ADMIN
              </span>
            </div>
          </div>
        </div>
        
        {/* Información del usuario */}
        {auth.user && (
          <div className="mt-4 pt-4 border-t border-blue-700">
            <p className="text-sm font-medium truncate">
              {auth.user.nombre} {auth.user.apellido}
            </p>
            <p className="text-xs text-blue-200 truncate">
              {auth.user.nombre_usuario}
            </p>
          </div>
        )}
      </div>
      
      {/* Navegación */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => {
            // Si es un separador, renderizar línea divisoria
            if (item.isSeparator) {
              return (
                <div 
                  key={item.menu_id}
                  className="my-4 border-t border-blue-700"
                />
              );
            }

            // Si es un ítem de menú normal
            const isActive = location.pathname === item.ruta || 
                            (item.ruta && location.pathname.startsWith(item.ruta));
            
            return (
              <Link
                key={item.menu_id}
                to={item.ruta || '#'}
                className={`flex items-center px-3 py-3 rounded-lg text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                    : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                } ${!item.ruta ? 'cursor-default' : ''}`}
              >
                {/* Icono */}
                {item.icono && (
                  <div className={`mr-3 ${
                    isActive ? 'text-white' : 'text-blue-300'
                  }`}>
                    <i className={`icon-${item.icono} text-lg`}></i>
                  </div>
                )}
                
                {/* Texto */}
                <span className="font-medium flex-1">
                  {item.nombre}
                </span>
                
                {/* Indicador de actividad */}
                {isActive && (
                  <div className="w-2 h-2 bg-white rounded-full ml-2"></div>
                )}
              </Link>
            );
          })}
        </div>
        
        {/* Información adicional */}
        <div className="mt-8 p-4 bg-blue-800 rounded-lg">
          <div className="text-xs text-blue-200">
            <div className="flex justify-between mb-1">
              <span>Nivel de Acceso:</span>
              <span className="font-bold text-white">5</span>
            </div>
            <div className="flex justify-between">
              <span>Modo:</span>
              <span className="font-bold text-green-300">Global</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>Capacidades:</span>
              <span className="font-bold text-yellow-300">
                {Object.values(capabilities).filter(Boolean).length}
              </span>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Footer del Sidebar */}
      <div className="p-4 border-t border-blue-700">
        <div className="text-xs text-blue-300 text-center">
          Sistema Multi-Tenant v2.0
        </div>
      </div>
    </div>
  );
};

export default SuperAdminSidebar;