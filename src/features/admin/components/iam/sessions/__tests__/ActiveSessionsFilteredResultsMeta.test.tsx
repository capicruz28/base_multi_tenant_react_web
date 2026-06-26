import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  ActiveSessionsFilteredResultsMeta,
  ActiveSessionsPaginationDualCopy,
} from '@/features/admin/components/iam/sessions/ActiveSessionsFilteredResultsMeta';

describe('ActiveSessionsFilteredResultsMeta', () => {
  it('renders dual copy when filters are active', () => {
    render(
      <ActiveSessionsFilteredResultsMeta
        hasActiveFilters
        tenantTotal={247}
        filteredTotal={49}
      />,
    );

    expect(screen.getByText('247 sesiones activas del tenant')).toBeInTheDocument();
    expect(screen.getByText('49 resultados')).toBeInTheDocument();
  });

  it('renders nothing without active filters', () => {
    const { container } = render(
      <ActiveSessionsFilteredResultsMeta
        hasActiveFilters={false}
        tenantTotal={247}
        filteredTotal={49}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});

describe('ActiveSessionsPaginationDualCopy', () => {
  it('includes tenant total when filters are active', () => {
    const { container } = render(
      <ActiveSessionsPaginationDualCopy
        hasActiveFilters
        filteredTotal={49}
        tenantTotal={247}
        rangeStart={1}
        rangeEnd={25}
      />,
    );

    expect(container.textContent).toContain('49');
    expect(container.textContent).toContain('247 en el tenant');
  });
});
