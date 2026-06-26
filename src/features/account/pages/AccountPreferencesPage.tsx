import React from 'react';

import { AccountPreferencesAppearanceCard } from '@/features/account/components/preferences/AccountPreferencesAppearanceCard';
import { AccountPreferencesNavigationCard } from '@/features/account/components/preferences/AccountPreferencesNavigationCard';

const AccountPreferencesPage: React.FC = () => (
  <div className="space-y-6" data-testid="account-preferences-page">
    <AccountPreferencesAppearanceCard />
    <AccountPreferencesNavigationCard />
    <p className="text-xs text-text-faint">
      Estas preferencias se guardan solo en este navegador.
    </p>
  </div>
);

export default AccountPreferencesPage;
