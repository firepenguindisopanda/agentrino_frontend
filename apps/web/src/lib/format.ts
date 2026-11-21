/** Display formatting shared by dashboards and lists. Pure functions. */

const RTF = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

/** "3 minutes ago", "yesterday", "just now". Invalid input → "—". */
export function formatRelativeTime(input: string | number | Date, now: number = Date.now()): string {
  const ts = new Date(input).getTime();
  if (Number.isNaN(ts)) return '—';
  const diffSec = Math.round((ts - now) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 45) return 'just now';
  for (const [unit, seconds] of UNITS) {
    if (abs >= seconds || unit === 'minute') {
      return RTF.format(Math.round(diffSec / seconds), unit);
    }
  }
  return 'just now';
}

/** Compact integer: 950 → "950", 12_400 → "12.4K". */
export function formatCompact(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

/** Milliseconds with an adaptive unit: 84 → "84 ms", 1530 → "1.53 s". */
export function formatMs(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || Number.isNaN(ms)) return '—';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(ms < 10_000 ? 2 : 1)} s`;
}

/** Ratio 0..1 → "2.5%". Keeps one decimal below 10%, where precision matters. */
export function formatPercent(ratio: number | null | undefined): string {
  if (ratio === null || ratio === undefined || Number.isNaN(ratio)) return '—';
  const pct = ratio * 100;
  if (pct === 0) return '0%';
  return `${pct < 10 ? pct.toFixed(1) : Math.round(pct)}%`;
}

/** Seconds → "3d 4h", "2h 5m", "45s". */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m`;
  return `${s}s`;
}

/** Clock time for chart axes and tooltips: "14:05". */
export function formatClock(epochSeconds: number): string {
  return new Date(epochSeconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
