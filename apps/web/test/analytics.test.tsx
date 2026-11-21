import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { formatCompact, formatDuration, formatMs, formatPercent, formatRelativeTime } from '@/lib/format';
import { niceMax } from '@/components/analytics/TimeSeriesChart';
import { ComparativeAnalysis } from '@/components/oracle/ComparativeAnalysis';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('format helpers', () => {
  it('formats latency with an adaptive unit', () => {
    expect(formatMs(84.4)).toBe('84 ms');
    expect(formatMs(1530)).toBe('1.53 s');
    expect(formatMs(null)).toBe('—');
  });

  it('keeps precision for small percentages', () => {
    expect(formatPercent(0)).toBe('0%');
    expect(formatPercent(0.025)).toBe('2.5%');
    expect(formatPercent(0.25)).toBe('25%');
  });

  it('formats compact counts and durations', () => {
    expect(formatCompact(12400)).toBe('12.4K');
    expect(formatDuration(3 * 86400 + 4 * 3600)).toBe('3d 4h');
    expect(formatDuration(125)).toBe('2m');
  });

  it('formats relative time and rejects bad input', () => {
    const now = Date.parse('2026-01-01T12:00:00Z');
    expect(formatRelativeTime('2026-01-01T11:59:50Z', now)).toBe('just now');
    expect(formatRelativeTime('2026-01-01T11:55:00Z', now)).toBe('5 minutes ago');
    expect(formatRelativeTime('2025-12-31T12:00:00Z', now)).toBe('yesterday');
    expect(formatRelativeTime('not a date', now)).toBe('—');
  });
});

describe('niceMax', () => {
  it.each([
    [0, 1],
    [7, 10],
    [13, 20],
    [42, 50],
    [101, 200],
  ])('rounds %d up to %d', (input, expected) => {
    expect(niceMax(input)).toBe(expected);
  });
});

describe('ComparativeAnalysis', () => {
  const props = {
    question: 'Which database?',
    bottomLine: 'Use Postgres with read replicas.',
    options: [
      { title: 'Postgres', description: 'Relational', pros: ['ACID', 'Mature'], cons: ['Sharding'], effort: 'Short', recommended: true },
      { title: 'Cassandra', description: 'Wide column', pros: ['Writes'], cons: ['Ops', 'Modeling'], effort: 'Large', recommended: false },
      { title: 'MongoDB', description: 'Document', pros: ['Flexible'], cons: ['Joins'], effort: 'Medium', recommended: false },
      { title: 'DynamoDB', description: 'Managed KV', pros: ['Scale'], cons: ['Lock-in'], effort: 'Medium', recommended: false },
    ],
    actionPlan: ['Provision', 'Migrate', 'Load test'],
    watchOutFor: ['Connection limits'],
  };

  it('leads with the recommendation and its derived summary', () => {
    render(<ComparativeAnalysis {...props} />);
    expect(screen.getByText('Use Postgres with read replicas.')).toBeInTheDocument();
    expect(screen.getByText('3 steps')).toBeInTheDocument();
    expect(screen.getByText('(lowest of 4)')).toBeInTheDocument();
    // recommended option starts expanded, with its pros visible
    expect(screen.getByText('ACID')).toBeInTheDocument();
  });

  it('expands options with aria-expanded and switches to the comparison matrix', () => {
    render(<ComparativeAnalysis {...props} />);
    const cassandra = screen.getByRole('button', { name: /Cassandra/ });
    expect(cassandra).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(cassandra);
    expect(cassandra).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Modeling')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Compare' }));
    const table = screen.getByRole('table', { name: /Trade-off comparison/ });
    expect(table).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '1 pros, 2 cons' })).toBeInTheDocument();
    expect(screen.getByText('-1')).toBeInTheDocument();
  });
});
