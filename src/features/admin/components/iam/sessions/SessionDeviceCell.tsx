import { Globe, Monitor, Smartphone, Tablet } from 'lucide-react';

import type { SessionDeviceRead } from '@/features/admin/types/session.types';

const PLACEHOLDER = '—';

export type SessionDeviceCellDisplay = 'label' | 'browser' | 'ip';

export interface SessionDeviceCellProps {
  device: SessionDeviceRead | undefined;
  display?: SessionDeviceCellDisplay;
}

function PlatformIcon({ platform, clientType }: { platform: string; clientType: string }) {
  const normalizedPlatform = platform.toLowerCase();
  const normalizedClientType = clientType.toLowerCase();

  if (normalizedPlatform === 'mobile' || normalizedClientType === 'mobile') {
    return <Smartphone className="h-4 w-4 text-success shrink-0" aria-hidden />;
  }
  if (normalizedPlatform === 'tablet') {
    return <Tablet className="h-4 w-4 text-info shrink-0" aria-hidden />;
  }
  if (normalizedPlatform === 'desktop' || normalizedClientType === 'web') {
    return <Monitor className="h-4 w-4 text-info shrink-0" aria-hidden />;
  }
  return <Globe className="h-4 w-4 text-text-soft shrink-0" aria-hidden />;
}

function formatBrowserLine(device: SessionDeviceRead): string {
  const browser = device.browser.trim() || PLACEHOLDER;
  const os = device.os.trim() || PLACEHOLDER;
  if (browser === PLACEHOLDER && os === PLACEHOLDER) {
    return PLACEHOLDER;
  }
  if (os === PLACEHOLDER) {
    return browser;
  }
  if (browser === PLACEHOLDER) {
    return os;
  }
  return `${browser} · ${os}`;
}

/**
 * Celda dispositivo RC1 — consume exclusivamente campos `device.*` del Backend.
 * Prohibido parsear `user_agent`.
 */
export function SessionDeviceCell({ device, display = 'label' }: SessionDeviceCellProps) {
  if (!device) {
    return <span className="text-text-soft">{PLACEHOLDER}</span>;
  }

  if (display === 'browser') {
    return <span className="text-text-soft">{formatBrowserLine(device)}</span>;
  }

  if (display === 'ip') {
    return <span className="text-text-soft">{device.ip_address ?? PLACEHOLDER}</span>;
  }

  const label = device.device_label.trim() || PLACEHOLDER;

  return (
    <span className="inline-flex items-center gap-2 text-text-soft">
      <PlatformIcon platform={device.platform} clientType={device.client_type} />
      <span>{label}</span>
    </span>
  );
}
