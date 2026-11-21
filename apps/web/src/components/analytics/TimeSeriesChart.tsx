'use client';
import { useId, useMemo, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { formatClock } from '@/lib/format';
import { useElementWidth } from './useElementWidth';

export interface Series {
  key: string;
  label: string;
  /** A CSS colour, normally a token: "var(--series-1)". */
  color: string;
  values: number[];
}

interface TimeSeriesChartProps {
  /** Bucket start times, epoch seconds, aligned with every series' values. */
  timestamps: number[];
  series: Series[];
  height?: number;
  title: string;
  format?: (n: number) => string;
}

const PAD = { top: 12, right: 12, bottom: 24, left: 36 };

/** Round a max up to a "nice" axis bound (1, 2, 5 × 10^n). */
export function niceMax(value: number): number {
  if (value <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(value)));
  const f = value / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return nice * exp;
}

/**
 * Line chart over time with an area under the first series, a crosshair +
 * tooltip on hover/keyboard, a legend for 2+ series and a table fallback.
 * One y-axis only: series must share a unit.
 */
export function TimeSeriesChart({ timestamps, series, height = 180, title, format = String }: TimeSeriesChartProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const gradientId = useId();
  const n = timestamps.length;

  const geom = useMemo(() => {
    const innerW = Math.max(10, width - PAD.left - PAD.right);
    const innerH = Math.max(10, height - PAD.top - PAD.bottom);
    const max = niceMax(Math.max(0, ...series.flatMap((s) => s.values)));
    const x = (i: number) => PAD.left + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
    const y = (v: number) => PAD.top + innerH - (v / max) * innerH;
    // Counts are integers: only draw a midline when it lands on a whole number,
    // so labels are never rounded into duplicates or lies (0.5 → "1", 2.5 → "3").
    const ticks = max % 2 === 0 ? [0, max / 2, max] : [0, max];
    const paths = series.map((s) => {
      const line = s.values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
      const area = n ? `${line}L${x(n - 1).toFixed(1)},${y(0)}L${x(0).toFixed(1)},${y(0)}Z` : '';
      return { key: s.key, line, area };
    });
    const labelEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(innerW / 90))));
    return { innerW, innerH, max, x, y, ticks, paths, labelEvery };
  }, [width, height, series, n]);

  const total = series[0]?.values.reduce((a, b) => a + b, 0) ?? 0;

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!n) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * width;
    const ratio = (px - PAD.left) / geom.innerW;
    setActive(Math.min(n - 1, Math.max(0, Math.round(ratio * (n - 1)))));
  };

  const onKeyDown = (e: KeyboardEvent<SVGSVGElement>) => {
    if (!n) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const step = e.key === 'ArrowRight' ? 1 : -1;
      setActive((cur) => Math.min(n - 1, Math.max(0, (cur ?? n - 1) + step)));
    } else if (e.key === 'Escape') {
      setActive(null);
    }
  };

  const tooltipLeft = active !== null ? geom.x(active) : 0;
  const flip = tooltipLeft > width * 0.6;

  return (
    <figure className="m-0">
      {series.length > 1 && (
        <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Legend">
          {series.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-3 rounded-full" style={{ background: s.color }} aria-hidden="true" />
              {s.label}
            </li>
          ))}
        </ul>
      )}
      <div ref={ref} className="relative w-full">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`${title}. ${format(total)} total over ${n} intervals. Use arrow keys to inspect values.`}
          tabIndex={0}
          className="block touch-none rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          onPointerMove={onPointerMove}
          onPointerLeave={() => setActive(null)}
          onKeyDown={onKeyDown}
          onBlur={() => setActive(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={series[0]?.color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={series[0]?.color} stopOpacity="0" />
            </linearGradient>
          </defs>

          {geom.ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={geom.y(t)}
                y2={geom.y(t)}
                stroke={t === 0 ? 'var(--chart-axis)' : 'var(--chart-grid)'}
                strokeWidth={1}
              />
              <text x={PAD.left - 8} y={geom.y(t)} dy="0.32em" textAnchor="end" className="fill-subtle-foreground text-[10px] tabular">
                {format(t)}
              </text>
            </g>
          ))}

          {timestamps.map((t, i) =>
            i % geom.labelEvery === 0 || i === n - 1 ? (
              <text
                key={t}
                x={geom.x(i)}
                y={height - 6}
                textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
                className="fill-subtle-foreground text-[10px] tabular"
              >
                {formatClock(t)}
              </text>
            ) : null
          )}

          {geom.paths[0] && <path d={geom.paths[0].area} fill={`url(#${gradientId})`} />}
          {geom.paths.map((p, i) => (
            <path
              key={p.key}
              d={p.line}
              fill="none"
              stroke={series[i].color}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {active !== null && (
            <g pointerEvents="none">
              <line
                x1={geom.x(active)}
                x2={geom.x(active)}
                y1={PAD.top}
                y2={PAD.top + geom.innerH}
                stroke="var(--border-strong)"
                strokeDasharray="3 3"
              />
              {series.map((s) => (
                <circle
                  key={s.key}
                  cx={geom.x(active)}
                  cy={geom.y(s.values[active] ?? 0)}
                  r={4}
                  fill={s.color}
                  stroke="var(--card)"
                  strokeWidth={2}
                />
              ))}
            </g>
          )}
        </svg>

        {active !== null && (
          <div
            role="status"
            className="pointer-events-none absolute top-1 z-10 min-w-32 rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-card"
            style={flip ? { right: width - tooltipLeft + 12 } : { left: tooltipLeft + 12 }}
          >
            <div className="mb-1 font-medium text-foreground tabular">{formatClock(timestamps[active])}</div>
            {series.map((s) => (
              <div key={s.key} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="inline-block size-2 rounded-full" style={{ background: s.color }} aria-hidden="true" />
                  {s.label}
                </span>
                <span className="font-medium text-foreground tabular">{format(s.values[active] ?? 0)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <details className="mt-2 text-xs text-muted-foreground">
        <summary className="cursor-pointer select-none hover:text-foreground">View as table</summary>
        <div className="mt-2 max-h-48 overflow-auto rounded-md border border-border">
          <table className="w-full text-left tabular">
            <caption className="sr-only">{title}</caption>
            <thead className="sticky top-0 bg-muted text-foreground">
              <tr>
                <th scope="col" className="px-2 py-1 font-medium">Time</th>
                {series.map((s) => (
                  <th key={s.key} scope="col" className="px-2 py-1 text-right font-medium">{s.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timestamps.map((t, i) => (
                <tr key={t} className="border-t border-border">
                  <td className="px-2 py-1">{formatClock(t)}</td>
                  {series.map((s) => (
                    <td key={s.key} className="px-2 py-1 text-right">{format(s.values[i] ?? 0)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
