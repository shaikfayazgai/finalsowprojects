"use client";

/**
 * Workroom evidence — spec doc 01 §5.E.1 + §6.1.
 *
 * Spec layout:
 *   ┌────────────────────────────────┐
 *   │ 📄 spec.md      42KB  ✓ scan   │
 *   │ 📄 demo.mp4     18MB  ✓ scan   │
 *   │ 📄 tests.txt    2KB   ✓ scan   │
 *   └────────────────────────────────┘
 *   [ + Drag a file or click to upload ]
 *
 * §6.1 drop zone: drag-drop or click; multi-file; per-file progress;
 * virus + plagiarism scan badges; replace/delete actions.
 *
 * Upload flow: POST /api/contributor/tasks/[taskId]/workroom/uploads
 * with multipart form-data → returns { url, ... } → call
 * attachArtifact({ kind:'file', name, url, mimeType, sizeBytes }).
 */

import * as React from "react";
import { File as FileIcon, Trash2, AlertTriangle, CheckCircle2, UploadCloud } from "lucide-react";
import {
  useAttachArtifact,
  useRemoveArtifact,
} from "@/lib/hooks/use-contributor-tasks";
import { ContributorApiError } from "@/lib/api/contributor-tasks";
import type { SubmissionArtifactDetail } from "@/lib/submissions/types";
import { cn } from "@/lib/utils/cn";

interface Props {
  submissionId: string;
  taskId: string;
  artifacts: SubmissionArtifactDetail[];
  readOnly?: boolean;
}

interface UploadingItem {
  id: string;
  name: string;
  sizeBytes: number;
  progress: number; // 0–100
  error: string | null;
}

function fmtSize(bytes: number | null | undefined): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function WorkroomArtifacts({ submissionId, taskId, artifacts, readOnly }: Props) {
  const attach = useAttachArtifact(submissionId);
  const remove = useRemoveArtifact(submissionId);
  const [uploading, setUploading] = React.useState<UploadingItem[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  async function uploadOne(file: File) {
    const tmpId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setUploading((u) => [...u, { id: tmpId, name: file.name, sizeBytes: file.size, progress: 10, error: null }]);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", "evidence");
      formData.append("title", file.name);
      const res = await fetch(`/api/contributor/tasks/${taskId}/workroom/uploads`, {
        method: "POST",
        body: formData,
        credentials: "same-origin",
      });
      setUploading((u) => u.map((x) => (x.id === tmpId ? { ...x, progress: 70 } : x)));
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.detail ?? body?.error ?? `Upload failed (${res.status})`);
      }
      const data = (await res.json()) as { id?: string; url?: string };
      const url = data.url ?? `upload://${data.id ?? tmpId}`;

      await attach.mutateAsync({
        kind: "file",
        name: file.name,
        url,
        mimeType: file.type || undefined,
        sizeBytes: file.size,
      });
      setUploading((u) => u.filter((x) => x.id !== tmpId));
    } catch (e) {
      const msg = e instanceof ContributorApiError ? e.message : (e as Error).message;
      setUploading((u) => u.map((x) => (x.id === tmpId ? { ...x, error: msg, progress: 0 } : x)));
      setError(msg);
    }
  }

  async function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    setError(null);
    const files = Array.from(list);
    for (const f of files) await uploadOne(f);
  }

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
    void handleFiles(e.dataTransfer.files);
  };

  const doRemove = async (id: string) => {
    setError(null);
    try { await remove.mutateAsync(id); }
    catch (e) { setError(e instanceof ContributorApiError ? e.message : (e as Error).message); }
  };

  const hasContent = artifacts.length > 0 || uploading.length > 0;

  return (
    <div className="space-y-3">
      {hasContent && (
        <ul className="divide-y divide-stroke-subtle rounded-lg border border-stroke bg-surface overflow-hidden">
          {artifacts.map((a) => (
            <ArtifactRow
              key={a.id}
              artifact={a}
              onRemove={readOnly ? undefined : () => doRemove(a.id)}
              removing={remove.isPending}
            />
          ))}
          {uploading.map((u) => (
            <UploadingRow key={u.id} item={u} />
          ))}
        </ul>
      )}

      {!readOnly && (
        <label
          onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6",
            "font-body text-[12.5px] cursor-pointer transition-colors duration-fast",
            dragOver
              ? "border-brand bg-brand-subtle text-brand-subtle-text"
              : "border-stroke-subtle text-text-secondary hover:border-stroke hover:bg-bg-subtle",
          )}
        >
          <UploadCloud className="h-4 w-4" strokeWidth={2} aria-hidden />
          <span>
            <span className="font-semibold">Drag a file</span> or{" "}
            <span className="text-text-link underline">click to upload</span>
          </span>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="sr-only"
            onChange={(e) => {
              handleFiles(e.target.files);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          />
        </label>
      )}

      {error && (
        <p className="rounded-md border border-error-border bg-error-subtle px-3 py-2 font-body text-[12px] text-error-text">
          {error}
        </p>
      )}
    </div>
  );
}

/* ─────────────────────── rows ─────────────────────── */

function ArtifactRow({
  artifact,
  onRemove,
  removing,
}: {
  artifact: SubmissionArtifactDetail;
  onRemove?: () => void;
  removing: boolean;
}) {
  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      <FileIcon className="h-4 w-4 text-text-tertiary shrink-0" strokeWidth={2} aria-hidden />
      <a
        href={artifact.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 min-w-0 font-body text-[12.5px] font-medium text-foreground hover:underline truncate"
      >
        {artifact.name}
      </a>
      <span className="font-mono text-[11px] text-text-tertiary tabular-nums shrink-0">
        {fmtSize(artifact.sizeBytes)}
      </span>
      <ScanBadge cleared={artifact.scanCleared} attempted={artifact.scanAttemptedAt !== null} error={artifact.scanError} />
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          disabled={removing}
          aria-label={`Remove ${artifact.name}`}
          className="inline-flex h-6 w-6 items-center justify-center rounded text-text-tertiary hover:text-error-text hover:bg-bg-subtle transition-colors duration-fast disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        </button>
      )}
    </li>
  );
}

function UploadingRow({ item }: { item: UploadingItem }) {
  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      <FileIcon className="h-4 w-4 text-text-tertiary shrink-0" strokeWidth={2} aria-hidden />
      <div className="flex-1 min-w-0">
        <p className="font-body text-[12.5px] font-medium text-foreground truncate">{item.name}</p>
        {item.error ? (
          <p className="font-body text-[11px] text-error-text">{item.error}</p>
        ) : (
          <div className="mt-1 h-1 rounded-full bg-bg-subtle overflow-hidden">
            <div className="h-full bg-brand transition-all duration-fast" style={{ width: `${item.progress}%` }} aria-hidden />
          </div>
        )}
      </div>
      <span className="font-mono text-[11px] text-text-tertiary tabular-nums shrink-0">
        {fmtSize(item.sizeBytes)}
      </span>
      {item.error && (
        <AlertTriangle className="h-3.5 w-3.5 text-error-text shrink-0" strokeWidth={2} aria-hidden />
      )}
    </li>
  );
}

function ScanBadge({ cleared, attempted, error }: { cleared: boolean; attempted: boolean; error: string | null }) {
  if (cleared) {
    return (
      <span
        title="Scan passed"
        className="inline-flex items-center gap-1 text-success-text shrink-0"
      >
        <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        <span className="font-body text-[10.5px] font-semibold">scan</span>
      </span>
    );
  }
  if (error) {
    return (
      <span
        title={error}
        className="inline-flex items-center gap-1 text-error-text shrink-0"
      >
        <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        <span className="font-body text-[10.5px] font-semibold">flagged</span>
      </span>
    );
  }
  if (attempted) {
    return (
      <span className="font-body text-[10.5px] text-text-tertiary shrink-0">scan…</span>
    );
  }
  return (
    <span className="font-body text-[10.5px] text-text-tertiary italic shrink-0">pending</span>
  );
}
