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
 *   - clean border-only cards
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
import { writeSowPricing } from "@/lib/pricing";
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
import { GLASS_CARD, GLASS_SHADOW, AURORA_ACCENT } from "@/app/admin/_shell/aurora";
import {
  GLASS_FIELD_STYLE,
  primaryBtnClass,
  primaryStyle,
  ghostBtnClass,
} from "@/app/admin/_shell/aurora-ui";

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

const UPLOAD_WIZARD_STEPS: Array<{
  n: 1 | 2 | 3;
  label: string;
  hint: string;
}> = [
  { n: 1, label: "Upload", hint: "Document + confidentiality" },
  { n: 2, label: "Review", hint: "Validate extracted scope" },
  { n: 3, label: "Submit", hint: "Approvers + routing" },
];

/* ────────────────────────── page ────────────────────────── */

export default function SowIntakePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = (searchParams.get("mode") as Mode | null) ?? null;

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
          description="Drop a DOC, DOCX, or PDF. We parse the scope and confirm with you."
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
        <ModeCard
          mode="generate"
          icon={<Sparkles className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />}
          title="Generate with AI"
          description="Give a few parameters. AI drafts a full SOW — you review before submit."
          cta="Generate SOW"
          highlight
        />
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
        GLASS_CARD,
        "group relative h-full overflow-hidden p-4",
        "transition-colors duration-fast ease-standard",
        disabled ? "opacity-70" : "hover:bg-white/70",
      )}
      style={GLASS_SHADOW}
    >
      {highlight && (
        <span
          className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-white font-mono text-[9px] font-semibold uppercase tracking-[0.1em]"
          style={{ backgroundImage: AURORA_ACCENT }}
        >
          New
        </span>
      )}
      <span
        aria-hidden
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-md mb-3",
          disabled
            ? "bg-bg-subtle text-text-disabled"
            : "bg-[var(--color-ai-surface)] text-[var(--color-ai-text)]",
        )}
      >
        {icon}
      </span>
      <h2
        className={cn(
          "font-display text-[14px] font-semibold tracking-[-0.005em]",
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
          disabled ? "text-text-disabled" : "text-text-secondary",
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
      className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.32)]"
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

      const uploadPayload = buildUploadCreatePayload({
        extracted,
        sourceFile: file
          ? { name: file.name, sizeBytes: file.size, type: file.type }
          : null,
        submission,
      });
      const created = await createSow.mutateAsync({
        title: extracted.title.trim() || "Untitled SOW",
        confidentiality: extracted.classification,
        body: extracted.scopeBody.trim() || undefined,
        payload: args.config.pricing
          ? writeSowPricing(uploadPayload, args.config.pricing)
          : uploadPayload,
      });
      setCreatedSowId(created.id);
      setCommittedKind(args.kind);
      clearUploadDraft();

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
        <div
          className="rounded-2xl border px-4 py-3 flex flex-wrap items-center justify-between gap-3 backdrop-blur"
          style={{ background: "var(--color-ai-surface)", borderColor: "var(--color-ai-border)" }}
        >
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
              className={cn(primaryBtnClass, "h-8 px-3 text-[12px]")}
              style={primaryStyle}
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
          title="Step 1 · Upload and classify SOW"
          subtitle={`Attach ${ACCEPTED_EXT.join(", ").toUpperCase()} up to ${MAX_FILE_MB} MB, then set confidentiality before extraction.`}
        >
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
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

              <aside className="space-y-3">
                <fieldset className="space-y-2">
                  <legend className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
                    Confidentiality
                  </legend>
                  <div className="space-y-2">
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

                <div className="rounded-xl border border-white/55 bg-white/45 backdrop-blur px-3 py-2.5">
                  <p className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
                    Before extraction
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    <li className="flex items-start gap-1.5 font-body text-[12px] text-text-secondary">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-success-text" strokeWidth={2} aria-hidden />
                      Keep title and timeline in the source file for cleaner extraction.
                    </li>
                    <li className="flex items-start gap-1.5 font-body text-[12px] text-text-secondary">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-success-text" strokeWidth={2} aria-hidden />
                      Choose confidentiality now; it governs who can access this SOW.
                    </li>
                    <li className="flex items-start gap-1.5 font-body text-[12px] text-text-secondary">
                      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-success-text" strokeWidth={2} aria-hidden />
                      You can still edit every extracted field in the next step.
                    </li>
                  </ul>
                </div>
              </aside>
            </div>
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
              ? "Your SOW is now in approval. Glimmora Commercial reviews first, then your enterprise admin signs off."
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
    <Panel title="Step 2 · Extraction issue" subtitle={filename ? `Document: ${filename}` : undefined}>
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
  const lines = [
    "OCR pass on attachments…",
    "Extracting title, dates, stakeholders…",
    "Tagging clauses (dependencies · assumptions · constraints)…",
    "Scoring risk flags…",
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
          <Sparkles className="h-4 w-4 text-[var(--color-ai-text)]" strokeWidth={2.5} aria-hidden />
          Step 2 · Parsing your document
        </span>
      }
      subtitle={`Document: ${filename || "—"}`}
    >
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-[var(--color-ai-text)] animate-spin" strokeWidth={2.5} aria-hidden />
          <p className="font-body text-[12.5px] text-text-secondary">
            Extracting structured fields. Usually takes 1–3 seconds.
          </p>
        </div>
        <ol className="space-y-1.5">
          {lines.map((l, i) => (
            <li key={l} className="flex items-center gap-2 font-body text-[12px]">
              {i <= activeLine ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-success" strokeWidth={2.5} aria-hidden />
              ) : (
                <span aria-hidden className="h-3.5 w-3.5 inline-block rounded-full border border-white/70" />
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
      title="Step 2 · Review extracted scope"
      subtitle="Confirm and edit any extracted fields before routing for approval."
    >
      <div className="p-4 space-y-5">
        {/* Source + confidence banner */}
        <div className="rounded-xl border border-white/55 bg-white/45 backdrop-blur px-3 py-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] font-body">
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
                style={GLASS_FIELD_STYLE}
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
                style={GLASS_FIELD_STYLE}
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
                style={GLASS_FIELD_STYLE}
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
            <ul className="rounded-xl border border-white/55 divide-y divide-white/60">
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
              <li key={d.id} className="rounded-xl border border-white/55 bg-white/45 backdrop-blur px-2.5 py-1.5 flex items-center gap-2">
                <span className="font-mono text-[10px] text-text-tertiary tabular-nums w-6 shrink-0">D{String(i + 1).padStart(2, "0")}</span>
                <input
                  value={d.title}
                  onChange={(e) => {
                    const next = [...data.deliverables];
                    next[i] = { ...d, title: e.target.value };
                    patch("deliverables", next);
                  }}
                  style={GLASS_FIELD_STYLE}
                  className="flex-1 h-7 px-2 rounded-lg backdrop-blur-md font-body text-[12.5px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.32)]"
                />
                <button
                  type="button"
                  onClick={() => patch("deliverables", data.deliverables.filter((_, j) => j !== i))}
                  aria-label="Remove deliverable"
                  className="h-7 w-7 inline-flex items-center justify-center rounded text-text-tertiary hover:text-error-text hover:bg-white/60"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => patch("deliverables", [...data.deliverables, { id: `d-${Date.now()}`, title: "" }])}
            className="mt-2 inline-flex items-center gap-1 h-7 px-2.5 rounded-xl border border-white/70 bg-white/55 backdrop-blur font-body text-[12px] font-semibold text-foreground hover:bg-white/75 transition-colors duration-fast"
          >
            <Plus className="h-3 w-3" strokeWidth={2} aria-hidden /> Add deliverable
          </button>
        </ExtractedSection>

        {/* Clauses tagged */}
        <ExtractedSection icon={<ScrollText className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />} title="Clauses tagged" hint={`${data.clauses.length} found · dependencies · assumptions · constraints`}>
          <ul className="space-y-1.5">
            {data.clauses.map((c, i) => (
              <li key={c.id} className="rounded-xl border border-white/55 bg-white/45 backdrop-blur px-2.5 py-1.5 flex items-start gap-2">
                <select
                  value={c.kind}
                  onChange={(e) => {
                    const next = [...data.clauses];
                    next[i] = { ...c, kind: e.target.value as ClauseKind };
                    patch("clauses", next);
                  }}
                  className={cn("h-7 px-1.5 rounded-lg border backdrop-blur font-mono text-[10px] uppercase tracking-[0.08em] shrink-0", clauseKindClass(c.kind))}
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
                  style={GLASS_FIELD_STYLE}
                  className="flex-1 min-h-[28px] px-2 py-1 rounded-lg backdrop-blur-md font-body text-[12px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.32)] resize-y"
                />
                <span className="font-mono text-[10px] text-text-tertiary tabular-nums shrink-0 mt-1">{Math.round(c.confidence * 100)}%</span>
                <button
                  type="button"
                  onClick={() => patch("clauses", data.clauses.filter((_, j) => j !== i))}
                  aria-label="Remove clause"
                  className="h-7 w-7 inline-flex items-center justify-center rounded text-text-tertiary hover:text-error-text hover:bg-white/60"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => patch("clauses", [...data.clauses, { id: `c-${Date.now()}`, kind: "dependency", text: "", confidence: 0.6 }])}
            className="mt-2 inline-flex items-center gap-1 h-7 px-2.5 rounded-xl border border-white/70 bg-white/55 backdrop-blur font-body text-[12px] font-semibold text-foreground hover:bg-white/75 transition-colors duration-fast"
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
        <h3 className="inline-flex items-center gap-1.5 font-display text-[12.5px] font-semibold text-foreground">
          <span className="text-[var(--color-ai-text)]">{icon}</span>
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
    case "dependency":  return "border-[var(--color-ai-border)] text-[var(--color-ai-text)] bg-[var(--color-ai-surface)]";
    case "assumption":  return "border-warning-border text-warning-text bg-warning-subtle";
    case "constraint":  return "border-white/70 text-text-secondary bg-white/45";
  }
}

function riskClass(s: RiskSeverity) {
  switch (s) {
    case "high":   return { bg: "bg-error-subtle",   border: "border-error-border",   icon: "text-error-text",   text: "text-error-text"   };
    case "medium": return { bg: "bg-warning-subtle", border: "border-warning-border", icon: "text-warning-text", text: "text-warning-text" };
    case "low":    return { bg: "bg-white/45",       border: "border-white/55",       icon: "text-text-tertiary",text: "text-text-tertiary"};
  }
}

const inputBaseCls = "w-full h-9 px-3 rounded-xl backdrop-blur-md font-body text-[13px] text-foreground placeholder:text-text-disabled focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.32)]";

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
      const authorPayload: Record<string, unknown> = {
        intakeMode: "author",
        submission: {
          approvers: Object.fromEntries(
            Object.entries(args.config.approvers).map(([k, v]) => [k, { id: v.id, email: v.email, name: v.name }]),
          ),
          notify: args.config.notify,
          coverNote: args.config.coverNote || undefined,
        },
      };
      const created = await createSow.mutateAsync({
        title: titleTrim,
        confidentiality,
        body: body.trim() || undefined,
        payload: args.config.pricing
          ? writeSowPricing(authorPayload, args.config.pricing)
          : authorPayload,
      });
      setCreatedSowId(created.id);
      setCommittedKind(args.kind);
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
            ? "Your authored SOW is now in the two-step approval flow."
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
          <div
            className="rounded-xl border px-3 py-2 backdrop-blur font-body text-[12px] text-text-secondary"
            style={{ background: "var(--color-ai-surface)", borderColor: "var(--color-ai-border)" }}
          >
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
    <section className={cn(GLASS_CARD, "overflow-hidden")} style={GLASS_SHADOW}>
      <header className="px-4 py-3 border-b border-white/55">
        <h2 className="font-display text-[13.5px] font-semibold text-foreground tracking-[-0.005em]">
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
  const activeStep: 1 | 2 | 3 = current === 1 ? 1 : current === 2 ? 2 : 3;
  const progressPercent = current >= 4 ? 100 : Math.round((activeStep / UPLOAD_WIZARD_STEPS.length) * 100);

  return (
    <section className={cn(GLASS_CARD, "p-3")} style={GLASS_SHADOW}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="font-display text-[12.5px] font-semibold text-foreground">
          SOW upload flow
        </p>
        <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-text-tertiary">
          {current >= 4 ? "Completed" : `Step ${activeStep} of ${UPLOAD_WIZARD_STEPS.length}`}
        </span>
      </div>

      <ol
        aria-label="Upload progress"
        className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2"
      >
        {UPLOAD_WIZARD_STEPS.map((step) => {
          const done = activeStep > step.n || current >= 4;
          const active = activeStep === step.n && current < 4;
          return (
            <li
              key={step.n}
              className={cn(
                "rounded-xl border px-2.5 py-2 flex items-start gap-2 backdrop-blur",
                active
                  ? "border-[var(--color-ai-border)] bg-[var(--color-ai-surface)]"
                  : done
                    ? "border-success-border bg-success-subtle/35"
                    : "border-white/55 bg-white/45",
              )}
              aria-current={active ? "step" : undefined}
            >
              <span
                aria-hidden
                className={cn(
                  "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                  "font-mono text-[10.5px] font-semibold tabular-nums",
                  active
                    ? "text-white border-transparent"
                    : done
                      ? "bg-success text-white border-success"
                      : "bg-white/60 text-text-tertiary border-white/70",
                )}
                style={active ? { backgroundImage: AURORA_ACCENT } : undefined}
              >
                {done ? <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} /> : step.n}
              </span>
              <span className="min-w-0">
                <span
                  className={cn(
                    "block font-body text-[12px] font-semibold",
                    active ? "text-[var(--color-ai-text)]" : "text-foreground",
                  )}
                >
                  {step.label}
                </span>
                <span className="block font-body text-[11px] text-text-tertiary leading-relaxed">
                  {step.hint}
                </span>
              </span>
            </li>
          );
        })}
      </ol>

      <div
        className="mt-3 h-1 rounded-full bg-foreground/[0.08]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressPercent}
        aria-label="Overall wizard progress"
      >
        <div
          className="h-full rounded-full transition-all duration-300 ease-standard"
          style={{ width: `${progressPercent}%`, backgroundImage: AURORA_ACCENT }}
        />
      </div>
    </section>
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
        "rounded-xl border border-dashed p-5 text-center backdrop-blur",
        "transition-colors duration-fast ease-standard",
        error
          ? "border-error-border bg-error-subtle/40"
          : drag
            ? "border-[var(--color-ai-border)] bg-[var(--color-ai-surface)]"
            : file
              ? "border-success-border bg-success-subtle/40"
              : "border-white/70 bg-white/45 hover:bg-white/60",
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
            className="font-body text-[11.5px] font-semibold text-text-secondary hover:text-foreground transition-colors duration-fast shrink-0"
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
              className="text-[var(--color-ai-text)] font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.32)] rounded-sm"
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
        "block cursor-pointer rounded-xl border px-3 py-2.5 select-none backdrop-blur",
        "transition-colors duration-fast ease-standard",
        "focus-within:ring-2 focus-within:ring-[rgba(124,92,246,0.32)]",
        checked
          ? "border-[var(--color-ai-border)] bg-[var(--color-ai-surface)]"
          : "border-white/70 bg-white/45 hover:bg-white/60",
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
            checked ? "text-[var(--color-ai-text)]" : "text-foreground",
          )}
        >
          {label}
        </span>
        <span
          aria-hidden
          className={cn(
            "inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border shrink-0",
            checked ? "border-transparent" : "border-stroke-strong bg-white/70",
          )}
          style={checked ? { backgroundImage: AURORA_ACCENT } : undefined}
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
      aria-invalid={invalid || undefined}
      style={GLASS_FIELD_STYLE}
      className={cn(
        "w-full h-9 px-3 rounded-xl backdrop-blur-md",
        "font-body text-[13px] text-foreground placeholder:text-text-disabled",
        "focus-visible:outline-none focus-visible:ring-2",
        invalid
          ? "focus-visible:ring-error-border/40"
          : "focus-visible:ring-[rgba(124,92,246,0.32)]",
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
      style={GLASS_FIELD_STYLE}
      className={cn(
        "w-full px-3 py-2 rounded-xl backdrop-blur-md",
        "font-body text-[12.5px] text-foreground placeholder:text-text-disabled leading-relaxed",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.32)]",
        "resize-vertical",
      )}
    />
  );
}

function AiNotice({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl border px-3 py-2 flex items-start gap-2 backdrop-blur"
      style={{ background: "var(--color-ai-surface)", borderColor: "var(--color-ai-border)" }}
    >
      <Sparkles
        className="h-3.5 w-3.5 text-[var(--color-ai-text)] mt-0.5 shrink-0"
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
    <div className="border-t border-white/55 px-4 py-3 space-y-2.5 bg-white/30">
      {error && (
        <div className="rounded-xl bg-error-subtle border border-error-border px-3 py-2 flex items-start gap-2">
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
                "inline-flex items-center gap-1 h-8 px-3 rounded-xl",
                "font-body text-[12.5px] font-semibold text-text-secondary",
                "hover:text-foreground hover:bg-white/50 transition-colors duration-fast",
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
                "inline-flex items-center h-8 px-3 rounded-xl",
                "font-body text-[12.5px] font-semibold text-text-secondary",
                "hover:text-foreground hover:bg-white/50 transition-colors duration-fast",
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
                "inline-flex items-center h-8 px-3 rounded-xl",
                "font-body text-[12.5px] font-semibold text-text-secondary",
                "hover:text-foreground transition-colors duration-fast",
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
              className={cn(ghostBtnClass, "h-8 px-3.5 text-[12.5px]")}
            >
              {secondary.label}
            </button>
          )}
          <button
            type="button"
            onClick={onPrimary}
            disabled={primaryDisabled}
            className={cn(primaryBtnClass, "h-8 px-3.5 text-[12.5px]")}
            style={primaryStyle}
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
    <section className={cn(GLASS_CARD, "overflow-hidden")} style={GLASS_SHADOW}>
      <div className="p-5 space-y-3">
        <span
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-success-subtle text-success-text"
          aria-hidden
        >
          <CheckCircle2 className="h-5 w-5" strokeWidth={2} aria-hidden />
        </span>
        <h2 className="font-display text-[16px] font-semibold text-foreground tracking-[-0.005em]">
          {title}
        </h2>
        <p className="font-body text-[12.5px] text-text-secondary max-w-xl leading-relaxed">
          {description}
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Link
            href={`/enterprise/sow/${sowId}`}
            className={cn(primaryBtnClass, "h-8 px-3 text-[12.5px]")}
            style={primaryStyle}
          >
            View SOW
            <ChevronRight className="h-3 w-3" strokeWidth={2.5} aria-hidden />
          </Link>
          {committedKind === "submit" ? (
            <Link
              href={`/enterprise/sow/${sowId}/approve`}
              className={cn(ghostBtnClass, "h-8 px-3 text-[12.5px]")}
            >
              Open approval workflow
              <ChevronRight className="h-3 w-3" strokeWidth={2.5} aria-hidden />
            </Link>
          ) : (
            <Link
              href={`/enterprise/sow/${sowId}/approve`}
              className={cn(ghostBtnClass, "h-8 px-3 text-[12.5px]")}
            >
              Submit for approval
              <ChevronRight className="h-3 w-3" strokeWidth={2.5} aria-hidden />
            </Link>
          )}
          <button
            type="button"
            onClick={onBack}
            className={cn(
              "inline-flex items-center h-8 px-3 rounded-xl",
              "font-body text-[12.5px] font-semibold text-text-secondary",
              "hover:text-foreground hover:bg-white/50 transition-colors duration-fast",
            )}
          >
            Back to workspace
          </button>
        </div>
      </div>
    </section>
  );
}
