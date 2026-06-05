import React from 'react';
import { Link } from 'react-router-dom';
import type { AuditoriaTopIp } from '@/types/superadmin-auditoria.types';

export interface TopIpsTableProps {
  rows: AuditoriaTopIp[];
  loading?: boolean;
  error?: boolean;
}

const TopIpsTable: React.FC<TopIpsTableProps> = ({ rows, loading = false, error = false }) => {
  if (loading) {
    return <p className="text-sm text-text-soft py-6 text-center">Cargando top IPs...</p>;
  }

  if (error) {
    return (
      <p className="text-sm text-text-soft py-6 text-center">No se pudo cargar el ranking de IPs</p>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-text-soft py-6 text-center">Sin actividad por IP en el periodo</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-text-soft border-b border-border-base">
            <th className="pb-2 pr-3 font-semibold">IP</th>
            <th className="pb-2 pr-3 font-semibold text-right">Total</th>
            <th className="pb-2 font-semibold text-right">Fallidos</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.ip_address} className="border-b border-border-base/60 last:border-0">
              <td className="py-2 pr-3">
                <Link
                  to={`/super-admin/auditoria?ip_address=${encodeURIComponent(row.ip_address)}`}
                  className="text-brand-primary hover:text-brand-primary-hover transition-colors font-medium"
                >
                  {row.ip_address}
                </Link>
              </td>
              <td className="py-2 pr-3 text-right text-text-base">{row.total_eventos}</td>
              <td className="py-2 text-right text-error">{row.eventos_fallidos}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TopIpsTable;
