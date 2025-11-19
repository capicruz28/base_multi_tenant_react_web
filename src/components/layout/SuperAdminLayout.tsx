import React from 'react';
import { Outlet } from 'react-router-dom';
import SuperAdminHeader from './SuperAdminHeader';
import SuperAdminSidebar from './SuperAdminSidebar';

/**
 * Layout específico para Super Administradores
 * Diseño diferenciado con branding de administración global
 */
const SuperAdminLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <SuperAdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <SuperAdminHeader />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;