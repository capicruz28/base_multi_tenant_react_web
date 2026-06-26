import React from 'react';

import { AccountProfileCard } from '@/features/account/components/profile/AccountProfileCard';
import { AccountPreferenceRadioGroup } from '@/features/account/components/preferences/AccountPreferenceRadioGroup';
import { useNavMode, type NavMode } from '@/shared/context/NavModeContext';

const NAV_OPTIONS = [
  { value: 'sidebar', label: 'Barra lateral' },
  { value: 'navbar', label: 'Barra superior' },
] as const;

export const AccountPreferencesNavigationCard: React.FC = () => {
  const { navMode, setNavMode } = useNavMode();

  return (
    <AccountProfileCard title="Navegación">
      <p className="text-sm text-text-soft">
        La preferencia de navegación se guarda en este navegador y se aplicará en futuras sesiones.
      </p>
      <div className="space-y-2">
        <p className="text-sm font-medium text-text-base">Disposición del menú</p>
        <AccountPreferenceRadioGroup
          name="account-nav-mode"
          aria-label="Modo de navegación"
          value={navMode}
          options={NAV_OPTIONS}
          onChange={(value) => setNavMode(value as NavMode)}
        />
      </div>
    </AccountProfileCard>
  );
};
