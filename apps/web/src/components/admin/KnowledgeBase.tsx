'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, FileText, Loader2, Upload } from 'lucide-react';
import { adminService, type DocumentStats, type UploadResponse } from '@/services/adminService';
import { StatTile } from '@/components/analytics/StatTile';
import { formatCompact } from '@/lib/format';
import { cn } from '@/lib/utils';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['.txt', '.pdf'];

export function KnowledgeBase({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [lastUpload, setLastUpload] = useState<UploadResponse | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadStats = useCallback(async () => {
    try {
      setStats(await adminService.getDocumentStats());
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) onUnauthorized();
      else toast.error('Could not load index statistics');
    }
  }, [onUnauthorized]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const upload = async (file: File) => {
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED.includes(ext)) {
      toast.error('Only .txt and .pdf files are allowed');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('File too large. Maximum size is 5MB');
      return;
    }
    setUploading(true);
    try {
      const result = await adminService.uploadDocument(file);
      setLastUpload(result);
      toast.success(`Uploaded ${file.name} (${result.chunks} chunks created)`);
      loadStats();
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Indexed chunks" value={formatCompact(stats?.total_documents ?? 0)} hint="Vectors in the index" />
        <StatTile label="Index" value={<span className="text-base">{stats?.index_name || '—'}</span>} hint={stats?.metric ? `${stats.metric} similarity` : undefined} />
        <StatTile label="Dimension" value={stats?.dimension || '—'} hint="Embedding vector size" />
        <StatTile
          label="Embedding model"
          value={<span className="block truncate text-sm font-medium" title={stats?.embedding_model}>{stats?.embedding_model || '—'}</span>}
        />
      </div>

      <section className="surface p-4" aria-labelledby="upload-heading">
        <h3 id="upload-heading" className="mb-1 text-sm font-semibold">Add documents</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Documents are chunked, embedded and used as retrieval context by every agent and the Oracle.
        </p>
        <label
          htmlFor="file-upload"
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file && !uploading) upload(file);
          }}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors focus-within:ring-2 focus-within:ring-ring/60',
            dragging ? 'border-primary bg-primary-soft' : 'border-border hover:border-border-strong hover:bg-muted/40',
            uploading && 'pointer-events-none opacity-70'
          )}
        >
          <input
            ref={inputRef}
            id="file-upload"
            type="file"
            accept=".txt,.pdf"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload(file);
            }}
            className="sr-only"
          />
          {uploading ? (
            <>
              <Loader2 className="mb-3 size-8 animate-spin text-primary" aria-hidden="true" />
              <p className="text-sm font-medium">Processing document…</p>
            </>
          ) : (
            <>
              <Upload className="mb-3 size-8 text-subtle-foreground" aria-hidden="true" />
              <p className="text-sm font-medium">Drop a file here, or click to choose</p>
              <p className="mt-1 text-xs text-muted-foreground">TXT or PDF, max 5MB</p>
            </>
          )}
        </label>

        {lastUpload && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-good-soft px-3 py-2 text-sm" role="status">
            <CheckCircle2 className="size-4 text-good" aria-hidden="true" />
            <FileText className="size-4 text-muted-foreground" aria-hidden="true" />
            <span className="font-medium">{lastUpload.filename}</span>
            <span className="text-muted-foreground">· {lastUpload.chunks} chunks created</span>
          </div>
        )}
      </section>

      {stats?.endpoint && (
        <p className="truncate font-mono text-[11px] text-subtle-foreground" title={stats.endpoint}>
          Endpoint: {stats.endpoint}
        </p>
      )}
    </div>
  );
}
