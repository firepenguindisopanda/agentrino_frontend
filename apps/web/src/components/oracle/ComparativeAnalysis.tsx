'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Check, ChevronDown, ClipboardCopy, Minus, Plus, Star } from 'lucide-react';
import type { OracleOption } from '@/store/slices/oracleSlice';
import { analysisToMarkdown, computeOptionMetrics, summarizeAnalysis } from '@/lib/oracleAnalytics';
import { cn } from '@/lib/utils';
import { EffortLadder, TradeoffMatrix } from './TradeoffMatrix';

interface ComparativeAnalysisProps {
  question?: string;
  bottomLine: string;
  options: OracleOption[];
  actionPlan: string[];
  watchOutFor: string[];
}

type View = 'overview' | 'compare';

export function ComparativeAnalysis({ question, bottomLine, options, actionPlan, watchOutFor }: ComparativeAnalysisProps) {
  const metrics = useMemo(() => computeOptionMetrics(options), [options]);
  const summary = useMemo(() => summarizeAnalysis(metrics), [metrics]);
  const [view, setView] = useState<View>('overview');
  const [expanded, setExpanded] = useState<string | null>(summary.recommended?.key ?? null);

  const copyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(analysisToMarkdown({ question, bottomLine, options, actionPlan, watchOutFor }));
      toast.success('Analysis copied as Markdown');
    } catch {
      toast.error('Clipboard unavailable');
    }
  };

  const focusOption = (key: string) => {
    setView('overview');
    setExpanded(key);
    requestAnimationFrame(() => document.getElementById(`option-${key}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
  };

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Bottom line first: the answer before the evidence. */}
      <section aria-labelledby="rec-heading" className="surface relative overflow-hidden p-5 sm:p-6">
        <span className="absolute inset-y-0 left-0 w-1 bg-primary" aria-hidden="true" />
        <div className="mb-2 flex items-center gap-2">
          <Star className="size-4 fill-primary text-primary" aria-hidden="true" />
          <h2 id="rec-heading" className="eyebrow !text-primary-ink">Recommendation</h2>
        </div>
        <p className="text-[17px] font-medium leading-relaxed text-foreground">{bottomLine}</p>
        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[13px]">
          {summary.recommended && (
            <div className="flex items-center gap-2">
              <dt className="text-muted-foreground">Pick</dt>
              <dd className="font-medium">
                {summary.recommended.key}. {summary.recommended.title}
              </dd>
            </div>
          )}
          {summary.recommended && (
            <div className="flex items-center gap-2">
              <dt className="text-muted-foreground">Effort</dt>
              <dd>
                {summary.recommended.effort.label} · {summary.recommended.effort.range}
                {summary.recommendedIsLowestEffort && (
                  <span className="ml-1.5 text-good">(lowest of {summary.optionCount})</span>
                )}
              </dd>
            </div>
          )}
          <div className="flex items-center gap-2">
            <dt className="text-muted-foreground">Plan</dt>
            <dd className="tabular">{actionPlan.length} steps</dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="text-muted-foreground">Risks flagged</dt>
            <dd className="tabular">{watchOutFor.length}</dd>
          </div>
        </dl>
      </section>

      <div className="flex items-center justify-between gap-3">
        <div role="tablist" aria-label="Analysis view" className="inline-flex rounded-lg border border-border bg-muted p-0.5">
          {(['overview', 'compare'] as const).map((v) => (
            <button
              key={v}
              role="tab"
              type="button"
              id={`tab-${v}`}
              aria-selected={view === v}
              aria-controls={`panel-${v}`}
              onClick={() => setView(v)}
              className={cn(
                'rounded-md px-3 py-1.5 text-[13px] font-medium capitalize outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/60',
                view === v ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {v === 'overview' ? `Options (${options.length})` : 'Compare'}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={copyMarkdown}
          className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[13px] text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          <ClipboardCopy className="size-3.5" aria-hidden="true" />
          Copy as Markdown
        </button>
      </div>

      {view === 'compare' ? (
        <div role="tabpanel" id="panel-compare" aria-labelledby="tab-compare">
          <TradeoffMatrix metrics={metrics} onSelect={focusOption} />
        </div>
      ) : (
        <div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview" className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {options.map((option, i) => {
            const m = metrics[i];
            const isOpen = expanded === m.key;
            return (
              <article
                key={`${m.key}-${option.title}`}
                id={`option-${m.key}`}
                className={cn(
                  'surface flex flex-col transition-[border-color,box-shadow]',
                  option.recommended && 'border-primary ring-1 ring-primary/30',
                  isOpen && 'md:col-span-2'
                )}
              >
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : m.key)}
                  aria-expanded={isOpen}
                  aria-controls={`option-body-${m.key}`}
                  className="flex w-full items-start gap-3 rounded-xl p-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-xs font-semibold text-muted-foreground">
                    {m.key}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-foreground">{option.title}</span>
                      {option.recommended && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
                          <Star className="size-3 fill-current" aria-hidden="true" />
                          Recommended
                        </span>
                      )}
                    </span>
                    <span className={cn('mt-1 block text-sm text-muted-foreground', !isOpen && 'line-clamp-2')}>
                      {option.description}
                    </span>
                    <span className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <EffortLadder {...m.effort} />
                      <span className="tabular">
                        {m.pros} pros · {m.cons} cons
                      </span>
                    </span>
                  </span>
                  <ChevronDown
                    className={cn('mt-1 size-4 shrink-0 text-subtle-foreground transition-transform', isOpen && 'rotate-180')}
                    aria-hidden="true"
                  />
                </button>

                {isOpen && (
                  <div id={`option-body-${m.key}`} className="grid gap-4 border-t border-border p-4 sm:grid-cols-2">
                    <div>
                      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-good">
                        <Plus className="size-3.5" aria-hidden="true" /> Pros
                      </h3>
                      <ul className="space-y-1.5">
                        {option.pros.map((pro, k) => (
                          <li key={k} className="flex items-start gap-2 text-sm">
                            <Check className="mt-0.5 size-3.5 shrink-0 text-good" aria-hidden="true" />
                            <span className="text-foreground">{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-critical">
                        <Minus className="size-3.5" aria-hidden="true" /> Cons
                      </h3>
                      <ul className="space-y-1.5">
                        {option.cons.map((con, k) => (
                          <li key={k} className="flex items-start gap-2 text-sm">
                            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-critical" aria-hidden="true" />
                            <span className="text-foreground">{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {actionPlan.length > 0 && (
          <section aria-labelledby="plan-heading" className="surface p-5">
            <h2 id="plan-heading" className="mb-4 text-sm font-semibold">Action plan</h2>
            <ol className="relative space-y-4">
              {actionPlan.map((step, i) => (
                <li key={i} className="relative flex gap-3">
                  {i < actionPlan.length - 1 && (
                    <span className="absolute left-3 top-7 h-[calc(100%-0.5rem)] w-px bg-border" aria-hidden="true" />
                  )}
                  <span className="tabular relative flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                    {i + 1}
                  </span>
                  <span className="pt-0.5 text-sm leading-relaxed text-foreground">{step}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {watchOutFor.length > 0 && (
          <section aria-labelledby="risks-heading" className="surface border-warning/40 bg-warning-soft/40 p-5">
            <h2 id="risks-heading" className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="size-4 text-warning" aria-hidden="true" />
              Watch out for
            </h2>
            <ul className="space-y-2.5">
              {watchOutFor.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-foreground">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-warning" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
