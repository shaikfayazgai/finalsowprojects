"use client";

/**
 * SOW intake — spec doc 02 §5.C.2-5.
 *
 *   /enterprise/sow/intake               → mode chooser (§5.C.2)
 *   /enterprise/sow/intake?mode=upload   → Upload wizard (§5.C.3, 3 steps)
 *   /enterprise/sow/intake?mode=author   → Author form  (§5.C.4)
 *   /enterprise/sow/intake?mode=template → Template stub (§5.C.5, Phase 2)
 *
 * Real-data via useCreateSow. Editorial design pass:
 *   - 22px h1 (in layout); 13.5px section heading; ≤13px body
 *   - Brand cobalt primary actions
 *   - shadow-xs cards with hairline borders
 *   - Compact wizard stepper
 *   - File dropzone with restrained padding
 *
 * Edge cases:
 *   - Empty title / short title → field-level inline hint, primary disabled
 *   - File over 20 MB → reject with toast-style error
 *   - File wrong type → reject with helper text
 *   - Backend error → surface in footer with retry-via-resubmit
 *   - Mode switch with unsaved draft → router replaces; data lives only in
 *     local state (acceptable for one-time origination flow)
 *   - Success → confirmation card with View / Submit-for-approval links
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Upload,
  PenLine,
  ChevronRight,
  CheckCircle2,
  ArrowLeft,
  FileText,
  XCircle,
  AlertTriangle,
  Sparkles,
  Plus,
  Trash2,
  Loader2,
  ShieldAlert,
  CalendarRange,
  ListChecks,
  ScrollText,
  Users,
  LayoutTemplate,
} from "lucide-react";
import { useCreateSow } from "@/lib/hooks/use-sow-v2";
import { cn } from "@/lib/utils/cn";
import { extractSow, ExtractionError, type ExtractedSow, type ClauseKind, type ExtractedClause, type ExtractedDeliverable, type RiskSeverity, type ExtractedStakeholder } from "@/lib/enterprise/mocks/sow-extraction";
import { buildUploadCreatePayload } from "@/lib/sow/intake-payload";
import {
  clearUploadDraft,
  readUploadDraft,
  writeUploadDraft,
  type UploadDraftMeta,
} from "@/lib/sow/upload-draft-storage";
import {
  clearAuthorSeed,
  readAuthorSeed,
  writeAuthorSeed,
} from "@/lib/sow/author-seed-storage";
import { SubmissionStep, type CommitArgs } from "./components/submission-step";
import { GenerateWizard } from "./components/generate-wizard";

type Mode = "upload" | "author" | "generate" | "template";
type Confidentiality = "internal" | "confidential" | "restricted";

const MAX_FILE_MB = 20;
const ACCEPTED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const ACCEPTED_EXT = [".pdf", ".doc", ".docx"];

const CONFIDENTIALITY_OPTIONS: Array<{
  value: Confidentiality;
  label: string;
  description: string;
}> = [
  {
    value: "internal",
    label: "Internal",
    description: "Default visibility within the tenant.",
  },
  {
    value: "confidential",
    label: "Confidential",
    description: "Approvers + named stakeholders only.",
  },
  {
    value: "restricted",
    label: "Restricted",
    description: "Need-to-know basis — explicit grant required.",
  },
];

/**
 * Persist the reviewer chosen at intake step 2 to the created SOW. Reviewer is
 * optional — a missing selection is a no-op, and a failed POST never blocks the
 * intake flow (the SOW is already created/submitted by this point).
 */
async function assignReviewerToSow(
  sowId: string,
  reviewer: { id: string; email?: string; name?: string } | undefined,
): Promise<void> {
  if (!reviewer?.id) return;
  try {
    const res = await fetch(`/api/superadmin/sows/${encodeURIComponent(sowId)}/reviewer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviewerId: reviewer.id,
        reviewerEmail: reviewer.email,
        reviewerName: reviewer.name,
      }),
    });
    if (!res.ok) {
      // Don't break intake (SOW already created), but make the failure visible
      // in the console so a broken assignment isn't silent.
      console.error("Reviewer assignment failed", res.status, await res.text().catch(() => ""));
    }
  } catch (err) {
    console.error("Reviewer assignment error", err);
  }
}

/* ────────────────────────── page ────────────────────────── */

export default function SowIntakePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = (searchParams.get("mode") as Mode | null) ?? null;

  // Per the locked flow, the Enterprise Admin UPLOADS the SOW — Upload is the
  // only supported intake path for now. Author / Template / Generate-with-AI
  // are kept in code but no longer reachable from the UI (default → Upload).
  const SOW_INTAKE_UPLOAD_ONLY = true;

  if (SOW_INTAKE_UPLOAD_ONLY) {
    return (
      <UploadWizard onCancel={() => router.push("/enterprise/sow")} />
    );
  }

  if (mode === "upload")
    return (
      <UploadWizard onCancel={() => router.push("/enterprise/sow/intake")} />
    );
  if (mode === "author")
    return (
      <AuthorForm onCancel={() => router.push("/enterprise/sow/intake")} />
    );
  if (mode === "generate")
    return (
      <GenerateWizard
        onCancel={() => router.push("/enterprise/sow/intake")}
        onDone={(sowId) => router.push(`/enterprise/sow/${sowId}`)}
      />
    );
  return <ModeChooser />;
}

/* ────────────────────────── §5.C.2 Mode chooser ────────────────────────── */

function ModeChooser() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <ModeCard
          mode="upload"
          icon={<Upload className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />}
          title="Upload"
          description="Drop a DOC, DOCX, or PDF to start your SOW."
          cta="Choose file"
        />
        <ModeCard
          mode="author"
          icon={<PenLine className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />}
          title="Author"
          description="Fill out a structured form yourself — fastest for short engagements."
          cta="Start authoring"
        />
        <ModeCard
          mode="template"
          icon={<LayoutTemplate className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />}
          title="Template"
          description="Start from a configured Acme template (Software, Design, …)."
          cta="Browse templates"
          href="/enterprise/sow/templates"
        />
        {/* AI generation hidden for now (kept for later re-enable) —
            uncomment to restore the "Generate with AI" entry point.
        <ModeCard
          mode="generate"
          icon={<Sparkles className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />}
          title="Generate with AI"
          description="Give a few parameters. AI drafts a full SOW — you review before submit."
          cta="Generate SOW"
          highlight
        /> */}
      </div>
    </div>
  );
}

function ModeCard({
  mode,
  icon,
  title,
  description,
  cta,
  disabled,
  highlight,
  href,
}: {
  mode?: Mode;
  icon: React.ReactNode;
  title: string;
  description: string;
  cta: string;
  disabled?: boolean;
  highlight?: boolean;
  href?: string;
}) {
  const card = (
    <div
      className={cn(
        "group relative h-full rounded-lg border bg-surface shadow-xs overflow-hidden p-4",
        "transition-colors duration-fast ease-standard",
        disabled
          ? "border-stroke-subtle opacity-70"
          : highlight
            ? "border-brand bg-brand-subtle/25 hover:bg-brand-subtle/40"
            : "border-stroke hover:border-brand hover:bg-brand-subtle/30",
      )}
    >
      {highlight && (
        <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-brand text-on-brand font-mono text-[9px] font-semibold uppercase tracking-[0.1em]">
          New
        </span>
      )}
      <span
        aria-hidden
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-md mb-3",
          disabled
            ? "bg-bg-subtle text-text-disabled"
            : "bg-brand-subtle text-brand-subtle-text",
        )}
      >
        {icon}
      </span>
      <h2
        className={cn(
          "font-body text-[14px] font-semibold tracking-[-0.005em]",
          disabled ? "text-text-disabled" : "text-foreground",
        )}
      >
        {title}
      </h2>
      <p
        className={cn(
          "mt-1 font-body text-[12px] leading-relaxed",
          disabled ? "text-text-disabled" : "text-text-secondary",
        )}
      >
        {description}
      </p>
      <div
        className={cn(
          "mt-3 inline-flex items-center gap-1 font-body text-[12px] font-semibold",
          disabled ? "text-text-disabled" : "text-brand",
        )}
      >
        {cta}
        {!disabled && (
          <ChevronRight className="h-3 w-3" strokeWidth={2.5} aria-hidden />
        )}
      </div>
    </div>
  );
  if (disabled) {
    return <div aria-disabled="true">{card}</div>;
  }
  const dest = href ?? (mode ? `/enterprise/sow/intake?mode=${mode}` : "/enterprise/sow/intake");
  return (
    <Link
      href={dest}
      className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
      aria-label={`${title} — ${description}`}
    >
      {card}
    </Link>
  );
}

/* ────────────────────────── §5.C.3 Upload wizard ────────────────────────── */

type UploadStep = 1 | 2 | 3 | 4;

function UploadWizard({ onCancel }: { onCancel: () => void }) {
  const router = useRouter();
  const createSow = useCreateSow();

  const [step, setStep] = React.useState<UploadStep>(1);
  const [file, setFile] = React.useState<File | null>(null);
  const [fileError, setFileError] = React.useState<string | null>(null);
  const [confidentiality, setConfidentiality] =
    React.useState<Confidentiality>("internal");
  const [initiative, setInitiative] = React.useState("");

  const [parsing, setParsing] = React.useState(false);
  const [extracted, setExtracted] = React.useState<ExtractedSow | null>(null);
  const [extractionError, setExtractionError] = React.useState<string | null>(null);

  const [createdSowId, setCreatedSowId] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState<"draft" | "submit" | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [committedKind, setCommittedKind] = React.useState<"draft" | "submit">("draft");

  const [resumeDraft, setResumeDraft] = React.useState<UploadDraftMeta | null>(null);

  React.useEffect(() => {
    const draft = readUploadDraft();
    if (draft) setResumeDraft(draft);
  }, []);

  const applyResumeDraft = () => {
    if (!resumeDraft) return;
    setConfidentiality(resumeDraft.confidentiality);
    setInitiative(resumeDraft.initiative);
    if (resumeDraft.extracted) {
      setExtracted(resumeDraft.extracted);
      setStep(2);
    } else {
      setStep(1);
    }
    setResumeDraft(null);
  };

  const persistDraft = (partial: Partial<UploadDraftMeta>) => {
    const draftStep = step === 4 ? 3 : step;
    writeUploadDraft({
      step: partial.step ?? (draftStep as 1 | 2 | 3),
      confidentiality,
      initiative,
      fileMeta: file
        ? { name: file.name, sizeBytes: file.size, type: file.type }
        : resumeDraft?.fileMeta ?? null,
      extracted: partial.extracted ?? extracted,
      savedAt: new Date().toISOString(),
    });
  };

  const saveAndExit = () => {
    persistDraft({ extracted });
    router.push("/enterprise/sow");
  };

  const step1Valid = !!file && !fileError;

  // Manual/test mode: the SOW intake "extraction" is auto-approved internally
  // (no AI, no manual review). On a successful parse we skip the Review step
  // and advance straight to Submit (pick approvers). Flip this to false to
  // restore the manual Review step.
  const AUTO_APPROVE_EXTRACTION = true;

  const enterStep2 = async () => {
    if (!file) return;
    setStep(2);
    setParsing(true);
    setExtracted(null);
    setExtractionError(null);
    try {
      const result = await extractSow({
        file: { name: file.name, sizeBytes: file.size, type: file.type },
        confidentialityHint: confidentiality,
        initiativeHint: initiative,
      });
      setExtracted(result);
      if (AUTO_APPROVE_EXTRACTION) {
        // Auto-approve and jump to Submit. Use the local `result` (state is
        // async and not yet committed here) and persist the draft at step 3.
        setStep(3);
        setSubmitError(null);
        writeUploadDraft({
          step: 3,
          confidentiality,
          initiative,
          fileMeta: { name: file.name, sizeBytes: file.size, type: file.type },
          extracted: result,
          savedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      setExtractionError(
        err instanceof ExtractionError
          ? err.message
          : "Extraction failed. Try another file or continue in Author mode.",
      );
    } finally {
      setParsing(false);
    }
  };

  const goToAuthorFallback = () => {
    const body = file
      ? `Linked upload: ${file.name}\n\n(Extraction did not complete — author the scope below.)`
      : "";
    writeAuthorSeed({
      title: file?.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ") ?? "",
      body,
      confidentiality,
      sourceFileName: file?.name,
    });
    clearUploadDraft();
    router.push("/enterprise/sow/intake?mode=author");
  };

  const advanceToSubmission = () => {
    if (!extracted) return;
    setStep(3);
    setSubmitError(null);
    persistDraft({ step: 3, extracted });
  };

  const handleCommit = async (args: CommitArgs) => {
    if (!extracted) return;
    setSubmitError(null);
    setSubmitting(args.kind);
    try {
      const submission = {
        approvers: Object.fromEntries(
          Object.entries(args.config.approvers).map(([k, v]) => [
            k,
            { id: v.id, email: v.email, name: v.name },
          ]),
        ),
        notify: args.config.notify,
        coverNote: args.config.coverNote || undefined,
      };

      const created = await createSow.mutateAsync({
        title: extracted.title.trim() || "Untitled SOW",
        confidentiality: extracted.classification,
        body: extracted.scopeBody.trim() || undefined,
        payload: buildUploadCreatePayload({
          extracted,
          sourceFile: file
            ? { name: file.name, sizeBytes: file.size, type: file.type }
            : null,
          submission,
        }),
      });
      setCreatedSowId(created.id);
      setCommittedKind(args.kind);
      clearUploadDraft();

      // Persist the chosen reviewer once the SOW id is known. Reviewer is
      // optional and never blocks the SOW from being created/submitted.
      await assignReviewerToSow(created.id, args.config.reviewer);

      if (args.kind === "submit") {
        const { submitSow } = await import("@/lib/api/sow-v2");
        await submitSow(created.id);
      }
      setStep(4);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save SOW");
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="space-y-4">
      {resumeDraft && (
        <div className="rounded-lg border border-brand/30 bg-brand-subtle/25 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <p className="font-body text-[12.5px] text-text-secondary">
            Resume your saved upload from{" "}
            {new Date(resumeDraft.savedAt).toLocaleString("en-GB", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
            {resumeDraft.fileMeta ? ` · ${resumeDraft.fileMeta.name}` : ""}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                clearUploadDraft();
                setResumeDraft(null);
              }}
              className="font-body text-[12px] font-semibold text-text-secondary hover:text-foreground"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={applyResumeDraft}
              className="inline-flex items-center h-8 px-3 rounded-md bg-brand text-on-brand font-body text-[12px] font-semibold"
            >
              Resume
            </button>
          </div>
        </div>
      )}

      <WizardStepper current={step} />

      {/* Step 1 — upload file + meta */}
      {step === 1 && (
        <Panel
          title="Upload your SOW"
          subtitle={`${ACCEPTED_EXT.join(", ").toUpperCase()} — max ${MAX_FILE_MB} MB. We prepare your SOW draft from the uploaded document.`}
        >
          <div className="p-4 space-y-4">
            <FileDropZone
              file={file}
              error={fileError}
              onChange={(f) => {
                setFileError(null);
                if (!f) {
                  setFile(null);
                  return;
                }
                const sizeMb = f.size / (1024 * 1024);
                const extOk =
                  ACCEPTED_TYPES.has(f.type) ||
                  ACCEPTED_EXT.some((ext) =>
                    f.name.toLowerCase().endsWith(ext),
                  );
                if (!extOk) {
                  setFileError(
                    `Unsupported file type — please use ${ACCEPTED_EXT.join(", ")}.`,
                  );
                  return;
                }
                if (sizeMb > MAX_FILE_MB) {
                  setFileError(
                    `File is ${sizeMb.toFixed(1)} MB — limit is ${MAX_FILE_MB} MB.`,
                  );
                  return;
                }
                setFile(f);
              }}
            />

            <fieldset className="space-y-2">
              <legend className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
                Confidentiality
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {CONFIDENTIALITY_OPTIONS.map((opt) => (
                  <RadioCard
                    key={opt.value}
                    name="confidentiality"
                    value={opt.value}
                    checked={confidentiality === opt.value}
                    onChange={() => setConfidentiality(opt.value)}
                    label={opt.label}
                    description={opt.description}
                  />
                ))}
              </div>
            </fieldset>

            <Field
              id="initiative"
              label="Project / initiative tag"
              hint="Optional. Used to group related SOWs in the workspace."
            >
              <TextInput
                id="initiative"
                value={initiative}
                onChange={(v) => setInitiative(v)}
                placeholder="e.g. Helios Q3 modernization"
              />
            </Field>
          </div>
          <WizardFooter
            onCancel={onCancel}
            onSaveExit={saveAndExit}
            primaryLabel="Upload + extract"
            primaryDisabled={!step1Valid}
            onPrimary={enterStep2}
          />
        </Panel>
      )}

      {/* Step 2 — AI parsing, extraction error, or review */}
      {step === 2 && extractionError && !parsing && (
        <ExtractionFailurePanel
          message={extractionError}
          filename={file?.name ?? ""}
          onBack={() => {
            setExtractionError(null);
            setStep(1);
          }}
          onCancel={onCancel}
          onRetry={enterStep2}
          onAuthor={goToAuthorFallback}
        />
      )}

      {step === 2 && !extractionError && (parsing || !extracted) && (
          <ParsingPanel filename={file?.name ?? ""} />
      )}

      {step === 2 && !extractionError && extracted && (
          <ExtractionReview
            data={extracted}
            sourceFile={file}
            onChange={setExtracted}
            onBack={() => setStep(1)}
            onCancel={onCancel}
            onSaveExit={saveAndExit}
            onSubmit={advanceToSubmission}
            saving={false}
            error={null}
          />
      )}

      {/* Step 3 — submission setup (approver pickers + SLA + cover note) */}
      {step === 3 && extracted && (
        <SubmissionStep
          title={extracted.title}
          saving={submitting}
          error={submitError}
          onBack={() => setStep(2)}
          onCancel={onCancel}
          onCommit={handleCommit}
        />
      )}

      {/* Step 4 — success */}
      {step === 4 && createdSowId && (
        <SuccessPanel
          title={committedKind === "submit" ? "Submitted for approval" : "Draft saved"}
          description={
            committedKind === "submit"
              ? "Your SOW is now in the 5-stage approval pipeline. Approvers have been notified per your selection."
              : "The SOW is saved as a draft. Open it to refine the scope, then route it through approval whenever you're ready."
          }
          sowId={createdSowId}
          committedKind={committedKind}
          onBack={() => router.push("/enterprise/sow")}
        />
      )}
    </div>
  );
}

function ExtractionFailurePanel({
  message,
  filename,
  onBack,
  onCancel,
  onRetry,
  onAuthor,
}: {
  message: string;
  filename: string;
  onBack: () => void;
  onCancel: () => void;
  onRetry: () => void;
  onAuthor: () => void;
}) {
  return (
    <Panel title="Extraction failed" subtitle={filename ? `Document: ${filename}` : undefined}>
      <div className="p-4 space-y-4">
        <div className="rounded-md border border-error-border bg-error-subtle px-3 py-2.5 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-error-text shrink-0 mt-0.5" strokeWidth={2.5} aria-hidden />
          <p className="font-body text-[12.5px] text-error-text leading-relaxed">{message}</p>
        </div>
        <p className="font-body text-[12px] text-text-secondary">
          Per spec, you can continue in Author mode — your confidentiality choice is carried over and the file name is linked in the draft body.
        </p>
      </div>
      <WizardFooter
        onBack={onBack}
        onCancel={onCancel}
        primaryLabel="Try again"
        onPrimary={onRetry}
        secondary={{ label: "Continue in Author mode", onClick: onAuthor }}
      />
    </Panel>
  );
}

/* ───── §5.C.3 Step 2a — "AI parsing…" animated panel ───── */

function ParsingPanel({ filename }: { filename: string }) {
  // AI/extraction wording hidden — neutral "processing" copy. (The extraction
  // logic underneath is unchanged.)
  const lines = [
    "Reading document…",
    "Reading title, dates, stakeholders…",
    "Organizing scope sections…",
    "Preparing the draft…",
  ];
  const [activeLine, setActiveLine] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setActiveLine((n) => Math.min(n + 1, lines.length - 1)), 400);
    return () => clearInterval(id);
  }, [lines.length]);

  return (
    <Panel
      title={
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 text-brand animate-spin" strokeWidth={2.5} aria-hidden />
          Processing your document
        </span>
      }
      subtitle={`Document: ${filename || "—"}`}
    >
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-brand animate-spin" strokeWidth={2.5} aria-hidden />
          <p className="font-body text-[12.5px] text-text-secondary">
            Preparing your SOW draft. Usually takes 1–3 seconds.
          </p>
        </div>
        <ol className="space-y-1.5">
          {lines.map((l, i) => (
            <li key={l} className="flex items-center gap-2 font-body text-[12px]">
              {i <= activeLine ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-success" strokeWidth={2.5} aria-hidden />
              ) : (
                <span aria-hidden className="h-3.5 w-3.5 inline-block rounded-full border border-stroke" />
              )}
              <span className={cn(i <= activeLine ? "text-text-secondary" : "text-text-tertiary")}>
                {l}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </Panel>
  );
}

/* ───── §5.C.3 Step 2b — Extraction review (human validation) ───── */

function ExtractionReview({
  data,
  sourceFile,
  onChange,
  onBack,
  onCancel,
  onSaveExit,
  onSubmit,
  saving,
  error,
}: {
  data: ExtractedSow;
  sourceFile: File | null;
  onChange: (d: ExtractedSow) => void;
  onBack: () => void;
  onCancel: () => void;
  onSaveExit: () => void;
  onSubmit: () => void;
  saving: boolean;
  error: string | null;
}) {
  const patch = <K extends keyof ExtractedSow>(k: K, v: ExtractedSow[K]) =>
    onChange({ ...data, [k]: v });

  const titleOk = data.title.trim().length >= 3;
  const deliverablesOk = data.deliverables.length >= 1;
  // Stakeholders are optional (Phase 1 = single enterprise admin; multi-role
  // routing + stakeholder-scoped visibility is Phase-2 backend scope).
  const canSave = titleOk && deliverablesOk;

  const sizeKb = sourceFile ? (sourceFile.size / 1024).toFixed(1) : "—";
  const confidencePct = Math.round(data.confidence * 100);

  return (
    <Panel
      title="Review what the SOW Intake Assistant extracted"
      subtitle="Edit any field. We'll save these as the draft SOW."
    >
      <div className="p-4 space-y-5">
        {/* Source + confidence banner */}
        <div className="rounded-lg border border-stroke-subtle bg-bg-subtle/40 px-3 py-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] font-body">
          <span className="inline-flex items-center gap-1.5 text-text-secondary">
            <FileText className="h-3.5 w-3.5 text-text-tertiary" strokeWidth={2} aria-hidden />
            <span className="font-mono truncate max-w-[280px]">{sourceFile?.name ?? "uploaded file"}</span>
            <span className="text-text-tertiary">· {sizeKb} KB</span>
          </span>
          {data.ocrApplied && (
            <span className="inline-flex items-center gap-1 text-text-tertiary">
              <Sparkles className="h-3 w-3" strokeWidth={2} aria-hidden /> OCR applied
            </span>
          )}
          <span
            className={cn(
              "ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10.5px] font-semibold tabular-nums",
              confidencePct >= 90 ? "bg-success-subtle text-success-text" :
              confidencePct >= 75 ? "bg-warning-subtle text-warning-text" :
              "bg-error-subtle text-error-text",
            )}
            title="Overall extraction confidence — review carefully if below 90%"
          >
            {confidencePct}% confidence
          </span>
        </div>

        {/* Title + classification */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Field id="ex-title" label="Title" required invalid={!titleOk && data.title.length > 0} hint={!titleOk && data.title.length > 0 ? "At least 3 characters" : undefined}>
              <TextInput id="ex-title" value={data.title} onChange={(v) => patch("title", v)} placeholder="SOW title" invalid={!titleOk && data.title.length > 0} />
            </Field>
          </div>
          <div>
            <Field id="ex-class" label="Classification">
              <select
                id="ex-class"
                value={data.classification}
                onChange={(e) => patch("classification", e.target.value as ExtractedSow["classification"])}
                className={inputBaseCls}
              >
                <option value="internal">Internal</option>
                <option value="confidential">Confidential</option>
                <option value="restricted">Restricted</option>
              </select>
            </Field>
          </div>
        </div>

        {/* Period */}
        <ExtractedSection icon={<CalendarRange className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />} title="Engagement period" hint={`AI estimate: ~${data.period.estimatedWeeks} weeks`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field id="ex-from" label="Start date">
              <input
                id="ex-from"
                type="date"
                value={data.period.startDate}
                max={data.period.endDate || undefined}
                onChange={(e) => patch("period", { ...data.period, startDate: e.target.value })}
                className={inputBaseCls}
              />
            </Field>
            <Field id="ex-to" label="End date">
              <input
                id="ex-to"
                type="date"
                value={data.period.endDate}
                min={data.period.startDate || undefined}
                onChange={(e) => patch("period", { ...data.period, endDate: e.target.value })}
                className={inputBaseCls}
              />
            </Field>
          </div>
        </ExtractedSection>

        {/* Stakeholders — read-only in Phase 1; editable when multi-role routing lands */}
        {data.stakeholders.length > 0 && (
          <ExtractedSection
            icon={<Users className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />}
            title="Stakeholders"
            hint={`${data.stakeholders.length} extracted · read-only`}
          >
            <ul className="rounded-md border border-stroke-subtle divide-y divide-stroke-subtle">
              {data.stakeholders.map((s) => (
                <StakeholderRow key={`${s.role}-${s.email}`} stakeholder={s} />
              ))}
            </ul>
          </ExtractedSection>
        )}

        {/* Deliverables */}
        <ExtractedSection icon={<ListChecks className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />} title="Deliverables" hint={`${data.deliverables.length} extracted`}>
          <ul className="space-y-1.5">
            {data.deliverables.map((d, i) => (
              <li key={d.id} className="rounded-md border border-stroke-subtle bg-surface px-2.5 py-1.5 flex items-center gap-2">
                <span className="font-mono text-[10px] text-text-tertiary tabular-nums w-6 shrink-0">D{String(i + 1).padStart(2, "0")}</span>
                <input
                  value={d.title}
                  onChange={(e) => {
                    const next = [...data.deliverables];
                    next[i] = { ...d, title: e.target.value };
                    patch("deliverables", next);
                  }}
                  className="flex-1 h-7 px-2 rounded border border-stroke-subtle bg-surface font-body text-[12.5px] text-foreground focus-visible:outline-none focus-visible:border-brand"
                />
                <button
                  type="button"
                  onClick={() => patch("deliverables", data.deliverables.filter((_, j) => j !== i))}
                  aria-label="Remove deliverable"
                  className="h-7 w-7 inline-flex items-center justify-center rounded text-text-tertiary hover:text-error-text hover:bg-bg-subtle"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => patch("deliverables", [...data.deliverables, { id: `d-${Date.now()}`, title: "" }])}
            className="mt-2 inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-surface border border-stroke font-body text-[12px] font-semibold text-foreground hover:bg-surface-hover transition-colors duration-fast"
          >
            <Plus className="h-3 w-3" strokeWidth={2} aria-hidden /> Add deliverable
          </button>
        </ExtractedSection>

        {/* Clauses tagged */}
        <ExtractedSection icon={<ScrollText className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />} title="Clauses tagged" hint={`${data.clauses.length} found · dependencies · assumptions · constraints`}>
          <ul className="space-y-1.5">
            {data.clauses.map((c, i) => (
              <li key={c.id} className="rounded-md border border-stroke-subtle bg-surface px-2.5 py-1.5 flex items-start gap-2">
                <select
                  value={c.kind}
                  onChange={(e) => {
                    const next = [...data.clauses];
                    next[i] = { ...c, kind: e.target.value as ClauseKind };
                    patch("clauses", next);
                  }}
                  className={cn("h-7 px-1.5 rounded border bg-surface font-mono text-[10px] uppercase tracking-[0.08em] shrink-0", clauseKindClass(c.kind))}
                >
                  <option value="dependency">Dependency</option>
                  <option value="assumption">Assumption</option>
                  <option value="constraint">Constraint</option>
                </select>
                <textarea
                  value={c.text}
                  onChange={(e) => {
                    const next = [...data.clauses];
                    next[i] = { ...c, text: e.target.value };
                    patch("clauses", next);
                  }}
                  rows={1}
                  className="flex-1 min-h-[28px] px-2 py-1 rounded border border-stroke-subtle bg-surface font-body text-[12px] text-foreground focus-visible:outline-none focus-visible:border-brand resize-y"
                />
                <span className="font-mono text-[10px] text-text-tertiary tabular-nums shrink-0 mt-1">{Math.round(c.confidence * 100)}%</span>
                <button
                  type="button"
                  onClick={() => patch("clauses", data.clauses.filter((_, j) => j !== i))}
                  aria-label="Remove clause"
                  className="h-7 w-7 inline-flex items-center justify-center rounded text-text-tertiary hover:text-error-text hover:bg-bg-subtle"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => patch("clauses", [...data.clauses, { id: `c-${Date.now()}`, kind: "dependency", text: "", confidence: 0.6 }])}
            className="mt-2 inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-surface border border-stroke font-body text-[12px] font-semibold text-foreground hover:bg-surface-hover transition-colors duration-fast"
          >
            <Plus className="h-3 w-3" strokeWidth={2} aria-hidden /> Add clause
          </button>
        </ExtractedSection>

        {/* Risk flags */}
        {data.riskFlags.length > 0 && (
          <ExtractedSection icon={<ShieldAlert className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />} title="Risk flags" hint={`${data.riskFlags.length} flagged by AI`}>
            <ul className="space-y-1.5">
              {data.riskFlags.map((r) => (
                <li
                  key={r.id}
                  className={cn(
                    "rounded-md border px-3 py-2 flex items-start gap-2.5",
                    riskClass(r.severity).bg,
                    riskClass(r.severity).border,
                  )}
                >
                  <AlertTriangle className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", riskClass(r.severity).icon)} strokeWidth={2.5} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-[12.5px] font-semibold text-foreground">
                      <span className={cn("font-mono text-[10px] uppercase tracking-[0.08em] mr-1.5", riskClass(r.severity).text)}>
                        {r.severity} · {r.category}
                      </span>
                      {r.message}
                    </p>
                    <p className="mt-0.5 font-body text-[11.5px] text-text-secondary">
                      <span className="font-semibold text-text-tertiary mr-1">Suggestion:</span>
                      {r.suggestion}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </ExtractedSection>
        )}

        {/* Scope body */}
        <Field id="ex-body" label="Scope body (Markdown)" hint="Auto-generated from the extracted sections. Edit freely.">
          <TextArea
            id="ex-body"
            value={data.scopeBody}
            onChange={(v) => patch("scopeBody", v)}
            rows={10}
          />
        </Field>
      </div>
      <WizardFooter
        onBack={onBack}
        onCancel={onCancel}
        onSaveExit={onSaveExit}
        primaryLabel="Continue · pick approvers"
        primaryDisabled={!canSave || saving}
        onPrimary={onSubmit}
        error={error}
      />
    </Panel>
  );
}

function StakeholderRow({ stakeholder }: { stakeholder: ExtractedStakeholder }) {
  const roleLabel = stakeholder.role.replace(/_/g, " ");
  return (
    <li className="px-3 py-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 font-body text-[12.5px]">
      <span className="font-semibold text-foreground">{stakeholder.name}</span>
      <span className="text-text-tertiary">{stakeholder.email}</span>
      <span className="ml-auto font-mono text-[10px] uppercase tracking-wide text-text-tertiary">
        {roleLabel}
      </span>
    </li>
  );
}

function ExtractedSection({
  icon,
  title,
  hint,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <header className="mb-1.5 flex items-center justify-between gap-3">
        <h3 className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-foreground">
          <span className="text-brand-emphasis">{icon}</span>
          {title}
        </h3>
        {hint && <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums">{hint}</span>}
      </header>
      {children}
    </section>
  );
}

function clauseKindClass(kind: ClauseKind): string {
  switch (kind) {
    case "dependency":  return "border-brand/30 text-brand-emphasis bg-brand-subtle/60";
    case "assumption":  return "border-warning-border text-warning-text bg-warning-subtle";
    case "constraint":  return "border-stroke text-text-secondary";
  }
}

function riskClass(s: RiskSeverity) {
  switch (s) {
    case "high":   return { bg: "bg-error-subtle",   border: "border-error-border",   icon: "text-error-text",   text: "text-error-text"   };
    case "medium": return { bg: "bg-warning-subtle", border: "border-warning-border", icon: "text-warning-text", text: "text-warning-text" };
    case "low":    return { bg: "bg-bg-subtle/40",   border: "border-stroke-subtle",  icon: "text-text-tertiary",text: "text-text-tertiary"};
  }
}

const inputBaseCls = "w-full h-9 px-3 rounded-md bg-surface border border-stroke font-body text-[13px] text-foreground placeholder:text-text-disabled focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25";

/* ────────────────────────── §5.C.4 Author form ────────────────────────── */

function AuthorForm({ onCancel }: { onCancel: () => void }) {
  const router = useRouter();
  const createSow = useCreateSow();

  const [phase, setPhase] = React.useState<"form" | "submit" | "done">("form");
  const [title, setTitle] = React.useState("");
  const [confidentiality, setConfidentiality] =
    React.useState<Confidentiality>("internal");
  const [body, setBody] = React.useState("");
  const [seedBanner, setSeedBanner] = React.useState<string | null>(null);

  React.useEffect(() => {
    const seed = readAuthorSeed();
    if (!seed) return;
    if (seed.title) setTitle(seed.title);
    if (seed.body) setBody(seed.body);
    setConfidentiality(seed.confidentiality);
    if (seed.sourceFileName) {
      setSeedBanner(`Continuing from failed upload · ${seed.sourceFileName}`);
    }
    clearAuthorSeed();
  }, []);

  const [createdSowId, setCreatedSowId] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState<"draft" | "submit" | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [committedKind, setCommittedKind] = React.useState<"draft" | "submit">("draft");

  const titleTrim = title.trim();
  const valid = titleTrim.length >= 3;

  const advanceToSubmission = () => {
    if (!valid) return;
    setSubmitError(null);
    setPhase("submit");
  };

  const handleCommit = async (args: CommitArgs) => {
    setSubmitting(args.kind);
    setSubmitError(null);
    try {
      const created = await createSow.mutateAsync({
        title: titleTrim,
        confidentiality,
        body: body.trim() || undefined,
        payload: {
          intakeMode: "author",
          submission: {
            approvers: Object.fromEntries(
              Object.entries(args.config.approvers).map(([k, v]) => [k, { id: v.id, email: v.email, name: v.name }]),
            ),
            notify: args.config.notify,
            coverNote: args.config.coverNote || undefined,
          },
        },
      });
      setCreatedSowId(created.id);
      setCommittedKind(args.kind);
      // Persist the chosen reviewer once the SOW id is known (optional).
      await assignReviewerToSow(created.id, args.config.reviewer);
      if (args.kind === "submit") {
        const { submitSow } = await import("@/lib/api/sow-v2");
        await submitSow(created.id);
      }
      setPhase("done");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save SOW");
    } finally {
      setSubmitting(null);
    }
  };

  if (phase === "done" && createdSowId) {
    return (
      <SuccessPanel
        title={committedKind === "submit" ? "Submitted for approval" : "Draft saved"}
        description={
          committedKind === "submit"
            ? "Your authored SOW is now in the 5-stage approval pipeline."
            : "Your authored SOW is saved as a draft."
        }
        sowId={createdSowId}
        committedKind={committedKind}
        onBack={() => router.push("/enterprise/sow")}
      />
    );
  }

  if (phase === "submit") {
    return (
      <SubmissionStep
        title={titleTrim || "Untitled SOW"}
        saving={submitting}
        error={submitError}
        onBack={() => setPhase("form")}
        onCancel={onCancel}
        onCommit={handleCommit}
      />
    );
  }

  return (
    <Panel
      title="Author a SOW"
      subtitle="Capture the engagement directly in a structured form."
    >
      <div className="p-4 space-y-4">
        {seedBanner && (
          <div className="rounded-md border border-brand/30 bg-brand-subtle/25 px-3 py-2 font-body text-[12px] text-text-secondary">
            {seedBanner}
          </div>
        )}
        <Field
          id="title"
          label="Title"
          required
          hint={
            title.length > 0 && titleTrim.length < 3
              ? "At least 3 characters"
              : undefined
          }
          invalid={title.length > 0 && titleTrim.length < 3}
        >
          <TextInput
            id="title"
            value={title}
            onChange={setTitle}
            placeholder="Helios Q3 design system modernization"
            invalid={title.length > 0 && titleTrim.length < 3}
          />
        </Field>

        <fieldset className="space-y-2">
          <legend className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
            Confidentiality
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {CONFIDENTIALITY_OPTIONS.map((opt) => (
              <RadioCard
                key={opt.value}
                name="confidentiality-author"
                value={opt.value}
                checked={confidentiality === opt.value}
                onChange={() => setConfidentiality(opt.value)}
                label={opt.label}
                description={opt.description}
              />
            ))}
          </div>
        </fieldset>

        <Field id="body" label="Scope body" hint="Markdown supported.">
          <TextArea
            id="body"
            value={body}
            onChange={setBody}
            placeholder="Deliverables, timeline, dependencies, constraints…"
            rows={14}
          />
        </Field>
      </div>
      <WizardFooter
        onCancel={onCancel}
        primaryLabel="Continue · pick approvers"
        primaryDisabled={!valid}
        onPrimary={advanceToSubmission}
        error={null}
      />
    </Panel>
  );
}

/* ────────────────────────── shared bits ────────────────────────── */

function Panel({
  title,
  subtitle,
  children,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-stroke bg-surface shadow-xs overflow-hidden">
      <header className="px-4 py-2.5 border-b border-stroke-subtle">
        <h2 className="font-body text-[13.5px] font-semibold text-foreground tracking-[-0.005em]">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 font-body text-[11.5px] text-text-tertiary">
            {subtitle}
          </p>
        )}
      </header>
      {children}
    </section>
  );
}

function WizardStepper({ current }: { current: UploadStep }) {
  const steps: Array<{ n: UploadStep; label: string }> = [
    { n: 1, label: "Upload" },
    { n: 2, label: "Review" },
    { n: 3, label: "Submit" },
    { n: 4, label: "Done" },
  ];
  const displayStep = current >= 4 ? 4 : current;
  return (
    <ol
      aria-label="Upload progress"
      className="flex items-center gap-2 font-body text-[12px]"
    >
      {steps.map((s, i) => {
        const done = displayStep > s.n;
        const active = displayStep === s.n;
        return (
          <React.Fragment key={s.n}>
            <li
              className="inline-flex items-center gap-2"
              aria-current={active ? "step" : undefined}
            >
              <span
                aria-hidden
                className={cn(
                  "inline-flex h-5 w-5 items-center justify-center rounded-full border",
                  "font-mono text-[10.5px] font-semibold tabular-nums",
                  active
                    ? "bg-brand text-white border-brand"
                    : done
                      ? "bg-success text-white border-success"
                      : "bg-surface text-text-tertiary border-stroke",
                )}
              >
                {done ? <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} /> : s.n}
              </span>
              <span
                className={cn(
                  "font-body text-[12px]",
                  active
                    ? "text-foreground font-semibold"
                    : done
                      ? "text-text-secondary"
                      : "text-text-tertiary",
                )}
              >
                {s.label}
              </span>
            </li>
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "h-px w-8 sm:w-16",
                  done ? "bg-success/40" : "bg-stroke",
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </ol>
  );
}

function FileDropZone({
  file,
  error,
  onChange,
}: {
  file: File | null;
  error: string | null;
  onChange: (f: File | null) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [drag, setDrag] = React.useState(false);

  const onDrop: React.DragEventHandler = (e) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onChange(f);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      className={cn(
        "rounded-md border border-dashed p-5 text-center",
        "transition-colors duration-fast ease-standard",
        error
          ? "border-error-border bg-error-subtle/40"
          : drag
            ? "border-brand bg-brand-subtle/40"
            : file
              ? "border-success-border bg-success-subtle/40"
              : "border-stroke bg-bg-subtle/30 hover:bg-bg-subtle/60",
      )}
    >
      {file ? (
        <div className="flex items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileText
              className="h-4 w-4 shrink-0 text-success-text"
              strokeWidth={2}
              aria-hidden
            />
            <div className="min-w-0">
              <p className="font-body text-[13px] font-semibold text-foreground truncate">
                {file.name}
              </p>
              <p className="font-mono text-[10.5px] text-text-tertiary tabular-nums">
                {(file.size / 1024).toFixed(0)} KB · {file.type || "unknown"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="font-body text-[11.5px] font-semibold text-text-link hover:underline shrink-0"
          >
            Replace
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          <Upload
            className="h-5 w-5 mx-auto text-text-tertiary"
            strokeWidth={2}
            aria-hidden
          />
          <p className="font-body text-[13px] text-foreground">
            Drop a file, or{" "}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-brand font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 rounded-sm"
            >
              choose one
            </button>
          </p>
          <p className="font-body text-[11px] text-text-tertiary">
            {ACCEPTED_EXT.join(", ")} · max {MAX_FILE_MB} MB
          </p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      {error && (
        <p className="mt-2 inline-flex items-center gap-1.5 font-body text-[11.5px] text-error-text">
          <AlertTriangle className="h-3 w-3" strokeWidth={2.5} aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}

function RadioCard({
  name,
  value,
  checked,
  onChange,
  label,
  description,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  description: string;
}) {
  return (
    <label
      className={cn(
        "block cursor-pointer rounded-md border px-3 py-2.5 select-none",
        "transition-colors duration-fast ease-standard",
        "focus-within:ring-2 focus-within:ring-brand/30",
        checked
          ? "border-brand bg-brand-subtle/40"
          : "border-stroke bg-surface hover:border-stroke-strong",
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "font-body text-[13px] font-semibold",
            checked ? "text-brand" : "text-foreground",
          )}
        >
          {label}
        </span>
        <span
          aria-hidden
          className={cn(
            "inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border shrink-0",
            checked ? "border-brand bg-brand" : "border-stroke-strong bg-surface",
          )}
        >
          {checked && (
            <span className="h-1 w-1 rounded-full bg-white" />
          )}
        </span>
      </div>
      <p className="mt-1 font-body text-[11px] text-text-tertiary leading-relaxed">
        {description}
      </p>
    </label>
  );
}

function Field({
  id,
  label,
  required,
  hint,
  invalid,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  invalid?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary block"
      >
        {label}
        {required && (
          <span className="ml-0.5 text-error-text" aria-hidden>
            *
          </span>
        )}
      </label>
      {children}
      {hint && (
        <p
          className={cn(
            "font-body text-[11px]",
            invalid ? "text-error-text" : "text-text-tertiary",
          )}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

function TextInput({
  id,
  value,
  onChange,
  placeholder,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  invalid?: boolean;
}) {
  return (
    <input
      id={id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "w-full h-9 px-3 rounded-md shadow-xs",
        "bg-surface border",
        "font-body text-[13px] text-foreground placeholder:text-text-disabled",
        "focus-visible:outline-none focus-visible:ring-2",
        invalid
          ? "border-error-border focus-visible:border-error-border focus-visible:ring-error-border/25"
          : "border-stroke focus-visible:border-brand focus-visible:ring-brand/25",
      )}
    />
  );
}

function TextArea({
  id,
  value,
  onChange,
  placeholder,
  rows = 6,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={cn(
        "w-full px-3 py-2 rounded-md shadow-xs",
        "bg-surface border border-stroke",
        "font-body text-[12.5px] text-foreground placeholder:text-text-disabled leading-relaxed",
        "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25",
        "resize-vertical",
      )}
    />
  );
}

function AiNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md bg-brand-secondary-subtle/40 border border-brand-secondary-subtle px-3 py-2 flex items-start gap-2">
      <Sparkles
        className="h-3.5 w-3.5 text-brand-secondary mt-0.5 shrink-0"
        strokeWidth={2}
        aria-hidden
      />
      <p className="font-body text-[12px] text-text-secondary leading-relaxed">
        {children}
      </p>
    </div>
  );
}

function WizardFooter({
  onBack,
  onCancel,
  onSaveExit,
  onPrimary,
  primaryLabel,
  primaryDisabled,
  error,
  secondary,
}: {
  onBack?: () => void;
  onCancel?: () => void;
  onSaveExit?: () => void;
  onPrimary: () => void;
  primaryLabel: string;
  primaryDisabled?: boolean;
  error?: string | null;
  secondary?: { label: string; onClick: () => void };
}) {
  return (
    <div className="border-t border-stroke-subtle px-4 py-3 space-y-2.5 bg-bg-subtle/30">
      {error && (
        <div className="rounded-md bg-error-subtle border border-error-border px-3 py-2 flex items-start gap-2">
          <XCircle
            className="h-3.5 w-3.5 text-error-text mt-0.5 shrink-0"
            strokeWidth={2}
            aria-hidden
          />
          <div className="min-w-0">
            <p className="font-body text-[12px] font-semibold text-error-text">
              Couldn't save
            </p>
            <p className="font-body text-[11.5px] text-error-text/85">
              {error}
            </p>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className={cn(
                "inline-flex items-center gap-1 h-8 px-3 rounded-md",
                "font-body text-[12.5px] font-semibold text-text-secondary",
                "hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast",
              )}
            >
              <ArrowLeft className="h-3 w-3" strokeWidth={2} aria-hidden />
              Back
            </button>
          )}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className={cn(
                "inline-flex items-center h-8 px-3 rounded-md",
                "font-body text-[12.5px] font-semibold text-text-secondary",
                "hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast",
              )}
            >
              Cancel
            </button>
          )}
          {onSaveExit && (
            <button
              type="button"
              onClick={onSaveExit}
              className={cn(
                "inline-flex items-center h-8 px-3 rounded-md",
                "font-body text-[12.5px] font-semibold text-text-link",
                "hover:underline",
              )}
            >
              Save & exit
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {secondary && (
            <button
              type="button"
              onClick={secondary.onClick}
              className={cn(
                "inline-flex items-center h-8 px-3.5 rounded-md",
                "bg-surface border border-stroke",
                "font-body text-[12.5px] font-semibold text-foreground",
                "hover:bg-surface-hover transition-colors duration-fast",
              )}
            >
              {secondary.label}
            </button>
          )}
          <button
            type="button"
            onClick={onPrimary}
            disabled={primaryDisabled}
            className={cn(
              "inline-flex items-center h-8 px-3.5 rounded-md shadow-xs",
              "bg-brand text-on-brand",
              "font-body text-[12.5px] font-semibold",
              "hover:bg-brand-hover transition-colors duration-fast",
              "disabled:bg-bg-subtle disabled:text-text-disabled disabled:cursor-not-allowed",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
            )}
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function SuccessPanel({
  title,
  description,
  sowId,
  committedKind,
  onBack,
}: {
  title: string;
  description: string;
  sowId: string;
  committedKind: "draft" | "submit";
  onBack: () => void;
}) {
  return (
    <section className="rounded-lg border border-stroke bg-surface shadow-xs overflow-hidden">
      <div className="p-5 space-y-3">
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-success-subtle text-success-text"
          aria-hidden
        >
          <CheckCircle2 className="h-5 w-5" strokeWidth={2} aria-hidden />
        </span>
        <h2 className="font-body text-[16px] font-semibold text-foreground tracking-[-0.005em]">
          {title}
        </h2>
        <p className="font-body text-[12.5px] text-text-secondary max-w-xl leading-relaxed">
          {description}
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Link
            href={`/enterprise/sow/${sowId}`}
            className={cn(
              "inline-flex items-center gap-1 h-8 px-3 rounded-md shadow-xs",
              "bg-brand text-on-brand",
              "font-body text-[12.5px] font-semibold",
              "hover:bg-brand-hover transition-colors duration-fast",
            )}
          >
            View SOW
            <ChevronRight className="h-3 w-3" strokeWidth={2.5} aria-hidden />
          </Link>
          {committedKind === "submit" ? (
            <Link
              href={`/enterprise/sow/${sowId}`}
              className={cn(
                "inline-flex items-center gap-1 h-8 px-3 rounded-md shadow-xs",
                "bg-surface border border-stroke",
                "font-body text-[12.5px] font-semibold text-text-secondary",
                "hover:text-foreground hover:border-stroke-strong transition-colors duration-fast",
              )}
            >
              Track approval
              <ChevronRight className="h-3 w-3" strokeWidth={2.5} aria-hidden />
            </Link>
          ) : (
            <Link
              href={`/enterprise/sow/${sowId}/approve`}
              className={cn(
                "inline-flex items-center gap-1 h-8 px-3 rounded-md shadow-xs",
                "bg-surface border border-stroke",
                "font-body text-[12.5px] font-semibold text-text-secondary",
                "hover:text-foreground hover:border-stroke-strong transition-colors duration-fast",
              )}
            >
              Submit for approval
              <ChevronRight className="h-3 w-3" strokeWidth={2.5} aria-hidden />
            </Link>
          )}
          <button
            type="button"
            onClick={onBack}
            className={cn(
              "inline-flex items-center h-8 px-3 rounded-md",
              "font-body text-[12.5px] font-semibold text-text-secondary",
              "hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast",
            )}
          >
            Back to workspace
          </button>
        </div>
      </div>
    </section>
  );
}
