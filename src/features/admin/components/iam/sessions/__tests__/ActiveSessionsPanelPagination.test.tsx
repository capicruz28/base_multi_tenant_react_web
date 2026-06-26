import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ActiveSessionsPanelPagination } from '@/features/admin/components/iam/sessions/ActiveSessionsPanelPagination';

vi.mock('@/shared/components/erp-list/ErpPagination', () => ({
  ErpPagination: ({
    summarySlot,
  }: {
    summarySlot?: React.ReactNode;
  }) => <div data-testid="erp-pagination">{summarySlot}</div>,
}));

describe('ActiveSessionsPanelPagination', () => {
  it('consolida copy dual en summarySlot cuando hay filtros', () => {
    render(
      <ActiveSessionsPanelPagination
        pagination={{
          total: 49,
          pagina_actual: 1,
          total_paginas: 2,
          limit: 25,
        }}
        hasActiveFilters
        tenantTotal={247}
        onPageChange={vi.fn()}
        onLimitChange={vi.fn()}
        limitOptions={[10, 25, 50]}
      />,
    );

    const summary = screen.getByTestId('erp-pagination');
    expect(summary.textContent).toContain('49');
    expect(summary.textContent).toContain('247 en el tenant');
  });

  it('no pasa summarySlot sin filtros activos', () => {
    render(
      <ActiveSessionsPanelPagination
        pagination={{
          total: 247,
          pagina_actual: 1,
          total_paginas: 10,
          limit: 25,
        }}
        hasActiveFilters={false}
        tenantTotal={247}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId('erp-pagination')).toBeEmptyDOMElement();
  });
});
