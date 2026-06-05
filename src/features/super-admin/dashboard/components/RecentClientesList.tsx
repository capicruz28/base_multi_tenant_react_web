import React from 'react';
import { Link } from 'react-router-dom';
import { Building, Loader } from 'lucide-react';
import type { RecentClienteItem } from '../utils/clientes-snapshot.utils';

export interface RecentClientesListProps {
  clientes: RecentClienteItem[];
  loading?: boolean;
  error?: boolean;
  isPartial?: boolean;
}

const formatCreationDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString([], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const RecentClientesList: React.FC<RecentClientesListProps> = ({
  clientes,
  loading = false,
  error = false,
  isPartial = false,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="h-6 w-6 animate-spin text-brand-primary" />
        <span className="ml-2 text-sm text-text-soft">Cargando clientes recientes...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <Building className="mx-auto h-8 w-8 text-text-soft mb-2" />
        <p className="text-sm text-text-soft">No se pudo cargar clientes recientes</p>
      </div>
    );
  }

  if (clientes.length === 0) {
    return (
      <div className="text-center py-6">
        <Building className="mx-auto h-8 w-8 text-text-soft mb-2" />
        <p className="text-sm text-text-soft">No hay clientes en el snapshot</p>
      </div>
    );
  }

  return (
    <div>
      {isPartial && (
        <p className="text-xs text-text-soft mb-3">
          Orden basado en snapshot parcial de clientes
        </p>
      )}
      <div className="space-y-3">
        {clientes.map((cliente) => (
          <div
            key={cliente.clienteId}
            className="flex items-center justify-between gap-3 border-b border-border-base/60 last:border-0 pb-3 last:pb-0"
          >
            <div className="min-w-0">
              <Link
                to={`/super-admin/clientes/${cliente.clienteId}`}
                className="text-sm font-medium text-brand-primary hover:text-brand-primary-hover transition-colors truncate block"
              >
                {cliente.label}
              </Link>
              <p className="text-xs text-text-soft truncate">
                {cliente.codigoCliente} · {cliente.planSuscripcion}
              </p>
            </div>
            <span className="text-xs text-text-soft flex-shrink-0">
              {formatCreationDate(cliente.fechaCreacion)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentClientesList;
