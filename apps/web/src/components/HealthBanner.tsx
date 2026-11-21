'use client';
import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useBackendHealth } from '@/components/hooks/useBackendHealth';

/**
 * Global banner shown when the backend is unreachable or degraded. Wired to the
 * backend /health endpoint. Auto-clears a manual dismissal once the service
 * recovers, so a later outage is surfaced again.
 */
export function HealthBanner() {
  const status = useBackendHealth();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (status === 'ok') setDismissed(false);
  }, [status]);

  if (status === 'checking' || status === 'ok' || dismissed) return null;

  const isDown = status === 'down';
  const message = isDown
    ? "Can't reach the server. It may be waking up; a cold start can take up to a minute."
    : 'Server is up but the database is still connecting. Some features may be briefly unavailable.';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-between gap-3 px-4 py-2 text-sm ${
        isDown
          ? 'border-b border-[var(--ac-error)]/30 bg-[var(--ac-error)]/10 text-[var(--ac-error)]'
          : 'border-b border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
      }`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span className="truncate">{message}</span>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="shrink-0 rounded p-1 transition-colors hover:bg-foreground/10"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
