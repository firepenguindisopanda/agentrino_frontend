import axios from "axios";
import { apiClient } from "./apiConfig";
import type { Agent } from "./chatService";

const SESSION_KEY = "admin_session";
/** Older builds stored the raw password under this key; it is deleted on sight. */
const LEGACY_PASSWORD_KEY = "admin_password";
/** Fired on window whenever this tab signs in or out (storage events only reach other tabs). */
export const SESSION_EVENT = "admin-session-change";

export type SessionEndReason = "logout" | "expired";

interface StoredSession {
  token: string;
  expiresAt: number; // epoch ms
}

/**
 * The browser holds only a server-issued session token that expires and can be
 * revoked; the admin password is sent once, at sign-in, and never stored.
 * sessionStorage keeps the token scoped to this tab.
 */
const sessionStore = {
  get(): StoredSession | null {
    if (typeof window === "undefined") return null;
    window.localStorage.removeItem(LEGACY_PASSWORD_KEY);
    window.sessionStorage.removeItem(LEGACY_PASSWORD_KEY);
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Partial<StoredSession>;
      if (typeof parsed.token === "string" && typeof parsed.expiresAt === "number" && parsed.expiresAt > Date.now()) {
        return { token: parsed.token, expiresAt: parsed.expiresAt };
      }
    } catch {
      // corrupt entry: treated as no session
    }
    // Expired or corrupt entries are left for clear() to remove, so reading
    // stays side-effect free (this runs as a useSyncExternalStore snapshot).
    return null;
  },
  set(session: StoredSession) {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    window.dispatchEvent(new CustomEvent(SESSION_EVENT, { detail: { signedIn: true } }));
  },
  clear(reason: SessionEndReason) {
    const had = window.sessionStorage.getItem(SESSION_KEY) !== null;
    window.sessionStorage.removeItem(SESSION_KEY);
    if (had) window.dispatchEvent(new CustomEvent(SESSION_EVENT, { detail: { signedIn: false, reason } }));
  },
};

export interface AgentInput {
  name: string;
  system_prompt: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
}

function authHeaders() {
  const session = sessionStore.get();
  if (!session) {
    sessionStore.clear("expired"); // only notifies if a stale entry was left behind
    throw new Error("Not authenticated");
  }
  return { Authorization: `Bearer ${session.token}` };
}

/** Run an authenticated call; a 401 means the server no longer knows this session, so drop it. */
async function authed<T>(call: (headers: Record<string, string>) => Promise<T>): Promise<T> {
  try {
    return await call(authHeaders());
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      sessionStore.clear("expired");
    }
    throw err;
  }
}

export interface LoginResponse {
  authenticated: boolean;
  token: string;
  expires_at: number; // epoch seconds
}

export interface UploadResponse {
  filename: string;
  chunks: number;
  ids: string[];
}

export interface DocumentStats {
  total_documents: number;
  index_name: string;
  dimension: number;
  metric: string;
  embedding_model: string;
  endpoint: string;
}

export interface LatencySummary {
  p50: number | null;
  p95: number | null;
  p99: number | null;
}

export interface SeriesBucket {
  t: number; // epoch seconds (bucket start)
  count: number;
  errors: number;
}

export interface RouteStats {
  method: string;
  route: string;
  count: number;
  errors: number;
  client_errors: number;
  latency_ms: LatencySummary;
}

export interface LLMGroup {
  count: number;
  errors: number;
  latency_ms: LatencySummary;
  output_tokens: number;
  tier?: string;
  task?: string;
  model?: string;
}

export interface LLMCall {
  ts: number;
  task: string;
  tier: string;
  model: string;
  status: "ok" | "error" | "cancelled";
  latency_ms: number;
  ttft_ms: number | null;
  output_chars: number;
  output_tokens: number | null;
  tokens_estimated: boolean;
  error_type: string | null;
  request_id: string;
}

export interface ModelRoute {
  task: string;
  tier: string;
  model: string;
  max_tokens: number;
}

/** Shape of GET /admin/metrics (backend telemetry.summary + routing table). */
export interface SystemMetrics {
  generated_at: number;
  window_minutes: number;
  uptime_seconds: number;
  http: {
    requests: number;
    errors: number;
    error_rate: number;
    rate_per_min: number;
    latency_ms: LatencySummary;
    status_classes: Record<string, number>;
    routes: RouteStats[];
    series: SeriesBucket[];
  };
  llm: {
    calls: number;
    errors: number;
    cancelled: number;
    error_rate: number;
    latency_ms: LatencySummary;
    ttft_ms: LatencySummary;
    output_tokens: number;
    tokens_estimated: boolean;
    by_tier: LLMGroup[];
    by_task: LLMGroup[];
    by_model: LLMGroup[];
    series: SeriesBucket[];
    recent: LLMCall[];
  };
  routing: ModelRoute[];
}

export const adminService = {
  /** Exchange the password for a session token. Throws (axios error) on 401/429/503. */
  login: async (password: string): Promise<void> => {
    const { data } = await apiClient.post<LoginResponse>("/admin/auth", { password });
    sessionStore.set({ token: data.token, expiresAt: data.expires_at * 1000 });
  },

  /** Revoke the session server-side (best effort) and forget it locally. */
  logout: async (): Promise<void> => {
    const session = sessionStore.get();
    sessionStore.clear("logout");
    if (!session) return;
    try {
      await apiClient.post("/admin/logout", null, { headers: { Authorization: `Bearer ${session.token}` } });
    } catch {
      // The token expires on its own; nothing useful to tell the user.
    }
  },

  /** Confirm a stored token is still live (e.g. the API restarted). Clears it if not. */
  verifySession: async (): Promise<boolean> => {
    if (!sessionStore.get()) return false;
    try {
      await authed((headers) => apiClient.get("/admin/session", { headers }));
      return true;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) return false;
      return true; // network blip: keep the session, data calls will surface errors
    }
  },

  /** Mark the session as ended by the server (idempotent). */
  expireSession: () => {
    sessionStore.clear("expired");
  },

  /** Epoch ms when the current session lapses, or null when signed out. */
  sessionExpiresAt: (): number | null => sessionStore.get()?.expiresAt ?? null,

  isAuthenticated: (): boolean => {
    return sessionStore.get() !== null;
  },

  getMetrics: (windowMinutes = 60): Promise<SystemMetrics> =>
    authed(async (headers) => {
      const response = await apiClient.get<SystemMetrics>("/admin/metrics", {
        headers,
        params: { window_minutes: windowMinutes },
      });
      return response.data;
    }),

  uploadDocument: (file: File): Promise<UploadResponse> =>
    authed(async (headers) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await apiClient.post<UploadResponse>("/admin/documents/upload", formData, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
      });
      return response.data;
    }),

  getDocumentStats: (): Promise<DocumentStats> =>
    authed(async (headers) => (await apiClient.get<DocumentStats>("/admin/documents", { headers })).data),

  deleteDocument: (docId: string): Promise<{ deleted: boolean }> =>
    authed(
      async (headers) =>
        (await apiClient.delete<{ deleted: boolean }>(`/admin/documents/${docId}`, { headers })).data
    ),

  createAgent: (data: AgentInput): Promise<Agent> =>
    authed(async (headers) => (await apiClient.post<Agent>("/agents", data, { headers })).data),

  updateAgent: (id: string, data: Partial<AgentInput>): Promise<Agent> =>
    authed(async (headers) => (await apiClient.patch<Agent>(`/agents/${id}`, data, { headers })).data),

  deleteAgent: (id: string): Promise<boolean> =>
    authed(
      async (headers) => (await apiClient.delete<{ deleted: boolean }>(`/agents/${id}`, { headers })).data.deleted
    ),
};
