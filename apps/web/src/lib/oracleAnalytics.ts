/**
 * Derived, transparent metrics for an Oracle comparative analysis.
 *
 * Everything here is computed from fields the model actually returned (effort
 * label, pros, cons, recommended flag). Nothing is invented or weighted behind
 * the user's back: the UI shows the same counts it charts.
 */
import type { OracleOption } from '@/store/slices/oracleSlice';

export type EffortLevel = 1 | 2 | 3 | 4;

export interface EffortInfo {
  /** 1 = Quick … 4 = Large; null when the label can't be interpreted. */
  level: EffortLevel | null;
  label: 'Quick' | 'Short' | 'Medium' | 'Large' | 'Unrated';
  /** Human time range for the bucket, e.g. "1–4 h". */
  range: string;
}

const BUCKETS: Record<EffortLevel, Omit<EffortInfo, 'level'>> = {
  1: { label: 'Quick', range: '< 1 h' },
  2: { label: 'Short', range: '1–4 h' },
  3: { label: 'Medium', range: '1–2 days' },
  4: { label: 'Large', range: '3+ days' },
};

/**
 * Interpret the model's free-text effort, e.g. "Medium (1-2d)", "Quick(<1h)",
 * "about 3 days". Keyword first (the schema asks for these), then a unit
 * fallback for free text.
 */
export function parseEffort(raw: string | null | undefined): EffortInfo {
  const text = (raw ?? '').toLowerCase();
  const keyword: [RegExp, EffortLevel][] = [
    [/\bquick\b|\btrivial\b/, 1],
    [/\bshort\b|\bsmall\b|\blow\b/, 2],
    [/\bmedium\b|\bmoderate\b/, 3],
    [/\blarge\b|\bhigh\b|\bbig\b|\bmajor\b/, 4],
  ];
  for (const [re, level] of keyword) {
    if (re.test(text)) return { level, ...BUCKETS[level] };
  }
  const weeks = /(\d+(?:\.\d+)?)\s*(w|wk|week)/.exec(text);
  const days = /(\d+(?:\.\d+)?)\s*(d|day)/.exec(text);
  const hours = /(\d+(?:\.\d+)?)\s*(h|hr|hour)/.exec(text);
  let level: EffortLevel | null = null;
  if (weeks) level = 4;
  else if (days) level = Number(days[1]) >= 3 ? 4 : 3;
  else if (hours) level = Number(hours[1]) < 1 ? 1 : Number(hours[1]) <= 4 ? 2 : 3;
  if (level) return { level, ...BUCKETS[level] };
  return { level: null, label: 'Unrated', range: raw?.trim() || 'not given' };
}

export interface OptionMetrics {
  key: string; // "A", "B", …
  title: string;
  recommended: boolean;
  effort: EffortInfo;
  pros: number;
  cons: number;
  /** pros − cons: a simple, explainable trade-off balance. */
  balance: number;
}

export function optionLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

export function computeOptionMetrics(options: OracleOption[]): OptionMetrics[] {
  return options.map((o, i) => ({
    key: optionLetter(i),
    title: o.title,
    recommended: o.recommended,
    effort: parseEffort(o.effort),
    pros: o.pros?.length ?? 0,
    cons: o.cons?.length ?? 0,
    balance: (o.pros?.length ?? 0) - (o.cons?.length ?? 0),
  }));
}

export interface AnalysisSummary {
  optionCount: number;
  recommended: OptionMetrics | null;
  /** Is the recommendation also the lowest-effort option? */
  recommendedIsLowestEffort: boolean;
  maxPros: number;
  maxCons: number;
}

export function summarizeAnalysis(metrics: OptionMetrics[]): AnalysisSummary {
  const recommended = metrics.find((m) => m.recommended) ?? null;
  const rated = metrics.filter((m) => m.effort.level !== null);
  const minEffort = rated.length ? Math.min(...rated.map((m) => m.effort.level as number)) : null;
  return {
    optionCount: metrics.length,
    recommended,
    recommendedIsLowestEffort:
      !!recommended && recommended.effort.level !== null && recommended.effort.level === minEffort,
    maxPros: Math.max(0, ...metrics.map((m) => m.pros)),
    maxCons: Math.max(0, ...metrics.map((m) => m.cons)),
  };
}

/** Portable Markdown export of an analysis, for sharing in docs or tickets. */
export function analysisToMarkdown(input: {
  question?: string;
  bottomLine: string;
  options: OracleOption[];
  actionPlan: string[];
  watchOutFor: string[];
}): string {
  const lines: string[] = [];
  if (input.question) lines.push(`# ${input.question}`, '');
  lines.push('## Recommendation', '', input.bottomLine, '', '## Options', '');
  lines.push('| | Option | Effort | Pros | Cons |', '|---|---|---|---|---|');
  input.options.forEach((o, i) => {
    const mark = o.recommended ? ' ★' : '';
    lines.push(
      `| ${optionLetter(i)} | ${o.title}${mark} | ${o.effort} | ${o.pros.length} | ${o.cons.length} |`
    );
  });
  input.options.forEach((o, i) => {
    lines.push('', `### ${optionLetter(i)}. ${o.title}${o.recommended ? ' (recommended)' : ''}`, '', o.description, '');
    o.pros.forEach((p) => lines.push(`- ✅ ${p}`));
    o.cons.forEach((c) => lines.push(`- ⚠️ ${c}`));
  });
  if (input.actionPlan.length) {
    lines.push('', '## Action plan', '');
    input.actionPlan.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
  }
  if (input.watchOutFor.length) {
    lines.push('', '## Watch out for', '');
    input.watchOutFor.forEach((w) => lines.push(`- ${w}`));
  }
  return lines.join('\n');
}
