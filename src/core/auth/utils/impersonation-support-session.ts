export type ImpersonationSupportSession = {
  accessToken: string;
  savedAt: number;
};

const STORAGE_KEY = 'impersonation_support_session';

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export function saveImpersonationSupportSession(accessToken: string): void {
  if (!accessToken?.trim()) return;
  const value: ImpersonationSupportSession = { accessToken, savedAt: Date.now() };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export function getImpersonationSupportSession(): ImpersonationSupportSession | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const parsed = safeParse(raw);
  if (!parsed || typeof parsed !== 'object') return null;
  const record = parsed as Record<string, unknown>;
  const accessToken = typeof record.accessToken === 'string' ? record.accessToken : null;
  const savedAt = typeof record.savedAt === 'number' ? record.savedAt : null;
  if (!accessToken?.trim() || !savedAt) return null;
  return { accessToken, savedAt };
}

export function getImpersonationSupportAccessToken(): string | null {
  return getImpersonationSupportSession()?.accessToken ?? null;
}

export function hasImpersonationSupportSession(): boolean {
  return Boolean(getImpersonationSupportAccessToken());
}

export function clearImpersonationSupportSession(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

