import type { ReactNode } from 'react';

export interface BarListItem {
  key: string;
  label: ReactNode;
  value: number;
  /** Optional right-aligned secondary figure (e.g. p95 latency). */
  detail?: ReactNode;
}

interface BarListProps {
  items: BarListItem[];
  format?: (n: number) => string;
  /** Accessible description of what the bars measure. */
  ariaLabel: string;
  emptyText?: string;
}

/**
 * Ranked horizontal bars for magnitude comparison across a handful of
 * categories. One series, so one colour and no legend; values are printed as
 * text so nothing depends on reading bar length alone.
 */
export function BarList({ items, format = String, ariaLabel, emptyText = 'No data in this window' }: BarListProps) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{emptyText}</p>;
  }
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul aria-label={ariaLabel} className="space-y-2.5">
      {items.map((item) => (
        <li key={item.key} className="group" title={`${typeof item.label === 'string' ? item.label : item.key}: ${format(item.value)}`}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
            <span className="min-w-0 truncate text-foreground">{item.label}</span>
            <span className="tabular flex shrink-0 items-baseline gap-3 text-muted-foreground">
              {item.detail}
              <span className="font-medium text-foreground">{format(item.value)}</span>
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-series-1 transition-[width] duration-500 group-hover:opacity-85"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
