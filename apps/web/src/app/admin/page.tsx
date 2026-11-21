"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import axios from "axios";
import { toast } from "sonner";
import { adminService, SESSION_EVENT, type SessionEndReason } from "@/services/adminService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AgentManager } from "@/components/admin/AgentManager";
import { KnowledgeBase } from "@/components/admin/KnowledgeBase";
import { SystemDashboard } from "@/components/admin/SystemDashboard";
import { Activity, Bot, Database, Loader2, Lock, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "overview" | "knowledge" | "agents";

const TABS: { id: Tab; label: string; icon: typeof Activity }[] = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "knowledge", label: "Knowledge base", icon: Database },
  { id: "agents", label: "Agents", icon: Bot },
];

function loginErrorMessage(err: unknown): string {
  const status = axios.isAxiosError(err) ? err.response?.status : undefined;
  if (status === 401) return "Invalid password";
  if (status === 429) {
    const retry = Number(axios.isAxiosError(err) ? err.response?.headers["retry-after"] : NaN);
    const minutes = Number.isFinite(retry) && retry > 0 ? Math.ceil(retry / 60) : null;
    return minutes
      ? `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`
      : "Too many failed attempts. Try again later.";
  }
  if (status === 503) return "Admin access isn't configured on the server.";
  if (status === 422) return "That password is too long.";
  return "Couldn't reach the server. Try again.";
}

function LoginForm() {
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Please enter a password");
      return;
    }
    setLoggingIn(true);
    setError(null);
    try {
      await adminService.login(password);
      setPassword("");
      toast.success("Signed in");
    } catch (err) {
      setError(loginErrorMessage(err));
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="flex h-full items-center justify-center overflow-y-auto p-4">
      <div className="surface w-full max-w-sm p-6 shadow-card">
        <span className="mb-4 flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary-ink">
          <Lock className="size-5" aria-hidden="true" />
        </span>
        <h1 className="text-lg font-semibold">Admin sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor the system, manage the knowledge base and configure agents.
        </p>
        <form onSubmit={handleLogin} className="mt-5 space-y-3" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="admin-password" className="text-sm font-medium">Password</label>
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!error}
              aria-describedby={error ? "admin-password-error" : undefined}
            />
            {error && (
              <p id="admin-password-error" className="text-xs text-critical" role="alert">{error}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={loggingIn}>
            {loggingIn ? (
              <>
                <Loader2 className="animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
        <p className="mt-4 text-[11px] text-subtle-foreground">Your session ends when you sign out, close this tab, or after a few hours.</p>
      </div>
    </div>
  );
}

/** Re-read the stored session when this tab (custom event) or another tab (storage event) changes it. */
function subscribeToSession(onChange: () => void) {
  window.addEventListener(SESSION_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(SESSION_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export default function AdminPage() {
  // Browser storage is an external store: read it via useSyncExternalStore so
  // the server render (null = unknown) and the client agree without an effect.
  const isAuthenticated = useSyncExternalStore(subscribeToSession, adminService.isAuthenticated, () => null);
  const [tab, setTab] = useState<Tab>("overview");

  // A stored token can outlive its server-side session (API restart, revoked
  // elsewhere): check once on load so the console doesn't flash stale data.
  useEffect(() => {
    void adminService.verifySession();
  }, []);

  // Sign out at the moment the token lapses rather than on the next failed call.
  useEffect(() => {
    if (!isAuthenticated) return;
    const expiresAt = adminService.sessionExpiresAt();
    if (expiresAt === null) return;
    // setTimeout overflows past ~24.8 days; sessions are capped at 7.
    const timer = window.setTimeout(adminService.expireSession, Math.max(0, expiresAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [isAuthenticated]);

  // Any admin call that gets a 401 ends the session centrally; tell the user once.
  useEffect(() => {
    const onChange = (e: Event) => {
      const reason = (e as CustomEvent<{ reason?: SessionEndReason }>).detail?.reason;
      if (reason === "expired") toast.error("Session expired. Please sign in again.");
    };
    window.addEventListener(SESSION_EVENT, onChange);
    return () => window.removeEventListener(SESSION_EVENT, onChange);
  }, []);

  const handleLogout = async () => {
    await adminService.logout();
    toast.success("Signed out");
  };

  const handleUnauthorized = useCallback(() => adminService.expireSession(), []);

  if (isAuthenticated === null) {
    return (
      <div className="flex h-full items-center justify-center" aria-busy="true">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return <LoginForm />;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6">
        <header className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-1">Administration</p>
            <h1 className="text-2xl font-semibold tracking-tight">System console</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut />
            Log out
          </Button>
        </header>

        <div role="tablist" aria-label="Admin sections" className="mb-5 flex gap-1 overflow-x-auto overflow-y-hidden border-b border-border [scrollbar-width:none]">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              id={`admin-tab-${id}`}
              role="tab"
              type="button"
              aria-selected={tab === id}
              aria-controls={`admin-panel-${id}`}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/60",
                tab === id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`admin-panel-${tab}`} aria-labelledby={`admin-tab-${tab}`}>
          {tab === "overview" && <SystemDashboard onUnauthorized={handleUnauthorized} />}
          {tab === "knowledge" && <KnowledgeBase onUnauthorized={handleUnauthorized} />}
          {tab === "agents" && <AgentManager />}
        </div>
      </div>
    </div>
  );
}
