/**
 * Session persistence for in-progress upload intake (Save & exit).
 * File bytes cannot be stored — user re-attaches the same file on resume.
 */

import type { ExtractedSow } from "@/lib/enterprise/mocks/sow-extraction";

const KEY = "glimmora.sow-intake.upload-draft.v1";

export interface UploadDraftMeta {
  step: 1 | 2 | 3;
  confidentiality: "internal" | "confidential" | "restricted";
  initiative: string;
  fileMeta: { name: string; sizeBytes: number; type: string } | null;
  extracted: ExtractedSow | null;
  savedAt: string;
}

export function readUploadDraft(): UploadDraftMeta | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UploadDraftMeta;
  } catch {
    return null;
  }
}

export function writeUploadDraft(draft: UploadDraftMeta): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(draft));
}

export function clearUploadDraft(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}
