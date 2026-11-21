'use client';
import { AlertCircle, CheckCircle2, CircleSlash } from 'lucide-react';
import type { LLMCall, LLMGroup, ModelRoute, RouteStats } from '@/services/adminService';
import { formatClock, formatCompact, formatMs } from '@/lib/format';
import { cn } from '@/lib/utils';

const TIER_STYLE: Record<string, string> = {
  light: 'bg-muted text-muted-foreground',
  standard: 'bg-primary-soft text-primary-ink',
  strong: 'bg-foreground text-background',
};

export function TierBadge({ tier }: { tier: string }) {
  return (
    <span className={cn('inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-medium capitalize', TIER_STYLE[tier] ?? TIER_STYLE.light)}>
      {tier}
    </span>
  );
}

/** Status always carries an icon and a word, never colour alone. */
function StatusBadge({ status }: { status: LLMCall['status'] }) {
  const map = {
    ok: { icon: CheckCircle2, label: 'OK', cls: 'text-good' },
    error: { icon: AlertCircle, label: 'Error', cls: 'text-critical' },
    cancelled: { icon: CircleSlash, label: 'Cancelled', cls: 'text-muted-foreground' },
  } as const;
  const { icon: Icon, label, cls } = map[status] ?? map.error;
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', cls)}>
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th scope="col" className={cn('whitespace-nowrap px-3 py-2 text-xs font-medium text-muted-foreground', right && 'text-right')}>
      {children}
    </th>
  );
}

function Empty({ cols, text }: { cols: number; text: string }) {
  return (
    <tr>
      <td colSpan={cols} className="px-3 py-8 text-center text-sm text-muted-foreground">
        {text}
      </td>
    </tr>
  );
}

export function RoutingTable({ routing, byTask }: { routing: ModelRoute[]; byTask: LLMGroup[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <caption className="sr-only">Task to tier to model routing, with live call stats</caption>
        <thead className="border-b border-border">
          <tr>
            <Th>Task</Th>
            <Th>Tier</Th>
            <Th>Model</Th>
            <Th right>Max tokens</Th>
            <Th right>Calls</Th>
            <Th right>p95</Th>
          </tr>
        </thead>
        <tbody className="tabular [&_td]:whitespace-nowrap">
          {routing.map((r) => {
            const live = byTask.find((t) => t.task === r.task);
            return (
              <tr key={r.task} className="border-b border-border last:border-0">
                <td className="px-3 py-2.5 font-medium capitalize">{r.task}</td>
                <td className="px-3 py-2.5"><TierBadge tier={r.tier} /></td>
                <td className="max-w-[260px] truncate px-3 py-2.5 font-mono text-xs text-muted-foreground" title={r.model}>
                  {r.model}
                </td>
                <td className="px-3 py-2.5 text-right">{r.max_tokens.toLocaleString()}</td>
                <td className="px-3 py-2.5 text-right">{live?.count ?? 0}</td>
                <td className="px-3 py-2.5 text-right">{formatMs(live?.latency_ms.p95)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function RouteTable({ routes }: { routes: RouteStats[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-left text-sm">
        <caption className="sr-only">Requests, errors and latency percentiles per API route</caption>
        <thead className="border-b border-border">
          <tr>
            <Th>Route</Th>
            <Th right>Requests</Th>
            <Th right>5xx</Th>
            <Th right>4xx</Th>
            <Th right>p50</Th>
            <Th right>p95</Th>
            <Th right>p99</Th>
          </tr>
        </thead>
        <tbody className="tabular [&_td]:whitespace-nowrap">
          {routes.length === 0 ? (
            <Empty cols={7} text="No requests in this window" />
          ) : (
            routes.map((r) => (
              <tr key={`${r.method} ${r.route}`} className="border-b border-border last:border-0">
                <td className="px-3 py-2.5">
                  <span className="mr-2 inline-block w-12 font-mono text-[11px] font-semibold text-muted-foreground">{r.method}</span>
                  <span className="font-mono text-xs">{r.route}</span>
                </td>
                <td className="px-3 py-2.5 text-right">{r.count.toLocaleString()}</td>
                <td className={cn('px-3 py-2.5 text-right', r.errors > 0 && 'font-semibold text-critical')}>{r.errors}</td>
                <td className="px-3 py-2.5 text-right text-muted-foreground">{r.client_errors}</td>
                <td className="px-3 py-2.5 text-right">{formatMs(r.latency_ms.p50)}</td>
                <td className="px-3 py-2.5 text-right">{formatMs(r.latency_ms.p95)}</td>
                <td className="px-3 py-2.5 text-right">{formatMs(r.latency_ms.p99)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function RecentCallsTable({ calls }: { calls: LLMCall[] }) {
  return (
    <div className="max-h-[420px] overflow-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <caption className="sr-only">Most recent LLM calls</caption>
        <thead className="sticky top-0 border-b border-border bg-card">
          <tr>
            <Th>Time</Th>
            <Th>Task</Th>
            <Th>Tier</Th>
            <Th>Status</Th>
            <Th right>Latency</Th>
            <Th right>First token</Th>
            <Th right>Output</Th>
          </tr>
        </thead>
        <tbody className="tabular [&_td]:whitespace-nowrap">
          {calls.length === 0 ? (
            <Empty cols={7} text="No LLM calls yet. Send a chat message or run an Oracle analysis." />
          ) : (
            calls.map((c, i) => (
              <tr key={`${c.ts}-${i}`} className="border-b border-border last:border-0" title={`Request ${c.request_id} · ${c.model}`}>
                <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{formatClock(c.ts)}</td>
                <td className="px-3 py-2 capitalize">{c.task}</td>
                <td className="px-3 py-2"><TierBadge tier={c.tier} /></td>
                <td className="px-3 py-2">
                  <StatusBadge status={c.status} />
                  {c.error_type && <span className="ml-1.5 font-mono text-[11px] text-muted-foreground">{c.error_type}</span>}
                </td>
                <td className="px-3 py-2 text-right">{formatMs(c.latency_ms)}</td>
                <td className="px-3 py-2 text-right">{formatMs(c.ttft_ms)}</td>
                <td className="px-3 py-2 text-right">
                  {c.output_tokens !== null ? `${c.tokens_estimated ? '~' : ''}${formatCompact(c.output_tokens)} tok` : '—'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
