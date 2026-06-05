import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  aggregateClientesSnapshot,
  fetchClientesSnapshot,
  toPlanDistributionSegments,
  type ClientesSnapshotAggregation,
  type PlanDistributionSegment,
} from '../utils/clientes-snapshot.utils';
import { buildPortfolioAlertsFromSnapshot, type DashboardAlertItem } from '../utils/dashboard-alert.rules';
import type { DashboardMetricState } from './usePlatformDashboardP0';

export type PlatformDashboardP1BData = {
  suspendidos: DashboardMetricState;
  trial: DashboardMetricState;
  cancelados: DashboardMetricState;
  morosos: DashboardMetricState;
  planDistribution: PlanDistributionSegment[];
  portfolioAlerts: DashboardAlertItem[];
  aggregation: ClientesSnapshotAggregation | null;
  isPartialSnapshot: boolean;
  snapshotLoading: boolean;
  snapshotError: boolean;
};

const metricFromAggregation = (
  value: number | undefined,
  isLoading: boolean,
  isError: boolean,
): DashboardMetricState => ({
  value: isLoading || isError ? null : (value ?? 0),
  isLoading,
  isError,
});

export function usePlatformDashboardP1B(enabled: boolean): PlatformDashboardP1BData {
  const snapshotQuery = useQuery({
    queryKey: ['platform-dashboard', 'clientes-snapshot'],
    queryFn: fetchClientesSnapshot,
    enabled,
    staleTime: 120_000,
  });

  const aggregation = useMemo(() => {
    if (!snapshotQuery.data || snapshotQuery.isError) return null;
    return aggregateClientesSnapshot(
      snapshotQuery.data.clientes,
      snapshotQuery.data.totalReported,
      snapshotQuery.data.isPartial,
    );
  }, [snapshotQuery.data, snapshotQuery.isError]);

  const planDistribution = useMemo(
    () => (aggregation ? toPlanDistributionSegments(aggregation.porPlan) : []),
    [aggregation],
  );

  const portfolioAlerts = useMemo(
    () => (snapshotQuery.isError ? [] : buildPortfolioAlertsFromSnapshot(aggregation ?? undefined)),
    [aggregation, snapshotQuery.isError],
  );

  const isLoading = snapshotQuery.isLoading;
  const isError = snapshotQuery.isError;

  return {
    suspendidos: metricFromAggregation(aggregation?.suspendidos, isLoading, isError),
    trial: metricFromAggregation(aggregation?.trial, isLoading, isError),
    cancelados: metricFromAggregation(aggregation?.cancelados, isLoading, isError),
    morosos: metricFromAggregation(aggregation?.morosos, isLoading, isError),
    planDistribution,
    portfolioAlerts,
    aggregation,
    isPartialSnapshot: aggregation?.isPartial ?? false,
    snapshotLoading: isLoading,
    snapshotError: isError,
  };
}
