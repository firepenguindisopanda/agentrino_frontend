import { cn } from '@/lib/utils';

interface MeterProps {
  value: number;
  max: number;
  label: string;
  /** Fraction (0..1) at which the bar switches to the warning tone. */
  warnAt?: number;
  className?: string;
}

/** Capacity bar (e.g. chats used vs. limit). Exposes role="meter" for AT. */
export function Meter({ value, max, label, warnAt = 0.8, className }: MeterProps) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const full = ratio >= 1;
  const warn = !full && ratio >= warnAt;
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={`${value} of ${max}`}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-muted', className)}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-500',
          full ? 'bg-critical' : warn ? 'bg-warning' : 'bg-primary'
        )}
        style={{ width: `${ratio * 100}%` }}
      />
    </div>
  );
}
