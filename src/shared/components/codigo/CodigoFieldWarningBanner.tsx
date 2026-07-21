export interface CodigoFieldWarningBannerProps {
  message: string;
}

export function CodigoFieldWarningBanner({ message }: CodigoFieldWarningBannerProps) {
  return (
    <div
      className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning"
      role="status"
      data-testid="codigo-warning-banner"
    >
      {message}
    </div>
  );
}
