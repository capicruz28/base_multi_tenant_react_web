/**
 * DEPRECATED (RC1 §9): no usar para display en Table/Cards/MySessions.
 * El Backend expone `device.browser`, `device.os` y `device.device_label`.
 * Mantener solo para diagnóstico legacy o referencias históricas hasta V2.
 */
export interface UserAgentSummary {
  browser: string;
  os: string;
}

const PLACEHOLDER = '—';

/** @deprecated RC1 — usar `session.device.browser` / `session.device.os` en UI. */
export function parseUserAgentSummary(userAgent: string | null | undefined): UserAgentSummary {
  if (userAgent == null || userAgent.trim() === '') {
    return { browser: PLACEHOLDER, os: PLACEHOLDER };
  }

  const ua = userAgent;

  let browser = PLACEHOLDER;
  if (/Edg\//i.test(ua)) {
    const match = ua.match(/Edg\/([\d.]+)/i);
    browser = match ? `Edge ${match[1].split('.')[0]}` : 'Edge';
  } else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) {
    const match = ua.match(/Chrome\/([\d.]+)/i);
    browser = match ? `Chrome ${match[1].split('.')[0]}` : 'Chrome';
  } else if (/Firefox\//i.test(ua)) {
    const match = ua.match(/Firefox\/([\d.]+)/i);
    browser = match ? `Firefox ${match[1].split('.')[0]}` : 'Firefox';
  } else if (/Safari\//i.test(ua) && /Version\//i.test(ua)) {
    browser = 'Safari';
  }

  let os = PLACEHOLDER;
  if (/Windows NT/i.test(ua)) {
    os = 'Windows';
  } else if (/Mac OS X/i.test(ua) && !/like Mac OS X/i.test(ua)) {
    os = 'macOS';
  } else if (/Android/i.test(ua)) {
    os = 'Android';
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    os = 'iOS';
  } else if (/Linux/i.test(ua)) {
    os = 'Linux';
  }

  return { browser, os };
}
