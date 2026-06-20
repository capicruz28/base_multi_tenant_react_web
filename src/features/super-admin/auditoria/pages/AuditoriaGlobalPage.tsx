import React from 'react';
import { Activity } from 'lucide-react';
import { useAuth } from '@/shared/context/AuthContext';
import AuthAuditLogPanel from '../components/AuthAuditLogPanel';

const AuditoriaGlobalPage: React.FC = () => {
  const { isSuperAdmin } = useAuth();

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="mx-auto h-12 w-12 text-text-soft" />
          <h3 className="mt-2 text-sm font-medium text-text-base">Acceso restringido</h3>
          <p className="mt-1 text-sm text-text-soft">
            No tienes permisos para acceder a la auditoría global.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-text-base">Auditoría Global</h1>
      </div>

      <AuthAuditLogPanel showClienteFilter />
    </div>
  );
};

export default AuditoriaGlobalPage;
