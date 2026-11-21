import { describe, expect, it } from 'vitest';
import {
  analysisToMarkdown,
  computeOptionMetrics,
  parseEffort,
  summarizeAnalysis,
} from '@/lib/oracleAnalytics';
import type { OracleOption } from '@/store/slices/oracleSlice';

const option = (over: Partial<OracleOption>): OracleOption => ({
  title: 'Option',
  description: 'desc',
  pros: ['p1'],
  cons: ['c1'],
  effort: 'Medium',
  recommended: false,
  ...over,
});

describe('parseEffort', () => {
  it.each([
    ['Quick(<1h)', 1, 'Quick'],
    ['Short (1-4h)', 2, 'Short'],
    ['Medium(1-2d)', 3, 'Medium'],
    ['Large(3d+)', 4, 'Large'],
    ['LARGE', 4, 'Large'],
  ])('reads the schema keyword in %s', (raw, level, label) => {
    expect(parseEffort(raw)).toMatchObject({ level, label });
  });

  it.each([
    ['about 30 minutes or 0.5 hours', 1],
    ['roughly 3 hours', 2],
    ['8 hours', 3],
    ['2 days', 3],
    ['5 days', 4],
    ['two weeks, 2 weeks', 4],
  ])('falls back to units in free text: %s', (raw, level) => {
    expect(parseEffort(raw).level).toBe(level);
  });

  it('marks uninterpretable effort as unrated instead of guessing', () => {
    expect(parseEffort('it depends')).toEqual({ level: null, label: 'Unrated', range: 'it depends' });
    expect(parseEffort(undefined)).toMatchObject({ level: null, range: 'not given' });
  });
});

describe('computeOptionMetrics / summarizeAnalysis', () => {
  const options = [
    option({ title: 'Monolith', effort: 'Quick', pros: ['a', 'b', 'c'], cons: ['x'], recommended: true }),
    option({ title: 'Microservices', effort: 'Large', pros: ['a'], cons: ['x', 'y', 'z'] }),
    option({ title: 'Modular', effort: 'Medium', pros: [], cons: [] }),
  ];

  it('derives letters, counts and balance from the returned fields only', () => {
    const m = computeOptionMetrics(options);
    expect(m.map((x) => x.key)).toEqual(['A', 'B', 'C']);
    expect(m[0]).toMatchObject({ pros: 3, cons: 1, balance: 2, recommended: true });
    expect(m[1]).toMatchObject({ pros: 1, cons: 3, balance: -2 });
    expect(m[2]).toMatchObject({ pros: 0, cons: 0, balance: 0 });
  });

  it('summarizes the recommendation and whether it is the cheapest option', () => {
    const s = summarizeAnalysis(computeOptionMetrics(options));
    expect(s.recommended?.title).toBe('Monolith');
    expect(s.recommendedIsLowestEffort).toBe(true);
    expect(s.maxPros).toBe(3);
    expect(s.maxCons).toBe(3);
  });

  it('handles an analysis without a recommendation', () => {
    const s = summarizeAnalysis(computeOptionMetrics([option({}), option({})]));
    expect(s.recommended).toBeNull();
    expect(s.recommendedIsLowestEffort).toBe(false);
  });
});

describe('analysisToMarkdown', () => {
  it('exports a shareable document with every section', () => {
    const md = analysisToMarkdown({
      question: 'Monolith or microservices?',
      bottomLine: 'Start with a modular monolith.',
      options: [option({ title: 'Monolith', recommended: true })],
      actionPlan: ['Define module boundaries'],
      watchOutFor: ['Shared database coupling'],
    });
    expect(md).toContain('# Monolith or microservices?');
    expect(md).toContain('## Recommendation');
    expect(md).toContain('| A | Monolith ★ | Medium | 1 | 1 |');
    expect(md).toContain('### A. Monolith (recommended)');
    expect(md).toContain('1. Define module boundaries');
    expect(md).toContain('- Shared database coupling');
  });
});
