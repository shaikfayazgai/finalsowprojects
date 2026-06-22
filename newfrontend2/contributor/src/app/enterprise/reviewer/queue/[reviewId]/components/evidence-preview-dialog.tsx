"use client";

import * as React from "react";
import { FileText, Play } from "lucide-react";
import type { MockReviewerEvidence } from "@/mocks/reviewer";
import { AdminModal } from "@/app/admin/_shell/aurora-ui";

const MOCK_PREVIEW: Record<string, string> = {
  "spec.md": `# Focus scope specification

## Scope
- Trap focus inside the date picker overlay on open
- Restore focus to the trigger on close (ESC or outside click)

## Test matrix
| Browser | Focus trap | ESC restore |
|---------|------------|-------------|
| Chrome  | Pass       | Pass        |
| Firefox | Pass       | Pass        |
| Safari  | Pass       | Pass        |`,
  "aria-test.md": `# ARIA live region tests

Screen reader announces month changes via \`aria-live="polite"\`.
Verified with VoiceOver and NVDA.`,
  "tests.txt": `PASS focus-trap-on-open
PASS esc-closes-and-restores
PASS tab-cycles-within-picker
PASS shift-tab-reverses
PASS aria-live-month-change
PASS mobile-touch-outside-dismisses`,
  "implementation.md": `# CSV export implementation

Streaming export with backpressure at 100k rows.
UTF-8 BOM included for Excel compatibility.`,
  "unit-tests.txt": `12 tests passed — export honors filters, streams rows, BOM present.`,
};

function previewBody(file: MockReviewerEvidence): string {
  if (file.kind === "video") {
    return "Video evidence attached for this submission. In production this opens a signed URL player.";
  }
  return MOCK_PREVIEW[file.name] ?? `# ${file.name}\n\nPreview content for this evidence file (${(file.sizeBytes / 1024).toFixed(0)} KB).`;
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
