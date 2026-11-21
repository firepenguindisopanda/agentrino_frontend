'use client';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Activity, AlertTriangle, Cpu, Gauge, RefreshCw, Timer, Zap } from 'lucide-react';
import { adminService, type SystemMetrics } from '@/services/adminService';
import { StatTile, type Tone } from '@/components/analytics/StatTile';
import { TimeSeriesChart } from '@/components/analytics/TimeSeriesChart';
import { BarList } from '@/components/analytics/BarList';
import { formatCompact, formatDuration, formatMs, formatPercent } from '@/lib/format';
import { cn } from '@/lib/utils';
import { RecentCallsTable, RouteTable, RoutingTable, TierBadge } from './MetricsTables';

const WINDOWS = [
  { minutes: 15, label: '15m' },
  { minutes: 60, label: '1h' },
  { minutes: 360, label: '6h' },
  { minutes: 1440, label: '24h' },
];
const REFRESH_MS = 15_000;

/** Symptom thresholds: what a user would feel, not internal causes. */
function errorTone(rate: number, sample: number): Tone {
  if (sample < 5) return 'neutral';
  if (rate >= 0.05) return 'critical';
  if (rate >= 0.01) return 'warning';
  return 'good';
}

function latencyTone(p95: number | null, warnMs: number, critMs: number): Tone {
  if (p95 === null) return 'neutral';
  if (p95 >= critMs) return 'critical';
  if (p95 >= warnMs) return 'warning';
  return 'good';
}

function Panel({ title, subtitle, children, className }: { title: string; subtitle?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn('surface min-w-0 p-4', className)} aria-label={title}>
      <header className="mb-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}

export function SystemDashboard({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [windowMinutes, setWindowMinutes] = useState(60);
  const [data, setData] = useState<SystemMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      setData(await adminService.getMetrics(windowMinutes));
      setError(null);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        onUnauthorized();
        return;
      }
      setError('Could not load metrics. The server may be restarting.');
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, [windowMinutes, onUnauthorized]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [autoRefresh, load]);

  if (loading && !data) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading metrics">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-64 animate-pulse rounded-xl bg-muted" />
          <div className="h-64 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  const http = data?.http;
  const llm = data?.llm;
  const seriesWindow = Math.min(windowMinutes, 60);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="radiogroup" aria-label="Time window" className="inline-flex rounded-lg border border-border bg-muted p-0.5">
          {WINDOWS.map((w) => (
            <button
              key={w.minutes}
              type="button"
              role="radio"
              aria-checked={windowMinutes === w.minutes}
              onClick={() => setWindowMinutes(w.minutes)}
              className={cn(
                'tabular rounded-md px-2.5 py-1 text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
                windowMinutes === w.minutes ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {w.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {data && <span>Up {formatDuration(data.uptime_seconds)}</span>}
          <label className="flex cursor-pointer items-center gap-1.5">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="size-3.5 accent-[var(--primary)]"
            />
            Auto-refresh
          </label>
          <button
            type="button"
            onClick={load}
            aria-label="Refresh metrics"
            className="flex size-8 items-center justify-center rounded-md outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            <RefreshCw className="size-4" />
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning-soft px-3 py-2 text-sm">
          <AlertTriangle className="size-4 text-warning" aria-hidden="true" />
          {error}
          {data && <span className="text-muted-foreground">Showing the last successful snapshot.</span>}
        </div>
      )}

      {http && llm && data && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <StatTile label="Requests" icon={<Activity />} value={formatCompact(http.requests)} hint={`${http.rate_per_min}/min average`} />
            <StatTile
              label="Server errors"
              icon={<AlertTriangle />}
              value={formatPercent(http.error_rate)}
              tone={errorTone(http.error_rate, http.requests)}
              hint={http.errors ? `${http.errors} failed (5xx)` : 'No 5xx responses'}
            />
            <StatTile
              label="API p95"
              icon={<Gauge />}
              value={formatMs(http.latency_ms.p95)}
              tone={latencyTone(http.latency_ms.p95, 800, 2000)}
              hint={`p50 ${formatMs(http.latency_ms.p50)}`}
            />
            <StatTile
              label="LLM calls"
              icon={<Cpu />}
              value={formatCompact(llm.calls)}
              tone={errorTone(llm.error_rate, llm.calls)}
              hint={`${llm.errors} errors · ${llm.cancelled} cancelled`}
            />
            <StatTile
              label="First token p50"
              icon={<Zap />}
              value={formatMs(llm.ttft_ms.p50)}
              tone={latencyTone(llm.ttft_ms.p95, 3000, 8000)}
              hint={`p95 ${formatMs(llm.ttft_ms.p95)}`}
            />
            <StatTile
              label="Output tokens"
              icon={<Timer />}
              value={`${llm.tokens_estimated ? '~' : ''}${formatCompact(llm.output_tokens)}`}
              hint={llm.tokens_estimated ? 'Estimated at ~4 chars per token' : 'Reported by provider'}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="API traffic" subtitle={`Requests per minute, last ${seriesWindow} min`}>
              <TimeSeriesChart
                title="API requests per minute"
                timestamps={http.series.map((b) => b.t)}
                series={[
                  { key: 'req', label: 'Requests', color: 'var(--series-1)', values: http.series.map((b) => b.count) },
                  { key: 'err', label: '5xx errors', color: 'var(--critical)', values: http.series.map((b) => b.errors) },
                ]}
              />
            </Panel>
            <Panel title="LLM calls" subtitle={`Model calls per minute, last ${seriesWindow} min`}>
              <TimeSeriesChart
                title="LLM calls per minute"
                timestamps={llm.series.map((b) => b.t)}
                series={[
                  { key: 'calls', label: 'Calls', color: 'var(--series-1)', values: llm.series.map((b) => b.count) },
                  { key: 'err', label: 'Errors', color: 'var(--critical)', values: llm.series.map((b) => b.errors) },
                ]}
              />
            </Panel>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Panel title="Model routing" subtitle="Each task goes to the cheapest tier that does it well. Configure via LLM_* env vars.">
              <RoutingTable routing={data.routing} byTask={llm.by_task} />
            </Panel>
            <Panel title="Work by tier" subtitle="Calls in window, with p95 latency">
              <BarList
                ariaLabel="LLM calls by model tier"
                items={llm.by_tier.map((g) => ({
                  key: g.tier ?? 'unknown',
                  label: <TierBadge tier={g.tier ?? 'unknown'} />,
                  value: g.count,
                  detail: <span className="text-xs">p95 {formatMs(g.latency_ms.p95)}</span>,
                }))}
                format={(n) => n.toLocaleString()}
                emptyText="No LLM calls in this window"
              />
            </Panel>
          </div>

          <Panel title="Latency by route" subtitle="RED metrics per endpoint. Streaming routes measure time to first byte.">
            <RouteTable routes={http.routes} />
          </Panel>

          <Panel title="Recent LLM calls" subtitle="Hover a row for its request ID, which matches the X-Request-ID in server logs.">
            <RecentCallsTable calls={llm.recent} />
          </Panel>

          <p className="text-[11px] text-subtle-foreground">
            Metrics are kept in server memory for the live view and reset when the server restarts. Snapshot taken{' '}
            {new Date(data.generated_at * 1000).toLocaleTimeString()}.
          </p>
        </>
      )}
    </div>
  );
}
