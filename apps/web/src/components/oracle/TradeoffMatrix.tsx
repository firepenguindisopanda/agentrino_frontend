'use client';
import { Star } from 'lucide-react';
import type { OptionMetrics } from '@/lib/oracleAnalytics';
import { cn } from '@/lib/utils';

/** Four-step effort ladder (Quick → Large) with the label always printed. */
export function EffortLadder({ level, label, range }: { level: number | null; label: string; range: string }) {
  return (
    <div className="flex items-center gap-2" title={`${label} (${range})`}>
      <div className="flex gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className={cn('h-3 w-1.5 rounded-sm', level !== null && step <= level ? 'bg-foreground/80' : 'bg-border-strong/60')}
          />
        ))}
      </div>
      <span className="text-[13px] text-foreground">
        {label}
        <span className="sr-only">, {level ? `level ${level} of 4` : 'unrated'}, {range}</span>
      </span>
    </div>
  );
}

/**
 * Pros extend right (blue), cons extend left (red) from a shared gray
 * midline, on a scale shared by every row so lengths compare across options.
 * Counts are printed beside each arm; colour never carries meaning alone.
 */
function DivergingBar({ pros, cons, scale }: { pros: number; cons: number; scale: number }) {
  const pct = (n: number) => `${(n / Math.max(scale, 1)) * 100}%`;
  return (
    <div className="flex items-center gap-2" aria-label={`${pros} pros, ${cons} cons`} role="img">
      <span className="tabular w-4 text-right text-xs text-muted-foreground">{cons}</span>
      <div className="flex h-2.5 w-32 items-center sm:w-40">
        <div className="flex h-full flex-1 justify-end">
          <div className="h-full rounded-l-sm bg-diverge-neg" style={{ width: pct(cons) }} />
        </div>
        <div className="h-4 w-px bg-diverge-mid" />
        <div className="flex h-full flex-1">
          <div className="h-full rounded-r-sm bg-diverge-pos" style={{ width: pct(pros) }} />
        </div>
      </div>
      <span className="tabular w-4 text-xs text-muted-foreground">{pros}</span>
    </div>
  );
}

interface TradeoffMatrixProps {
  metrics: OptionMetrics[];
  onSelect?: (key: string) => void;
}

/** Side-by-side comparison of every option on the same dimensions. */
export function TradeoffMatrix({ metrics, onSelect }: TradeoffMatrixProps) {
  const scale = Math.max(1, ...metrics.flatMap((m) => [m.pros, m.cons]));
  return (
    <div className="surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <caption className="sr-only">Trade-off comparison of the proposed options</caption>
          <thead className="border-b border-border bg-muted/50">
            <tr className="text-xs text-muted-foreground">
              <th scope="col" className="px-4 py-2.5 font-medium">Option</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Effort</th>
              <th scope="col" className="px-4 py-2.5 font-medium">
                <span className="inline-flex items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <span className="size-2 rounded-sm bg-diverge-neg" aria-hidden="true" /> Cons
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="size-2 rounded-sm bg-diverge-pos" aria-hidden="true" /> Pros
                  </span>
                </span>
              </th>
              <th scope="col" className="px-4 py-2.5 text-right font-medium">
                <abbr title="Pros minus cons" className="no-underline">Balance</abbr>
              </th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => (
              <tr
                key={m.key}
                className={cn('border-b border-border last:border-0', m.recommended && 'bg-primary-soft/60')}
              >
                <th scope="row" className="px-4 py-3 font-normal">
                  <button
                    type="button"
                    onClick={() => onSelect?.(m.key)}
                    className="flex items-center gap-2.5 rounded text-left outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/60"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-border bg-card text-xs font-semibold text-muted-foreground">
                      {m.key}
                    </span>
                    <span className="font-medium text-foreground">{m.title}</span>
                    {m.recommended && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                        <Star className="size-2.5 fill-current" aria-hidden="true" />
                        Pick
                      </span>
                    )}
                  </button>
                </th>
                <td className="px-4 py-3">
                  <EffortLadder {...m.effort} />
                </td>
                <td className="px-4 py-3">
                  <DivergingBar pros={m.pros} cons={m.cons} scale={scale} />
                </td>
                <td className="tabular px-4 py-3 text-right font-medium">
                  {m.balance > 0 ? `+${m.balance}` : m.balance}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-border px-4 py-2 text-[11px] text-subtle-foreground">
        Counts come straight from the analysis. Balance is pros minus cons, a rough signal rather than a verdict: one
        severe con can outweigh several pros.
      </p>
    </div>
  );
}
