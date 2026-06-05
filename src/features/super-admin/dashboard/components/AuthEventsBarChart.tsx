import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { EventTypeChartSegment } from '../utils/auditoria-stats.utils';

export interface AuthEventsBarChartProps {
  segments: EventTypeChartSegment[];
  loading?: boolean;
  error?: boolean;
}

const AuthEventsBarChart: React.FC<AuthEventsBarChartProps> = ({
  segments,
  loading = false,
  error = false,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-text-soft">
        Cargando eventos...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-text-soft">
        No se pudieron cargar los eventos por tipo
      </div>
    );
  }

  if (segments.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-text-soft">
        Sin eventos en las últimas 24 horas
      </div>
    );
  }

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={segments} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border-base" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            interval={0}
            angle={segments.length > 2 ? -20 : 0}
            textAnchor={segments.length > 2 ? 'end' : 'middle'}
            height={segments.length > 2 ? 50 : 30}
          />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip
            formatter={(value: number) => [value, 'Eventos']}
            labelFormatter={(label) => String(label)}
          />
          <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AuthEventsBarChart;
