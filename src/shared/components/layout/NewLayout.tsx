import React, { useLayoutEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BreadcrumbProvider } from '../../context/BreadcrumbContext';
import { useNavMode } from '../../context/NavModeContext';
import { LayoutShellProvider } from './LayoutShellContext';
import type { LayoutShellVariant } from './layout-shell.types';
import NewSidebar from './NewSidebar';
import TopNavbar from './TopNavbar';
import Header from './Header';
import LayoutWrapper from '../LayoutWrapper';
import ImpersonationSupportBanner from './ImpersonationSupportBanner';
import { useImpersonation } from '@/features/auth/hooks/useImpersonation';

interface NewLayoutProps {
  variant: LayoutShellVariant;
}

const NewLayout: React.FC<NewLayoutProps> = ({ variant }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { navMode } = useNavMode();
  const location = useLocation();
  const { isImpersonation, exitSupportMode, exiting } = useImpersonation();
  const hideChrome =
    location.pathname.startsWith('/app/onboarding') ||
    location.pathname.startsWith('/app/seleccionar-empresa');
  /** Shells tenant (ERP + SYS_ADMIN); super-admin excluido por diseño. */
  const showSupportBanner =
    isImpersonation && (variant === 'app' || variant === 'admin');

  const bannerMeasureRef = useRef<HTMLDivElement>(null);
  const [supportBannerHeightPx, setSupportBannerHeightPx] = useState(0);

  useLayoutEffect(() => {
    if (!showSupportBanner) {
      setSupportBannerHeightPx(0);
      return;
    }
    const node = bannerMeasureRef.current;
    if (!node) return;

    const syncHeight = () => {
      setSupportBannerHeightPx(node.offsetHeight);
    };
    syncHeight();

    const observer = new ResizeObserver(syncHeight);
    observer.observe(node);
    return () => observer.disconnect();
  }, [showSupportBanner]);

  const layoutShellStyle = {
    '--support-banner-h': `${supportBannerHeightPx}px`,
  } as React.CSSProperties;

  return (
    <LayoutShellProvider variant={variant}>
      <BreadcrumbProvider>
        <div
          className="flex min-h-screen flex-col bg-page transition-colors duration-200"
          style={layoutShellStyle}
        >
          {showSupportBanner ? (
            <div ref={bannerMeasureRef} className="shrink-0">
              <ImpersonationSupportBanner onExit={exitSupportMode} exiting={exiting} />
            </div>
          ) : null}
          <div className="flex min-h-0 flex-1">
          {!hideChrome && navMode === 'sidebar' && (
            <NewSidebar
              isCollapsed={isSidebarCollapsed}
              toggleSidebar={() => setIsSidebarCollapsed((c) => !c)}
            />
          )}

          <div
            className={`flex-1 flex flex-col transition-all duration-300 ${
              hideChrome
                ? ''
                : navMode === 'sidebar'
                  ? isSidebarCollapsed
                    ? 'pl-16'
                    : 'pl-64'
                  : ''
            }`}
          >
            {!hideChrome && <Header />}
            {!hideChrome && navMode === 'navbar' && <TopNavbar />}
            <main className={`flex-1 min-h-screen ${hideChrome ? 'bg-page' : 'bg-subtle'}`}>
              {hideChrome ? <Outlet /> : (
                <LayoutWrapper>
                  <Outlet />
                </LayoutWrapper>
              )}
            </main>
          </div>
          </div>
        </div>
      </BreadcrumbProvider>
    </LayoutShellProvider>
  );
};

export default NewLayout;
