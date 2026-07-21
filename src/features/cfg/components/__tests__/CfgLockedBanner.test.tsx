import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CfgLockedBanner } from '../CfgLockedBanner';

describe('CfgLockedBanner', () => {
  it('muestra copy de bloqueo', () => {
    render(<CfgLockedBanner />);
    expect(
      screen.getByText(
        'Esta secuencia está bloqueada y no se puede modificar.',
      ),
    ).toBeInTheDocument();
  });
});
