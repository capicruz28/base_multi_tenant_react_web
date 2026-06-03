import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowLeft } from 'lucide-react';
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
      <div className="mb-6">
        <Link
          to="/super-admin/dashboard"
          className="inline-flex items-center gap-2 text-sm text-text-soft hover:text-text-base mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al dashboard
        </Link>
        <h1 className="text-2xl font-bold text-text-base">Auditoría Global</h1>
        <p className="mt-1 text-sm text-text-soft">
          Logs de autenticación de todos los clientes. Filtra por cliente, evento, usuario o rango
          de fechas.
        </p>
      </div>

      <AuthAuditLogPanel showClienteFilter />
    </div>
  );
};

export default AuditoriaGlobalPage;
