import { apiClient } from './apiConfig';

export type BackendHealth = 'ok' | 'degraded' | 'down';

/**
 * Probe the backend /health endpoint.
 * - 200            -> "ok"
 * - 503 (degraded) -> "degraded" (process up, MongoDB not reachable yet)
 * - no response    -> "down" (service unreachable / cold-starting)
 */
export async function getBackendHealth(): Promise<BackendHealth> {
  try {
    const res = await apiClient.get<{ status?: string }>('/health', { timeout: 8000 });
    return res.data?.status === 'degraded' ? 'degraded' : 'ok';
  } catch (err) {
    const status = (err as { response?: { status?: number } }).response?.status;
    if (status === 503) return 'degraded';
    return 'down';
  }
}
