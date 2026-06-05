import React from 'react';
import { Loader, Shield } from 'lucide-react';
import type { SuperadminUsuario } from '@/types/superadmin-usuario.types';

export interface PlatformOperatorsPanelProps {
  operators: SuperadminUsuario[];
  loading?: boolean;
  error?: boolean;
}

const formatLastAccess = (value?: string | null): string => {
  if (!value) return 'Sin acceso registrado';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString([], {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const PlatformOperatorsPanel: React.FC<PlatformOperatorsPanelProps> = ({
  operators,
  loading = false,
  error = false,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="h-6 w-6 animate-spin text-brand-primary" />
        <span className="ml-2 text-sm text-text-soft">Cargando operadores...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <Shield className="mx-auto h-8 w-8 text-text-soft mb-2" />
        <p className="text-sm text-text-soft">No se pudieron cargar operadores Platform</p>
      </div>
    );
  }

  if (operators.length === 0) {
    return (
      <div className="text-center py-6">
        <Shield className="mx-auto h-8 w-8 text-text-soft mb-2" />
        <p className="text-sm text-text-soft">No hay operadores Platform activos</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {operators.slice(0, 5).map((operator) => (
        <div
          key={operator.usuario_id}
          className="flex items-start justify-between gap-3 border-b border-border-base/60 last:border-0 pb-3 last:pb-0"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-base truncate">
              {operator.nombre_usuario}
            </p>
            <p className="text-xs text-text-soft truncate">
              {operator.correo || 'Sin correo'}
              {operator.is_super_admin ? ' · Super Admin' : ''}
            </p>
          </div>
          <span className="text-xs text-text-soft flex-shrink-0 text-right max-w-[120px]">
            {formatLastAccess(operator.fecha_ultimo_acceso)}
          </span>
        </div>
      ))}
      {operators.length > 5 && (
        <p className="text-xs text-text-soft pt-1">
          +{operators.length - 5} operadores adicionales en Platform
        </p>
      )}
    </div>
  );
};

export default PlatformOperatorsPanel;
