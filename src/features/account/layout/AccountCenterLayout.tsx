import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { resolveAccountCenterSection } from '@/features/account/account.routes';
import { AccountCenterSectionHeader } from '@/features/account/components/AccountCenterSectionHeader';
import { AccountCenterSidebar } from '@/features/account/components/AccountCenterSidebar';
import { cn } from '@/shared/lib/utils';

const AccountCenterLayout: React.FC = () => {
  const { pathname } = useLocation();
  const section = resolveAccountCenterSection(pathname);
  const isFullWidth = section?.contentVariant === 'full';

  return (
    <div className="flex w-full min-h-0 flex-col gap-4 lg:flex-row lg:gap-6">
      <AccountCenterSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {section ? (
          <AccountCenterSectionHeader title={section.title} subtitle={section.subtitle} />
        ) : null}
        <div
          className={cn(
            'min-h-0 min-w-0 flex-1',
            isFullWidth ? 'w-full' : 'mx-auto w-full max-w-3xl',
          )}
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AccountCenterLayout;
