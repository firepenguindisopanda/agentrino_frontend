import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }));
vi.mock("@/services/apiConfig", () => ({ apiClient: api }));

import { adminService, SESSION_EVENT } from "@/services/adminService";

const HOUR = 3600;
const nowSec = () => Date.now() / 1000;

function unauthorized() {
  return new AxiosError("Unauthorized", "ERR_BAD_REQUEST", undefined, undefined, {
    status: 401,
    statusText: "Unauthorized",
    data: {},
    headers: {},
    config: { headers: new AxiosHeaders() },
  });
}

async function signIn(token = "tok-123", expiresAt = nowSec() + HOUR) {
  api.post.mockResolvedValueOnce({ data: { authenticated: true, token, expires_at: expiresAt } });
  await adminService.login("pw");
}

describe("adminService sessions", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.clearAllMocks();
  });
  afterEach(() => vi.useRealTimers());

  it("stores only the server token, never the password", async () => {
    await signIn();
    expect(api.post).toHaveBeenCalledWith("/admin/auth", { password: "pw" });
    expect(adminService.isAuthenticated()).toBe(true);
    const everything = JSON.stringify({ ...sessionStorage }) + JSON.stringify({ ...localStorage });
    expect(everything).not.toContain('"pw"');
    expect(everything).toContain("tok-123");
  });

  it("sends the token as a Bearer header on admin calls", async () => {
    await signIn();
    api.get.mockResolvedValueOnce({ data: { total_documents: 3 } });
    await adminService.getDocumentStats();
    expect(api.get).toHaveBeenCalledWith("/admin/documents", { headers: { Authorization: "Bearer tok-123" } });
    expect(JSON.stringify(api.get.mock.calls)).not.toContain("X-Admin-Password");
  });

  it("deletes a password left in storage by older builds", () => {
    localStorage.setItem("admin_password", "legacy");
    sessionStorage.setItem("admin_password", "legacy");
    expect(adminService.isAuthenticated()).toBe(false);
    expect(localStorage.getItem("admin_password")).toBeNull();
    expect(sessionStorage.getItem("admin_password")).toBeNull();
  });

  it("treats an expired token as signed out and refuses to send it", async () => {
    await signIn("old", nowSec() - 1);
    expect(adminService.isAuthenticated()).toBe(false);
    const events: Event[] = [];
    window.addEventListener(SESSION_EVENT, (e) => events.push(e), { once: true });
    await expect(adminService.getMetrics()).rejects.toThrow("Not authenticated");
    expect(api.get).not.toHaveBeenCalled();
    expect((events[0] as CustomEvent).detail).toEqual({ signedIn: false, reason: "expired" });
  });

  it("drops the session and announces expiry when the server answers 401", async () => {
    await signIn();
    const reasons: unknown[] = [];
    const listener = (e: Event) => reasons.push((e as CustomEvent).detail.reason);
    window.addEventListener(SESSION_EVENT, listener);
    api.delete.mockRejectedValueOnce(unauthorized());
    await expect(adminService.deleteAgent("a1")).rejects.toBeInstanceOf(AxiosError);
    window.removeEventListener(SESSION_EVENT, listener);
    expect(adminService.isAuthenticated()).toBe(false);
    expect(reasons).toEqual(["expired"]);
  });

  it("keeps the session on non-auth failures", async () => {
    await signIn();
    api.get.mockRejectedValueOnce(new Error("Network Error"));
    await expect(adminService.getMetrics()).rejects.toThrow("Network Error");
    expect(adminService.isAuthenticated()).toBe(true);
  });

  it("logout revokes server-side and clears locally even if the call fails", async () => {
    await signIn();
    api.post.mockRejectedValueOnce(new Error("offline"));
    await adminService.logout();
    expect(api.post).toHaveBeenLastCalledWith("/admin/logout", null, {
      headers: { Authorization: "Bearer tok-123" },
    });
    expect(adminService.isAuthenticated()).toBe(false);
  });

  it("verifySession clears a token the server no longer knows", async () => {
    await signIn();
    api.get.mockRejectedValueOnce(unauthorized());
    expect(await adminService.verifySession()).toBe(false);
    expect(adminService.isAuthenticated()).toBe(false);
  });

  it("verifySession keeps the session through a network blip", async () => {
    await signIn();
    api.get.mockRejectedValueOnce(new Error("Network Error"));
    expect(await adminService.verifySession()).toBe(true);
    expect(adminService.isAuthenticated()).toBe(true);
  });

  it("exposes expiry in milliseconds", async () => {
    const exp = Math.round(nowSec()) + HOUR;
    await signIn("t", exp);
    expect(adminService.sessionExpiresAt()).toBe(exp * 1000);
  });
});
