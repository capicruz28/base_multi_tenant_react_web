import React from 'react';
import { NavLink } from 'react-router-dom';
import { Lock, MonitorSmartphone, Settings, User } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import {
  ACCOUNT_CENTER_SECTIONS,
  type AccountCenterSectionId,
} from '@/features/account/account.routes';

const SECTION_ICONS: Record<AccountCenterSectionId, React.ComponentType<{ className?: string }>> = {
  informacion: User,
  seguridad: Lock,
  sesiones: MonitorSmartphone,
  preferencias: Settings,
};

export const AccountCenterSidebar: React.FC = () => (
  <aside
    className="w-full shrink-0 border-border-base bg-surface lg:w-[220px] lg:border-r lg:pr-4"
    aria-label="Navegación Mi cuenta"
  >
    <div className="mb-3 border-b border-border-base pb-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-faint">Mi cuenta</p>
    </div>
    <nav className="flex flex-col gap-1">
      {ACCOUNT_CENTER_SECTIONS.map((section) => {
        const Icon = SECTION_ICONS[section.id];
        return (
          <NavLink
            key={section.id}
            to={section.segment}
            end
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2',
                isActive
                  ? 'border-l-2 border-brand-primary bg-overlay font-medium text-text-base'
                  : 'text-text-soft hover:bg-overlay hover:text-text-base',
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span>{section.navLabel}</span>
          </NavLink>
        );
      })}
    </nav>
  </aside>
);
