import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type Tone = 'neutral' | 'good' | 'warning' | 'critical';

const TONE_TEXT: Record<Tone, string> = {
  neutral: 'text-muted-foreground',
  good: 'text-good',
  warning: 'text-warning',
  critical: 'text-critical',
};

interface StatTileProps {
  label: string;
  value: ReactNode;
  /** Secondary line under the value: context, unit, comparison. */
  hint?: ReactNode;
  icon?: ReactNode;
  /** Status tone applies to the hint only, and must come with words in it. */
  tone?: Tone;
  className?: string;
  children?: ReactNode;
}

/** A single headline number. Not a chart: when one value is the answer, show the value. */
export function StatTile({ label, value, hint, icon, tone = 'neutral', className, children }: StatTileProps) {
  return (
    <div className={cn('surface flex min-w-0 flex-col gap-1.5 p-4', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="eyebrow truncate">{label}</span>
        {icon && <span className="text-subtle-foreground [&_svg]:size-4" aria-hidden="true">{icon}</span>}
      </div>
      <div className="tabular truncate text-2xl font-semibold tracking-tight text-foreground">{value}</div>
      {hint && <div className={cn('truncate text-xs', TONE_TEXT[tone])}>{hint}</div>}
      {children}
    </div>
  );
}
