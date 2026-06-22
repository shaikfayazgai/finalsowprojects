"use client";

import * as React from "react";
import Link from "next/link";
import {
  FileText,
  FileArchive,
  FileVideo,
  FileImage,
  FileCode,
  Link as LinkIcon,
  CheckCircle2,
  Circle,
  Upload,
  GitCompare,
  Eye,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  ContributorCard,
  ContributorSectionHeader,
} from "@/app/contributor/_shared/primitives";
import type {
  Deliverable,
  WorkroomArtifact,
  WorkroomTask,
} from "@/mocks/data/contributor-workroom-detail";

interface SubmissionPreviewProps {
  task: WorkroomTask;
}

const kindIcon: Record<WorkroomArtifact["kind"], LucideIcon> = {
  code: FileCode,
  doc: FileText,
  image: FileImage,
  video: FileVideo,
  archive: FileArchive,
  link: LinkIcon,
};

/**
 * Submission Preview — exactly what your mentor will see.
 *
 * Three sub-sections:
 *   - Deliverables: grouped by required / optional
 *   - Evidence package: artifact list with kind icons + preview
 *   - Version comparison (only when round 2+)
 *
 * This is the contributor's "what gets sent" moment — no surprises.
 */
export function SubmissionPreview({ task }: SubmissionPreviewProps) {
  const requiredDeliverables = task.deliverables.filter((d) => d.required);
  const optionalDeliverables = task.deliverables.filter((d) => !d.required);
  const isRework = (task.reworkRound ?? 0) > 0;

  return (
    <div className="space-y-4">
      <ContributorCard padded={false} className="p-6">
        <ContributorSectionHeader
          title="What you're submitting"
          caption="A preview of the package your mentor will see — same data, organized for the review."
          trailing={
            <Link
              href={`/contributor/tasks/${task.id}`}
              className="inline-flex items-center gap-1 rounded-lg border border-beige-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-brown-900 hover:bg-beige-50/60"
            >
              <Upload className="h-3 w-3" />
              Add more in the workroom
            </Link>
          }
        />

        {/* Required deliverables */}
        <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-beige-700">
          Required deliverables · {requiredDeliverables.filter((d) => d.status === "done").length} of{" "}
          {requiredDeliverables.length} ready
        </p>
        <ul className="mt-2 space-y-1.5">
          {requiredDeliverables.map((d) => (
            <li key={d.id}>
              <DeliverableRow deliverable={d} />
            </li>
          ))}
        </ul>

        {/* Optional deliverables */}
        {optionalDeliverables.length > 0 && (
          <>
            <p className="mt-4 text-[10.5px] font-bold uppercase tracking-[0.14em] text-beige-700">
              Optional deliverables · {optionalDeliverables.filter((d) => d.status === "done").length} of{" "}
              {optionalDeliverables.length} included
            </p>
            <ul className="mt-2 space-y-1.5">
              {optionalDeliverables.map((d) => (
                <li key={d.id}>
                  <DeliverableRow deliverable={d} />
                </li>
              ))}
            </ul>
          </>
        )}
      </ContributorCard>

      {/* Evidence package */}
      <EvidencePackage task={task} />

      {/* Version comparison */}
      {isRework && <VersionCompare task={task} />}
    </div>
  );
}

/* ─────────────────────── Deliverable row ─────────────────────── */

function DeliverableRow({ deliverable }: { deliverable: Deliverable }) {
  const Icon =
    deliverable.status === "done"
      ? CheckCircle2
      : deliverable.status === "in_progress"
      ? Circle
      : Circle;
  const tone =
    deliverable.status === "done"
      ? "border-forest-200 bg-forest-50/30 text-forest-800"
      : deliverable.status === "in_progress"
      ? "border-teal-200 bg-teal-50/40 text-teal-800"
      : "border-beige-200 bg-beige-50/40 text-beige-700";
  const iconTone =
    deliverable.status === "done"
      ? "text-forest-600"
      : deliverable.status === "in_progress"
      ? "text-teal-600 fill-teal-100"
      : "text-beige-400";
  return (
    <div className={cn("flex items-center gap-3 rounded-lg border px-3 py-2", tone)}>
      <Icon className={cn("h-4 w-4 shrink-0", iconTone)} />
      <p className="flex-1 text-[12.5px] font-semibold text-brown-900 truncate">
        {deliverable.label}
      </p>
      {deliverable.evidenceRef && (
        <span className="inline-flex items-center gap-1 rounded border border-beige-200 bg-white px-1.5 py-[1px] text-[10px] font-mono text-beige-700">
          <LinkIcon className="h-2.5 w-2.5" />
          {deliverable.evidenceRef}
        </span>
      )}
      <span className="text-[9.5px] font-bold uppercase tracking-wider opacity-80 shrink-0">
        {deliverable.status.replace("_", " ")}
      </span>
    </div>
  );
}

/* ─────────────────────── Evidence package ─────────────────────── */

function EvidencePackage({ task }: { task: WorkroomTask }) {
  return (
    <ContributorCard padded={false} className="p-6">
      <ContributorSectionHeader
        title="Evidence package"
        caption={`${task.evidence.artifacts.length} artifact${
          task.evidence.artifacts.length === 1 ? "" : "s"
        } attached · ${Math.round(
          (task.evidence.completeCount / task.evidence.requiredCount) * 100
        )}% of required gathered`}
        trailing={
          <Link
            href={`/contributor/tasks/${task.id}`}
            className="text-[11.5px] font-semibold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1"
          >
            Add more
            <ArrowRight className="h-3 w-3" />
          </Link>
        }
      />
      {task.evidence.artifacts.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-beige-300 bg-beige-50/40 px-4 py-6 text-center">
          <p className="text-[12.5px] text-beige-700">
            No artifacts attached yet. Head back to the workroom to add evidence.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {task.evidence.artifacts.map((a) => (
            <li key={a.id}>
              <ArtifactCard artifact={a} />
            </li>
          ))}
        </ul>
      )}

      {/* External links */}
      {task.externalLinks.length > 0 && (
        <div className="mt-4">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-beige-700 mb-2">
            Working references included
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {task.externalLinks.map((l) => (
              <li key={l.label}>
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-beige-200 bg-white px-2.5 py-1 text-[11px] font-medium text-brown-900 hover:bg-beige-50/60"
                >
                  <LinkIcon className="h-3 w-3 text-beige-500" />
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ContributorCard>
  );
}

function ArtifactCard({ artifact }: { artifact: WorkroomArtifact }) {
  const Icon = kindIcon[artifact.kind];
  return (
    <div className="flex items-center gap-3 rounded-lg border border-beige-200 bg-white px-3 py-2.5">
      <span className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-beige-200 bg-beige-50 text-beige-700">
        <Icon className="h-4 w-4" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[12.5px] font-semibold text-brown-950 truncate">{artifact.name}</p>
        <p className="text-[10.5px] text-beige-600 tabular-nums">
          {artifact.size} · uploaded {artifact.uploadedAt}
        </p>
      </div>
      <button
        type="button"
        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-beige-600 hover:text-brown-700 hover:bg-beige-50"
        title="Preview"
        aria-label="Preview"
      >
        <Eye className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ─────────────────────── Version compare ─────────────────────── */

function VersionCompare({ task }: { task: WorkroomTask }) {
  const [open, setOpen] = React.useState(true);
  const prevRound = (task.reworkRound ?? 1) - 1;
  const newVersion = (task.reworkRound ?? 1) + 1;
  return (
    <ContributorCard padded={false} className="p-6">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-3 text-left"
      >
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-teal-200 bg-teal-50 text-teal-700">
          <GitCompare className="h-4 w-4" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-heading text-[15px] font-semibold text-brown-950 leading-tight">
            What changed since v{prevRound > 0 ? prevRound : 1}
          </p>
          <p className="text-[11.5px] text-beige-700 mt-0.5">
            Your mentor will see this comparison alongside your submission.
          </p>
        </div>
        {open ? (
          <ChevronDown className="h-4 w-4 text-beige-600" />
        ) : (
          <ChevronRight className="h-4 w-4 text-beige-600" />
        )}
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-forest-200 bg-forest-50/30 px-4 py-3">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-forest-700">
              Addressed in v{newVersion}
            </p>
            <ul className="mt-1.5 space-y-1 text-[12px] text-brown-900">
              {(task.mentorFeedback?.requiredCorrections ?? [])
                .filter((c) => c.addressed)
                .map((c) => (
                  <li key={c.id} className="flex items-start gap-2">
                    <CheckCircle2 className="h-3 w-3 mt-1 text-forest-600 shrink-0" />
                    <span>{c.criterion}</span>
                  </li>
                ))}
              {task.mentorFeedback?.requiredCorrections?.filter((c) => c.addressed).length === 0 && (
                <li className="text-beige-700 italic">No items marked addressed yet.</li>
              )}
            </ul>
          </div>

          {(task.mentorFeedback?.requiredCorrections ?? []).some((c) => !c.addressed) && (
            <div className="rounded-xl border border-gold-200 bg-gold-50/30 px-4 py-3">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-gold-800">
                Still open
              </p>
              <ul className="mt-1.5 space-y-1 text-[12px] text-brown-900">
                {(task.mentorFeedback?.requiredCorrections ?? [])
                  .filter((c) => !c.addressed)
                  .map((c) => (
                    <li key={c.id} className="flex items-start gap-2">
                      <Circle className="h-3 w-3 mt-1 text-gold-600 shrink-0" />
                      <span>{c.criterion}</span>
                    </li>
                  ))}
              </ul>
              <p className="mt-2 text-[10.5px] text-gold-800 italic">
                Submitting now is fine — your mentor will see these are still in motion.
              </p>
            </div>
          )}
        </div>
      )}
    </ContributorCard>
  );
}
