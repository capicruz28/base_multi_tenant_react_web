export function str(value: string | null | undefined): string {
  return (value ?? '').trim();
}

export function optStr(value: string | null | undefined): string | undefined {
  const s = str(value);
  return s === '' ? undefined : s;
}

export function optId(value: string | null | undefined): string | undefined {
  return optStr(value);
}

export function bool(value: boolean | null | undefined, fallback = false): boolean {
  return value ?? fallback;
}

export function numOrUndef(value: number | null | undefined): number | undefined {
  return value === null || value === undefined ? undefined : value;
}
