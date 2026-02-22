"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  adminService,
  type UploadResponse,
  type DocumentStats,
} from "@/services/adminService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, FileText, Trash2, Lock } from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [lastUpload, setLastUpload] = useState<UploadResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const auth = adminService.isAuthenticated();
    setIsAuthenticated(auth);
    if (auth) {
      loadStats();
    }
    setLoading(false);
  }, []);

  const loadStats = async () => {
    try {
      const data = await adminService.getDocumentStats();
      setStats(data);
    } catch (err) {
      console.error(err);
      adminService.clearAdminPassword();
      setIsAuthenticated(false);
      toast.error("Session expired. Please login again.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      toast.error("Please enter a password");
      return;
    }

    setLoggingIn(true);
    try {
      await adminService.login(password);
      adminService.setAdminPassword(password);
      setIsAuthenticated(true);
      toast.success("Logged in successfully");
      loadStats();
    } catch (err) {
      console.error(err);
      toast.error("Invalid password");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    adminService.clearAdminPassword();
    setIsAuthenticated(false);
    setStats(null);
    toast.success("Logged out");
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 5MB");
      return;
    }

    const allowedTypes = [".txt", ".pdf"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!allowedTypes.includes(ext)) {
      toast.error("Only .txt and .pdf files are allowed");
      return;
    }

    setUploading(true);
    try {
      const result = await adminService.uploadDocument(file);
      setLastUpload(result);
      toast.success(
        `Uploaded ${file.name} (${result.chunks} chunks created)`
      );
      loadStats();
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--ac-primary-blue)]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-[#0a0a0a] p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-[var(--ac-primary-blue)]/10 flex items-center justify-center">
              <Lock className="w-6 h-6 text-[var(--ac-primary-blue)]" />
            </div>
            <CardTitle>Admin Login</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Enter your admin password to manage knowledge base documents
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="Admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
              />
              <Button
                type="submit"
                className="w-full bg-[var(--ac-primary-blue)] hover:bg-[var(--ac-primary-hover)]"
                disabled={loggingIn}
              >
                {loggingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-[#0a0a0a] p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Knowledge Base Admin</h1>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Upload Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf"
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-10 h-10 text-[var(--ac-primary-blue)] animate-spin mb-4" />
                    <p className="text-muted-foreground">Processing document...</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-muted-foreground mb-4" />
                    <p className="font-medium">
                      Click to upload a document
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      TXT or PDF, max 5MB
                    </p>
                  </>
                )}
              </label>
            </div>

            {lastUpload && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="font-medium text-green-700 dark:text-green-400">
                  Last upload: {lastUpload.filename}
                </p>
                <p className="text-sm text-green-600 dark:text-green-500">
                  Created {lastUpload.chunks} chunks
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-card dark:bg-[#1a1a1a] rounded-lg">
                <p className="text-sm text-muted-foreground">Total Documents</p>
                <p className="text-3xl font-bold">
                  {stats?.total_documents ?? 0}
                </p>
              </div>
              <div className="p-4 bg-card dark:bg-[#1a1a1a] rounded-lg">
                <p className="text-sm text-muted-foreground">Index Name</p>
                <p className="text-lg font-bold text-green-500 truncate" title={stats?.index_name}>
                  {stats?.index_name || "N/A"}
                </p>
              </div>
              <div className="p-4 bg-card dark:bg-[#1a1a1a] rounded-lg">
                <p className="text-sm text-muted-foreground">Embedding Model</p>
                <p className="text-sm font-medium truncate" title={stats?.embedding_model}>
                  {stats?.embedding_model || "N/A"}
                </p>
              </div>
              <div className="p-4 bg-card dark:bg-[#1a1a1a] rounded-lg">
                <p className="text-sm text-muted-foreground">Dimension</p>
                <p className="text-sm font-medium">
                  {stats?.dimension || "N/A"}
                </p>
              </div>
              <div className="p-4 bg-card dark:bg-[#1a1a1a] rounded-lg">
                <p className="text-sm text-muted-foreground">Metric</p>
                <p className="text-sm font-medium">
                  {stats?.metric || "N/A"}
                </p>
              </div>
              <div className="p-4 bg-card dark:bg-[#1a1a1a] rounded-lg col-span-2">
                <p className="text-sm text-muted-foreground">Endpoint</p>
                <p className="text-xs font-mono truncate" title={stats?.endpoint}>
                  {stats?.endpoint || "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button
            variant="link"
            onClick={() => router.push("/")}
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
