export interface IamSegmentTabItem<T extends string = string> {
  id: T;
  label: string;
}

export interface IamSegmentTabsProps<T extends string = string> {
  items: readonly IamSegmentTabItem<T>[];
  activeTab: T;
  onChange: (tab: T) => void;
  ariaLabel?: string;
  className?: string;
}

/**
 * Tabs segmentados reutilizables (patrón OrgParametroHybridTabs).
 */
export function IamSegmentTabs<T extends string>({
  items,
  activeTab,
  onChange,
  ariaLabel = 'Secciones',
  className = '',
}: IamSegmentTabsProps<T>) {
  return (
    <div
      className={`mb-4 flex flex-wrap gap-1 border-b border-border-base ${className}`.trim()}
      role="tablist"
      aria-label={ariaLabel}
    >
      {items.map((tab) => {
        const selected = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={
              selected
                ? 'px-4 py-2.5 text-sm font-medium text-brand-primary border-b-2 border-brand-primary -mb-px'
                : 'px-4 py-2.5 text-sm font-medium text-text-soft hover:text-text-base border-b-2 border-transparent -mb-px transition-colors'
            }
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
