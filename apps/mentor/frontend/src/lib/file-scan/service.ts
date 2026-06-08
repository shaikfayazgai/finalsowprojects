/**
 * File-scan service (M20) — Doc 06 §10.1 criterion #9.
 *
 * "Contributor uploads evidence; virus + plagiarism scan completes."
 *
 * Phase 1 ships a MOCK scanner that produces deterministic verdicts
 * from artifact URL substrings:
 *   - contains "malware" / "virus"      → infected
 *   - contains "plagiarized" / "copied" → plagiarized
 *   - unrecognized URL scheme           → unscannable
 *   - everything else                   → clean
 *
 * Recognized schemes for Phase 1: http(s), s3. The real implementation
 * will replace the URL-substring rules with a ClamAV streaming probe
 * (virus) plus a plagiarism vendor call (Copyleaks/Turnitin) behind the
 * same `scanArtifact` interface.
 *
 * Flow:
 *   1. processPendingArtifacts(tx, limit) finds N artifacts that need
 *      a scan (scanCleared=false, scanAttemptedAt=null, deletedAt
 *      column doesn't exist on SubmissionArtifact in Phase 1 so we
 *      gate on submission.deletedAt indirectly via the include).
 *   2. For each, call scanArtifact() to get the verdict.
 *   3. Update the row: stamp scanAttemptedAt; set scanCleared/scanError
 *      based on verdict.
 *   4. Emit a `file_scan.complete` audit event per artifact.
 *   5. If verdict is 'infected' or 'plagiarized', notify the
 *      contributor (system.generic, severity=important).
 *
 * Worker context: this runs detached from any user request, so audit
 * events use SYSTEM_ACTOR and notifications use the default actor.
 */

import { Prisma } from "@/generated/prisma/client";
import { auditEmit, SYSTEM_ACTOR } from "@/lib/audit";
import { dispatchNotification } from "@/lib/notifications";
import type {
  ProcessPendingResult,
  ProcessedArtifactResult,
  ScanResult,
  ScanVerdict,
} from "./types";

type Tx = Prisma.TransactionClient;

const SCANNER_VERSION = "mock-1.0";
const DEFAULT_BATCH_LIMIT = 25;
const RECOGNIZED_SCHEMES = new Set(["http", "https", "s3"]);

export class FileScanServiceError extends Error {
  constructor(
    message: string,
    public code: "not_found" | "invalid_state" | "validation",
  ) {
    super(message);
    this.name = "FileScanServiceError";
  }
}

/* ───────────────────────── Pure scanner ───────────────────────── */

/**
 * Pure function — examines an artifact and returns a verdict.
 *
 * Phase 1 implementation is URL-pattern driven and deterministic
 * (idempotent: identical inputs always produce identical results).
 * Replace this body with a real virus+plagiarism federation when the
 * vendor integrations land.
 *
 * Exported as a standalone function so callers (admin tools, re-scan
 * flows, tests) can probe individual artifacts without touching the
 * database.
 */
export async function scanArtifact(artifact: {
  id: string;
  kind: string;
  url: string;
  name: string;
}): Promise<ScanResult> {
  const scannedAt = new Date();
  const url = artifact.url.toLowerCase();

  // Verdict 1: infected (virus / malware patterns)
  if (url.includes("malware") || url.includes("virus")) {
    return {
      verdict: "infected",
      scannerVersion: SCANNER_VERSION,
      details: "Mock virus-pattern match in artifact URL",
      scannedAt,
    };
  }

  // Verdict 2: plagiarized (copy / plagiarism patterns)
  if (url.includes("plagiarized") || url.includes("copied")) {
    return {
      verdict: "plagiarized",
      scannerVersion: SCANNER_VERSION,
      details: "Mock plagiarism-pattern match in artifact URL",
      scannedAt,
    };
  }

  // Verdict 3: unscannable (unrecognized URL scheme)
  const scheme = extractScheme(artifact.url);
  if (!scheme || !RECOGNIZED_SCHEMES.has(scheme)) {
    return {
      verdict: "unscannable",
      scannerVersion: SCANNER_VERSION,
      details: scheme
        ? `Unsupported URL scheme '${scheme}'`
        : "Unable to parse URL scheme",
      scannedAt,
    };
  }

  // Verdict 4: clean
  return {
    verdict: "clean",
    scannerVersion: SCANNER_VERSION,
    scannedAt,
  };
}

function extractScheme(url: string): string | null {
  const idx = url.indexOf("://");
  if (idx <= 0) return null;
  const scheme = url.slice(0, idx).toLowerCase();
  // basic sanity: scheme must be alpha + a few special chars
  if (!/^[a-z][a-z0-9+\-.]*$/.test(scheme)) return null;
  return scheme;
}

/* ───────────────────── Worker: process pending ───────────────────── */

/**
 * Find up to `limit` artifacts that need a scan and process each.
 *
 * Selection criteria:
 *   - scanCleared = false (not yet passing)
 *   - scanAttemptedAt IS NULL (never tried — failed scans require
 *     explicit re-attempt via `rescanArtifact`)
 *   - submission.deletedAt IS NULL (don't scan stale soft-deleted
 *     submissions). SubmissionArtifact itself has no deletedAt in
 *     Phase 1; we filter via the submission relation.
 *
 * Per-artifact side-effects (each in the same transaction):
 *   - Update scanCleared / scanAttemptedAt / scanError
 *   - Emit `file_scan.complete` audit event
 *   - If verdict is 'infected' or 'plagiarized', dispatch a
 *     `system.generic` notification to the submission's contributor.
 */
export async function processPendingArtifacts(
  tx: Tx,
  limit: number = DEFAULT_BATCH_LIMIT,
): Promise<ProcessPendingResult> {
  if (limit <= 0 || !Number.isInteger(limit)) {
    throw new FileScanServiceError(
      "limit must be a positive integer",
      "validation",
    );
  }

  const pending = await tx.submissionArtifact.findMany({
    where: {
      scanCleared: false,
      scanAttemptedAt: null,
      submission: { deletedAt: null },
    },
    orderBy: { createdAt: "asc" },
    take: limit,
    include: {
      submission: {
        select: { id: true, contributorId: true, tenantId: true },
      },
    },
  });

  const results: ProcessedArtifactResult[] = [];

  for (const artifact of pending) {
    const result = await scanArtifact({
      id: artifact.id,
      kind: artifact.kind,
      url: artifact.url,
      name: artifact.name,
    });
    await persistScanResult(tx, {
      artifact: {
        id: artifact.id,
        tenantId: artifact.tenantId,
        submissionId: artifact.submission.id,
        contributorId: artifact.submission.contributorId,
        name: artifact.name,
      },
      result,
    });
    results.push({ artifactId: artifact.id, ...result });
  }

  return { processed: results.length, results };
}

/**
 * Admin re-scan: clears `scanAttemptedAt` (so the worker pool will
 * pick the artifact up again) then runs a fresh scan inline.
 *
 * Returns the new result. Useful when a transient scanner error
 * needs a retry, or when a verdict was challenged and the artifact
 * URL was updated.
 */
export async function rescanArtifact(
  tx: Tx,
  artifactId: string,
): Promise<ScanResult> {
  const artifact = await tx.submissionArtifact.findFirst({
    where: { id: artifactId, submission: { deletedAt: null } },
    include: {
      submission: {
        select: { id: true, contributorId: true, tenantId: true },
      },
    },
  });
  if (!artifact) {
    throw new FileScanServiceError(
      "Artifact not found (or its submission was soft-deleted)",
      "not_found",
    );
  }

  // Clear prior attempt so the row is in the same shape the worker
  // expects on first scan. Idempotent — clearing twice is fine.
  await tx.submissionArtifact.update({
    where: { id: artifact.id },
    data: { scanAttemptedAt: null, scanError: null, scanCleared: false },
  });

  const result = await scanArtifact({
    id: artifact.id,
    kind: artifact.kind,
    url: artifact.url,
    name: artifact.name,
  });
  await persistScanResult(tx, {
    artifact: {
      id: artifact.id,
      tenantId: artifact.tenantId,
      submissionId: artifact.submission.id,
      contributorId: artifact.submission.contributorId,
      name: artifact.name,
    },
    result,
  });
  return result;
}

/* ───────────────────────── Internal helpers ───────────────────────── */

interface PersistContext {
  artifact: {
    id: string;
    tenantId: string;
    submissionId: string;
    contributorId: string;
    name: string;
  };
  result: ScanResult;
}

async function persistScanResult(
  tx: Tx,
  ctx: PersistContext,
): Promise<void> {
  const { artifact, result } = ctx;
  const isClean = result.verdict === "clean";
  const errorText = isClean
    ? null
    : `${result.verdict}: ${result.details ?? "no details"}`;

  await tx.submissionArtifact.update({
    where: { id: artifact.id },
    data: {
      scanCleared: isClean,
      scanAttemptedAt: result.scannedAt,
      scanError: errorText,
    },
  });

  // Audit emit. System actor — this isn't a request-bound flow.
  await auditEmit(
    {
      tenantId: artifact.tenantId,
      actor: SYSTEM_ACTOR,
      action: "file_scan.complete",
      resource: {
        type: "submission_artifact",
        id: artifact.id,
        label: artifact.name,
      },
      payload: {
        artifactId: artifact.id,
        verdict: result.verdict,
        scannerVersion: result.scannerVersion,
      },
      severity:
        result.verdict === "infected" || result.verdict === "plagiarized"
          ? "warning"
          : "info",
    },
    { tx },
  );

  // Notify contributor on a problematic verdict. We don't leak the
  // exact verdict text — the body is a generic ask to re-upload.
  if (isProblematicVerdict(result.verdict)) {
    await dispatchNotification(
      {
        recipientUserId: artifact.contributorId,
        tenantId: artifact.tenantId,
        kind: "system.generic",
        severity: "important",
        title: "Issue with uploaded artifact",
        body: "Our scan flagged the file. Please review and re-upload.",
        resourceType: "submission_artifact",
        resourceId: artifact.id,
      },
      { tx },
    );
  }
}

function isProblematicVerdict(v: ScanVerdict): boolean {
  return v === "infected" || v === "plagiarized";
}
