"use client";

import * as React from "react";
import {
  Upload,
  FileText,
  FileArchive,
  FileVideo,
  FileImage,
  FileCode,
  Link as LinkIcon,
  Trash2,
  Eye,
  Download,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  ContributorCard,
  ContributorSectionHeader,
} from "@/app/contributor/_shared/primitives";
import type { WorkroomArtifact, WorkroomTask } from "@/mocks/data/contributor-workroom-detail";

interface EvidenceWorkspaceProps {
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
 * Evidence Workspace — file collection panel.
 *
 * Drag-and-drop drop zone at the top, attached artifacts list below.
 * Calm tone, no surveillance language ("we detected"). Progress on the
 * collection target is shown gently as a counter, not as a missing-files
 * alarm.
 */
export function EvidenceWorkspace({ task }: EvidenceWorkspaceProps) {
  const [dragOver, setDragOver] = React.useState(false);
  const { artifacts, requiredCount, completeCount } = task.evidence;

  return (
    <ContributorCard padded={false} className="p-5">
      <ContributorSectionHeader
        title="Evidence"
        caption={`${completeCount} of ${requiredCount} required artifacts attached — drag-drop or click to add more.`}
        trailing={
          <span className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2 py-[1px] text-[10px] font-semibold text-teal-700">
            <CheckCircle2 className="h-3 w-3" />
            {Math.round((completeCount / requiredCount) * 100)}%
          </span>
        }
      />

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
        }}
        className={cn(
          "rounded-2xl border-2 border-dashed px-5 py-6 transition-colors text-center",
          dragOver
            ? "border-teal-400 bg-teal-50"
            : "border-beige-300 bg-beige-50/40 hover:border-beige-400"
        )}
      >
        <div className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-teal-200 bg-white text-teal-700">
          <Upload className="h-5 w-5" />
        </div>
        <p className="mt-2 text-[13.5px] font-semibold text-brown-950">
          Drop files here, or click to browse
        </p>
        <p className="mt-1 text-[11.5px] text-beige-700">
          Code, docs, screenshots, videos, recordings — auto-routed by type
        </p>
        <button
          type="button"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-1.5 text-[12px] font-semibold text-white hover:bg-teal-700"
        >
          <Upload className="h-3.5 w-3.5" />
          Browse files
        </button>
      </div>

      {/* Artifacts list */}
      <div className="mt-4">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-beige-700 mb-2">
          Attached · {artifacts.length}
        </p>
        {artifacts.length === 0 ? (
          <p className="text-[12px] text-beige-600 italic px-1">
            Nothing attached yet — drop your first artifact above.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {artifacts.map((a) => (
              <li key={a.id}>
                <ArtifactRow artifact={a} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-3 text-[10.5px] text-beige-600 italic">
        Every file is scanned automatically — we'll flag anything that needs your attention. Otherwise, no
        news is good news.
      </p>
    </ContributorCard>
  );
}

function ArtifactRow({ artifact }: { artifact: WorkroomArtifact }) {
  const Icon = kindIcon[artifact.kind];
  return (
    <div className="flex items-center gap-3 rounded-lg border border-beige-200 bg-white px-3 py-2 hover:bg-beige-50/40 transition-colors">
      <span className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-beige-200 bg-beige-50 text-beige-700">
        <Icon className="h-4 w-4" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[12.5px] font-semibold text-brown-950 truncate">{artifact.name}</p>
        <p className="text-[10.5px] text-beige-600 tabular-nums">
          {artifact.size} · uploaded {artifact.uploadedAt}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <IconButton icon={Eye} title="Preview" />
        <IconButton icon={Download} title="Download" />
        <IconButton icon={Trash2} title="Remove" />
      </div>
    </div>
  );
}

function IconButton({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <button
      type="button"
      title={title}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-beige-600 hover:text-brown-700 hover:bg-beige-50"
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
