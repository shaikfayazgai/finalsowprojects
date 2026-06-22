"use client";

import * as React from "react";
import { FileText, Play } from "lucide-react";
import type { MockReviewerEvidence } from "@/mocks/reviewer";
import { AdminModal } from "@/app/admin/_shell/aurora-ui";

function previewBody(file: MockReviewerEvidence): string {
  // In-app preview/streaming of evidence blobs is not yet wired — show an honest
  // message rather than fabricated file contents.
  if (file.kind === "video") {
    return "Video evidence is attached to this submission. In-app playback isn't available yet — download the file to view it.";
  }
  return `In-app preview isn't available for "${file.name}" yet (${(file.sizeBytes / 1024).toFixed(0)} KB). Download the file to view its contents.`;
}

interface EvidencePreviewDialogProps {
  file: MockReviewerEvidence | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EvidencePreviewDialog({ file, open, onOpenChange }: EvidencePreviewDialogProps) {
  if (!file) return null;

  const isVideo = file.kind === "video";

  return (
    <AdminModal
      open={open}
      onClose={() => onOpenChange(false)}
      size="lg"
      icon={isVideo ? Play : FileText}
      tone="ai"
      title={file.name}
      description={`${(file.sizeBytes / 1024).toFixed(0)} KB · ${isVideo ? "Video" : "Document"} evidence`}
    >
      {isVideo ? (
        <div className="rounded-lg border border-stroke-subtle bg-bg-subtle/40 aspect-video flex flex-col items-center justify-center gap-3 px-6 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-stroke-subtle bg-surface">
            <Play className="h-6 w-6 ml-0.5 text-[var(--color-ai-text)]" strokeWidth={2} aria-hidden />
          </span>
          <p className="font-body text-[13px] text-text-secondary max-w-sm">{previewBody(file)}</p>
        </div>
      ) : (
        <pre className="max-h-[60vh] overflow-auto rounded-lg border border-stroke-subtle bg-bg-subtle/40 p-4 font-mono text-[12px] leading-relaxed text-foreground whitespace-pre-wrap">
          {previewBody(file)}
        </pre>
      )}
    </AdminModal>
  );
}
