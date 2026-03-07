'use client';

import { useState } from 'react';
import { OracleOption } from '@/store/slices/oracleSlice';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp, CheckCircle, XCircle, Zap, Star } from 'lucide-react';
import { clsx } from 'clsx';

interface ComparativeAnalysisProps {
  bottomLine: string;
  options: OracleOption[];
  actionPlan: string[];
  watchOutFor: string[];
}

export function ComparativeAnalysis({
  bottomLine,
  options,
  actionPlan,
  watchOutFor,
}: ComparativeAnalysisProps) {
  const [expandedOption, setExpandedOption] = useState<string | null>(
    options.find((o) => o.recommended)?.title || null
  );

  const toggleExpand = (title: string) => {
    setExpandedOption(expandedOption === title ? null : title);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Bottom Line - Hero Section */}
      <div className="bg-[var(--ac-primary-blue)]/10 rounded-xl p-6 border border-[var(--ac-primary-blue)]/20">
        <div className="flex items-center gap-2 mb-2">
          <Star className="w-4 h-4 text-[var(--ac-primary-blue)]" />
          <h3 className="text-sm font-semibold text-[var(--ac-primary-blue)] uppercase tracking-wide">
            Recommendation
          </h3>
        </div>
        <p className="text-lg font-medium text-card-foreground dark:text-[var(--ac-text-primary)]">
          {bottomLine}
        </p>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map((option, index) => {
          const isExpanded = expandedOption === option.title;
          const isRecommended = option.recommended;

          return (
            <Card
              key={option.title}
              className={clsx(
                'cursor-pointer transition-all duration-300',
                isRecommended
                  ? 'border-[var(--ac-primary-blue)] shadow-lg shadow-[var(--ac-primary-blue)]/10'
                  : 'hover:border-muted-foreground/30',
                isExpanded ? 'ring-2 ring-[var(--ac-primary-blue)]/30' : ''
              )}
              onClick={() => toggleExpand(option.title)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-muted-foreground/50">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <CardTitle className="text-base font-semibold">
                      {option.title}
                    </CardTitle>
                  </div>
                  {isRecommended && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--ac-primary-blue)] text-white text-xs font-medium">
                      <Star className="w-3 h-3 text-white" />
                      Recommended
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground dark:text-[var(--ac-text-secondary)] line-clamp-2">
                  {option.description}
                </p>

                {/* Effort Badge */}
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium">
                    {option.effort}
                  </span>
                </div>

                {/* Expandable Details */}
                {isExpanded && (
                  <div className="pt-3 mt-3 border-t space-y-4 animate-in slide-in-from-top-2">
                    {/* Pros */}
                    <div>
                      <h4 className="text-xs font-semibold text-green-600 uppercase mb-2">
                        Pros
                      </h4>
                      <ul className="space-y-1">
                        {option.pros.map((pro, i) => (
                          <li
                            key={i}
                            className="text-sm flex items-start gap-2"
                          >
                            <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground dark:text-[var(--ac-text-secondary)]">
                              {pro}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Cons */}
                    <div>
                      <h4 className="text-xs font-semibold text-red-600 uppercase mb-2">
                        Cons
                      </h4>
                      <ul className="space-y-1">
                        {option.cons.map((con, i) => (
                          <li
                            key={i}
                            className="text-sm flex items-start gap-2"
                          >
                            <XCircle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground dark:text-[var(--ac-text-secondary)]">
                              {con}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Expand Indicator */}
                <button
                  className="w-full pt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(option.title);
                  }}
                >
                  {isExpanded ? (
                    <>
                      Show less
                      <ChevronUp className="w-3 h-3" />
                    </>
                  ) : (
                    <>
                      Show more
                      <ChevronDown className="w-3 h-3" />
                    </>
                  )}
                </button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Action Plan */}
      {actionPlan.length > 0 && (
        <Card className="bg-muted/30 dark:bg-[var(--ac-card-bg)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Action Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {actionPlan.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--ac-primary-blue)] text-white text-xs flex items-center justify-center font-medium">
                    {i + 1}
                  </span>
                  <span className="text-sm text-muted-foreground dark:text-[var(--ac-text-secondary)]">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Watch Out For */}
      {watchOutFor.length > 0 && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-yellow-700 dark:text-yellow-400 font-semibold">
              Watch Out For
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {watchOutFor.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground dark:text-[var(--ac-text-secondary)]">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
