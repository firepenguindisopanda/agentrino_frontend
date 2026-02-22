"use client";

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="h-svh flex flex-col items-center justify-center p-4 bg-background dark:bg-[#0a0a0a]">
      <div className="text-center space-y-4 max-w-md">
        <h2 className="text-2xl font-bold text-[var(--ac-error)]">Something went wrong</h2>
        <p className="text-muted-foreground">{error.message || 'An unexpected error occurred'}</p>
        {error.digest && (
          <p className="text-xs text-muted-foreground">Error digest: {error.digest}</p>
        )}
        <div className="flex gap-2 justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
          >
            Go to Home
          </Button>
          <Button
            onClick={reset}
          >
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
