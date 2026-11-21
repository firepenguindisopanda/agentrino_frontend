'use client';
import { useEffect, useRef, useState } from 'react';
import { getBackendHealth, type BackendHealth } from '@/services/healthService';

export type HealthState = BackendHealth | 'checking';

/** Polls the backend /health endpoint on an interval. */
export function useBackendHealth(intervalMs = 30000): HealthState {
  const [status, setStatus] = useState<HealthState>('checking');
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let active = true;

    const check = async () => {
      const result = await getBackendHealth();
      if (active) setStatus(result);
    };

    check();
    timer.current = setInterval(check, intervalMs);

    return () => {
      active = false;
      if (timer.current) clearInterval(timer.current);
    };
  }, [intervalMs]);

  return status;
}
