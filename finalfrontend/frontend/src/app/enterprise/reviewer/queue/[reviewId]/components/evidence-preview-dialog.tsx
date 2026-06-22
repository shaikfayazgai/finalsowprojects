"use client";

import * as React from "react";
import { FileText, Play } from "lucide-react";
import type { MockReviewerEvidence } from "@/mocks/reviewer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils/cn";
import { TONE, GLASS_MODAL_CLASS } from "@/app/admin/_shell/aurora-ui";

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
  return (
    MOCK_PREVIEW[file.name] ??
    `# ${file.name}\n\nPreview content for this evidence file (${(file.sizeBytes / 1024).toFixed(0)} KB).`
  );
}

interface EvidencePreviewDialogProps {
  file: MockReviewerEvidence | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EvidencePreviewDialog({
  file,
  open,
  onOpenChange,
}: EvidencePreviewDialogProps) {
  if (!file) return null;

  const isVideo = file.kind === "video";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-2xl max-h-[85vh] overflow-hidden flex flex-col", GLASS_MODAL_CLASS)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-[16px]">
            {isVideo ? (
              <Play className="h-4 w-4 shrink-0" strokeWidth={2} style={{ color: TONE.ai.text }} aria-hidden />
            ) : (
              <FileText className="h-4 w-4 shrink-0" strokeWidth={2} style={{ color: TONE.ai.text }} aria-hidden />
            )}
            {file.name}
          </DialogTitle>
          <DialogDescription className="font-body text-[12px]">
            {(file.sizeBytes / 1024).toFixed(0)} KB · {isVideo ? "Video" : "Document"} evidence
          </DialogDescription>
        </DialogHeader>

        {isVideo ? (
          <div className="rounded-xl border border-white/55 bg-white/45 backdrop-blur aspect-video flex flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/70 bg-white/65 backdrop-blur">
              <Play className="h-6 w-6 ml-0.5" strokeWidth={2} style={{ color: TONE.ai.text }} aria-hidden />
            </span>
            <p className="font-body text-[13px] text-text-secondary max-w-sm">
              {previewBody(file)}
            </p>
          </div>
        ) : (
          <pre className="flex-1 overflow-auto rounded-xl border border-white/55 bg-white/45 backdrop-blur p-4 font-mono text-[12px] leading-relaxed text-foreground whitespace-pre-wrap">
            {previewBody(file)}
          </pre>
        )}
      </DialogContent>
    </Dialog>
  );
}
