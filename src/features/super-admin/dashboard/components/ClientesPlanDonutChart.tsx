import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import type { PlanDistributionSegment } from '../utils/clientes-snapshot.utils';

const PLAN_COLORS: Record<PlanDistributionSegment['key'], string> = {
  basico: '#3b82f6',
  profesional: '#8b5cf6',
  enterprise: '#059669',
  trial: '#f59e0b',
};

export interface ClientesPlanDonutChartProps {
  segments: PlanDistributionSegment[];
  loading?: boolean;
  error?: boolean;
}

const ClientesPlanDonutChart: React.FC<ClientesPlanDonutChartProps> = ({
  segments,
  loading = false,
  error = false,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-text-soft">
        Cargando distribución...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-text-soft">
        No se pudo cargar la distribución por plan
      </div>
    );
  }

  if (segments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-text-soft">
        Sin datos de planes en el snapshot actual
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={segments}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
          >
            {segments.map((entry) => (
              <Cell key={entry.key} fill={PLAN_COLORS[entry.key]} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, _name, item) => [
              value,
              item.payload?.label ?? 'Plan',
            ]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ClientesPlanDonutChart;
