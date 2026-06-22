/**
 * File-scan domain types.
 *
 * Phase 1 ships a MOCK scanner that produces deterministic verdicts
 * from the artifact URL. The real implementation will federate to
 * ClamAV (virus) + a plagiarism vendor (Copyleaks/Turnitin) behind the
 * same `scanArtifact` interface.
 *
 * Schema reference: prisma/schema.prisma SubmissionArtifact model
 *   - scanCleared      Boolean (set true once scan passes)
 *   - scanAttemptedAt  DateTime? (when the worker last tried)
 *   - scanError        String? (most recent failure reason)
 */

export type ScanVerdict =
  | "clean"
  | "infected"
  | "plagiarized"
  | "unscannable";

export interface ScanResult {
  verdict: ScanVerdict;
  scannerVersion: string;
  /** Optional human-readable detail line stored in `scanError`. */
  details?: string;
  scannedAt: Date;
}

/**
 * Result wrapper for a single artifact processed by the worker —
 * combines the raw scan result with the row id so the caller can
 * correlate. Returned by `processPendingArtifacts`.
 */
export interface ProcessedArtifactResult extends ScanResult {
  artifactId: string;
}

export interface ProcessPendingResult {
  processed: number;
  results: ProcessedArtifactResult[];
}
