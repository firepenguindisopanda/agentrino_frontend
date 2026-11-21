'use client';

import { useEffect, useRef, useState } from 'react';
import { useOracleChat } from '@/components/hooks/useOracleChat';
import { ComparativeAnalysis } from '@/components/oracle/ComparativeAnalysis';
import { Button } from '@/components/ui/button';
import { MAX_MESSAGE_CHARS } from '@/components/chat/MessageInput';
import { ArrowUp, Gem, Layers, Database, GitBranch, Loader2, RotateCcw, X } from 'lucide-react';

const EXAMPLE_QUESTIONS = [
  {
    title: 'Architecture decision',
    icon: Layers,
    question: 'Should I use microservices or a monolith for my new SaaS application?',
  },
  {
    title: 'Tech stack',
    icon: Database,
    question: 'What database should I use for a real-time chat application with millions of users?',
  },
  {
    title: 'Refactoring strategy',
    icon: GitBranch,
    question: 'I have a complex refactoring task. What approach would minimize risk while improving code quality?',
  },
];

/** What the Oracle is doing, phrased by elapsed time (the call can take up to 60s). */
function phaseFor(seconds: number) {
  if (seconds < 4) return 'Reading your question';
  if (seconds < 12) return 'Retrieving relevant knowledge';
  if (seconds < 30) return 'Weighing four alternatives';
  return 'Drafting the action plan';
}

function AnalysisSkeleton({ onCancel }: { onCancel: () => void }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const started = Date.now();
    const id = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="surface flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <Loader2 className="size-4 animate-spin text-primary" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium">{phaseFor(elapsed)}…</p>
            <p className="tabular text-xs text-muted-foreground">{elapsed}s elapsed · usually 10 to 40s</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X />
          Cancel
        </Button>
      </div>
      <div className="h-28 animate-pulse rounded-xl bg-muted" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" style={{ animationDelay: `${i * 120}ms` }} />
        ))}
      </div>
    </div>
  );
}

export default function OraclePage() {
  const [question, setQuestion] = useState('');
  const [asked, setAsked] = useState<string[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const {
    bottomLine,
    options,
    actionPlan,
    watchOutFor,
    isLoading,
    error,
    hasSubmitted,
    followUpMode,
    submitQuestion,
    askFollowUp,
    cancel,
    reset,
  } = useOracleChat();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }, [question]);

  const handleSubmit = async () => {
    const q = question.trim();
    if (!q || isLoading) return;
    setAsked((prev) => [...prev, q]);
    setQuestion('');
    if (followUpMode) await askFollowUp(q);
    else await submitQuestion(q);
  };

  const handleReset = () => {
    reset();
    setAsked([]);
    setQuestion('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit();
    }
  };


  const showIntro = !hasSubmitted && !isLoading;
  const latestQuestion = asked.at(-1);

  // One composer, placed by state: above the examples before the first
  // analysis, and below the results afterwards so the answer reads first.
  const composer = (
    <div className="surface p-2 shadow-card focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20">
      <label htmlFor="oracle-question" className="sr-only">
        {followUpMode ? 'Ask a follow-up question' : 'Describe your challenge'}
      </label>
      <textarea
        id="oracle-question"
        ref={inputRef}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={MAX_MESSAGE_CHARS}
        rows={followUpMode ? 1 : 3}
        disabled={isLoading}
        placeholder={
          followUpMode
            ? 'Ask a follow-up, e.g. "What if the team is only two engineers?"'
            : 'Describe the decision you are facing, with any constraints: team size, scale, deadline, existing stack…'
        }
        className="block max-h-60 w-full resize-none bg-transparent px-3 py-2.5 text-[15px] leading-6 outline-none placeholder:text-subtle-foreground disabled:opacity-60"
      />
      <div className="flex items-center justify-between gap-3 px-2 pb-1 pt-1">
        <span className="hidden text-[11px] text-subtle-foreground sm:inline">
          <kbd className="rounded border border-border bg-muted px-1 font-sans">Enter</kbd> to submit ·{' '}
          <kbd className="rounded border border-border bg-muted px-1 font-sans">Shift + Enter</kbd> for new line
        </span>
        <Button onClick={handleSubmit} disabled={!question.trim() || isLoading} size="sm" className="ml-auto">
          {isLoading ? <Loader2 className="animate-spin" /> : followUpMode ? <ArrowUp /> : <Gem />}
          {isLoading ? 'Analyzing...' : followUpMode ? 'Ask follow-up' : 'Get analysis'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl space-y-6 px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
        <header className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-card">
              <Gem className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Oracle</h1>
              <p className="text-sm text-muted-foreground">
                Strategic technical advisor: four alternatives, honest trade-offs, one recommendation.
              </p>
            </div>
          </div>
          {(hasSubmitted || error) && (
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw />
              New analysis
            </Button>
          )}
        </header>

        {asked.length > 0 && (
          <ol aria-label="Questions in this analysis" className="space-y-1.5">
            {asked.map((q, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="eyebrow mt-0.5 shrink-0">{i === 0 ? 'Asked' : 'Follow-up'}</span>
                <span className={i === asked.length - 1 ? 'text-foreground' : 'text-muted-foreground'}>{q}</span>
              </li>
            ))}
          </ol>
        )}

        {!hasSubmitted && composer}

        {showIntro && !error && (
          <section aria-labelledby="examples-heading">
            <h2 id="examples-heading" className="eyebrow mb-3">
              Try an example
            </h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {EXAMPLE_QUESTIONS.map(({ title, icon: Icon, question: q }) => (
                <button
                  key={title}
                  type="button"
                  onClick={() => {
                    setQuestion(q);
                    inputRef.current?.focus();
                  }}
                  className="surface group flex flex-col gap-2 p-4 text-left outline-none transition-[border-color,box-shadow] hover:border-border-strong hover:shadow-card focus-visible:ring-2 focus-visible:ring-ring/60"
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Icon className="size-4 text-primary-ink" aria-hidden="true" />
                    {title}
                  </span>
                  <span className="text-[13px] leading-relaxed text-muted-foreground">{q}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {isLoading && <AnalysisSkeleton onCancel={cancel} />}

        {error && !isLoading && (
          <div role="alert" className="surface border-critical/30 bg-critical-soft p-4">
            <p className="text-sm font-medium text-foreground">{error}</p>
            <div className="mt-3 flex gap-2">
              {latestQuestion && (
                <Button
                  size="sm"
                  onClick={() => {
                    setAsked((prev) => prev.slice(0, -1));
                    setQuestion(latestQuestion);
                    inputRef.current?.focus();
                  }}
                >
                  Edit and retry
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleReset}>
                Start over
              </Button>
            </div>
          </div>
        )}

        {hasSubmitted && !isLoading && !error && options.length > 0 && (
          <ComparativeAnalysis
            question={asked[0]}
            bottomLine={bottomLine}
            options={options}
            actionPlan={actionPlan}
            watchOutFor={watchOutFor}
          />
        )}

        {hasSubmitted && !isLoading && !error && options.length === 0 && (
          <p className="surface p-8 text-center text-sm text-muted-foreground">
            No analysis results returned. Please try rephrasing your question.
          </p>
        )}

        {hasSubmitted && (
          <section aria-label="Follow-up">
            <h2 className="eyebrow mb-2">Refine this analysis</h2>
            {composer}
          </section>
        )}
      </div>
    </div>
  );
}
