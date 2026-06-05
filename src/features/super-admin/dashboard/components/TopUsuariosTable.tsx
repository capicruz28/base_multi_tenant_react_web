import React from 'react';
import type { AuditoriaTopUsuario } from '@/types/superadmin-auditoria.types';

export interface TopUsuariosTableProps {
  rows: AuditoriaTopUsuario[];
  loading?: boolean;
  error?: boolean;
}

const TopUsuariosTable: React.FC<TopUsuariosTableProps> = ({
  rows,
  loading = false,
  error = false,
}) => {
  if (loading) {
    return (
      <p className="text-sm text-text-soft py-6 text-center">Cargando top usuarios...</p>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-text-soft py-6 text-center">
        No se pudo cargar el ranking de usuarios
      </p>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-text-soft py-6 text-center">
        Sin usuarios con eventos en el periodo
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-text-soft border-b border-border-base">
            <th className="pb-2 pr-3 font-semibold">Usuario</th>
            <th className="pb-2 font-semibold text-right">Eventos</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.usuario_id} className="border-b border-border-base/60 last:border-0">
              <td className="py-2 pr-3 text-text-base font-medium truncate max-w-[180px]">
                {row.nombre_usuario}
              </td>
              <td className="py-2 text-right text-text-base">{row.total_eventos}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TopUsuariosTable;
