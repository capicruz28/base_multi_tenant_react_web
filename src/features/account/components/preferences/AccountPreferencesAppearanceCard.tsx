import React from 'react';

import { AccountProfileCard } from '@/features/account/components/profile/AccountProfileCard';
import { AccountPreferenceRadioGroup } from '@/features/account/components/preferences/AccountPreferenceRadioGroup';
import { useTheme } from '@/shared/context/ThemeContext';

const THEME_OPTIONS = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
  { value: 'auto', label: 'Sistema' },
] as const;

export const AccountPreferencesAppearanceCard: React.FC = () => {
  const { themeMode, setThemeMode } = useTheme();

  return (
    <AccountProfileCard title="Apariencia">
      <p className="text-sm text-text-soft">
        Los cambios de tema se aplican inmediatamente en toda la interfaz.
      </p>
      <div className="space-y-2">
        <p className="text-sm font-medium text-text-base">Tema</p>
        <AccountPreferenceRadioGroup
          name="account-theme-mode"
          aria-label="Tema de apariencia"
          value={themeMode}
          options={THEME_OPTIONS}
          onChange={(value) => setThemeMode(value as 'light' | 'dark' | 'auto')}
        />
        {themeMode === 'auto' ? (
          <p className="text-xs text-text-faint">Sistema: sigue la preferencia del sistema operativo.</p>
        ) : null}
      </div>
    </AccountProfileCard>
  );
};
