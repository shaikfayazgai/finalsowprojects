"use client";

/**
 * Evidence workspace — portfolio list, filters, CRUD.
 */

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  ExternalLink,
  FolderOpen,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { DashboardSection } from "@/components/meridian/dashboard";
import { StatusChip } from "@/components/meridian";
import { ConfirmationDialog } from "@/components/meridian/overlays";
import { useActivePersona } from "@/lib/hooks/use-active-persona";
import { useContributorEvidence } from "@/lib/hooks/use-contributor-evidence";
import { toast } from "@/lib/stores/toast-store";
import { PERSONAS } from "@/mocks/contributor/personas";
import { cn } from "@/lib/utils/cn";
import { EvidenceSkeleton } from "./evidence-skeleton";
import {
  buildEvidencePayload,
  EMPTY_EVIDENCE_FORM,
  EvidenceFormDialog,
  rowToForm,
  validateEvidenceForm,
  type EvidenceFormState,
} from "./evidence-form-dialog";
import {
  EVIDENCE_TYPE_TABS,
  evidenceTypeChipStatus,
  evidenceTypeLabel,
  fmtEvidenceDate,
  hostFromUrl,
  mapApiItemToRow,
  TYPE_ICONS,
  type EvidenceType,
} from "../lib/evidence-ui-utils";

export function EvidenceWorkspace() {
  const { persona } = useActivePersona();
  const personaLabel = PERSONAS.find((p) => p.key === persona)?.shortLabel ?? persona;

  const [searchInput, setSearchInput] = React.useState("");
  const [debouncedQ, setDebouncedQ] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<"" | EvidenceType>("");
  const [skillFilter, setSkillFilter] = React.useState("");

  const [formOpen, setFormOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [initialForm, setInitialForm] = React.useState<EvidenceFormState>(EMPTY_EVIDENCE_FORM);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const queryParams = React.useMemo(
    () => ({
      q: debouncedQ || undefined,
      type: typeFilter || undefined,
      skill: skillFilter.trim() || undefined,
    }),
    [debouncedQ, typeFilter, skillFilter],
  );

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
    sessionStatus,
    token,
    contributorId,
    createMutation,
    updateMutation,
    deleteMutation,
  } = useContributorEvidence(queryParams);

  const rows = React.useMemo(
    () => (data?.items ?? []).map(mapApiItemToRow),
    [data?.items],
  );
  const total = data?.total ?? rows.length;

  const stats = React.useMemo(() => {
    const links = rows.filter((r) => r.type === "link").length;
    const docs = rows.filter((r) => r.type === "file").length;
    const github = rows.filter((r) => r.type === "github").length;
    return { total, links, docs, github };
  }, [rows, total]);

  const typeCounts = React.useMemo(() => {
    const all = rows.length;
    return {
      "": all,
      link: rows.filter((r) => r.type === "link").length,
      file: rows.filter((r) => r.type === "file").length,
      github: rows.filter((r) => r.type === "github").length,
    } as Record<"" | EvidenceType, number>;
  }, [rows]);

  const loading = (sessionStatus === "loading" || isLoading) && !data;
  const submitting = createMutation.isPending || updateMutation.isPending;

  if (loading) return <EvidenceSkeleton />;

  if (!token || !contributorId) {
    return (
      <div className="rounded-lg border border-warning-border bg-warning-subtle px-4 py-6 text-center">
        <p className="font-body text-[13px] text-warning-text">
          Sign in to manage your portfolio evidence.
        </p>
        <Link
          href="/auth/login"
          className="mt-3 inline-flex h-9 items-center px-4 rounded-md bg-brand text-on-brand font-body text-[13px] font-semibold hover:bg-brand-hover"
        >
          Sign in
        </Link>
      </div>
    );
  }

  function openAdd() {
    setEditingId(null);
    setInitialForm(EMPTY_EVIDENCE_FORM);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(row: ReturnType<typeof mapApiItemToRow>) {
    setEditingId(row.id);
    setInitialForm(rowToForm(row));
    setFormError(null);
    setFormOpen(true);
  }

  async function handleFormSubmit(form: EvidenceFormState) {
    const err = validateEvidenceForm(form);
    if (err) {
      setFormError(err);
      toast.warning("Check the form", err);
      return;
    }
    setFormError(null);
    const payload = buildEvidencePayload(form);
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, body: payload });
        toast.success("Evidence updated", "Your changes were saved.");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Evidence added", "Your portfolio item was created.");
      }
      setFormOpen(false);
      setEditingId(null);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Request failed";
      setFormError(message);
      toast.error(editingId ? "Could not update" : "Could not add", message);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("Evidence removed", "The item was deleted.");
      setDeleteId(null);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Delete failed";
      toast.error("Could not delete", message);
    }
  }

  const listDescription =
    rows.length === 0
      ? debouncedQ || typeFilter || skillFilter
        ? "No matching evidence"
        : "No evidence yet — add your first item"
      : `${rows.length} item${rows.length === 1 ? "" : "s"}`;

  return (
    <div className="space-y-4 pb-12">
      {error ? (
        <div className="rounded-lg border border-error-border bg-error-subtle px-4 py-3 flex flex-wrap items-center gap-3">
          <AlertCircle className="h-4 w-4 text-error-text shrink-0" strokeWidth={2} aria-hidden />
          <p className="font-body text-[12.5px] text-error-text flex-1">
            {(error as Error).message}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-surface border border-stroke font-body text-[12px] font-semibold text-foreground hover:bg-surface-hover"
          >
            <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Retry
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-surface border border-stroke font-body text-[13px] font-semibold text-foreground hover:bg-surface-hover disabled:opacity-60"
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5", isFetching && "animate-spin")}
            strokeWidth={2}
            aria-hidden
          />
          Refresh
        </button>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-brand text-on-brand font-body text-[13px] font-semibold hover:bg-brand-hover"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Add evidence
        </button>
      </div>

      <DashboardSection
        title="Portfolio snapshot"
        description="Links, documents, and repos attached to your profile"
      >
        <dl className="grid grid-cols-3 gap-x-8 gap-y-4 max-w-lg">
          <SummaryStat label="Total" value={String(stats.total)} highlight={stats.total > 0} />
          <SummaryStat label="Links" value={String(stats.links)} highlight={stats.links > 0} />
          <SummaryStat label="Documents" value={String(stats.docs)} highlight={stats.docs > 0} />
        </dl>
      </DashboardSection>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
        <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden min-w-0">
          <div className="px-5 pt-4 pb-0 border-b border-stroke-subtle">
            <div className="flex flex-wrap items-start justify-between gap-3 pb-4">
              <div>
                <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                  All evidence
                </h2>
                <p className="mt-1 font-body text-[12.5px] text-text-secondary">{listDescription}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <div className="relative w-full sm:w-52">
                  <Search
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary pointer-events-none"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <input
                    type="search"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search title or description…"
                    aria-label="Search evidence"
                    className={cn(
                      "w-full h-8 pl-8 pr-8 rounded-md border border-stroke bg-surface",
                      "font-body text-[12.5px] text-foreground placeholder:text-text-disabled",
                      "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
                    )}
                  />
                  {searchInput ? (
                    <button
                      type="button"
                      onClick={() => setSearchInput("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-foreground"
                      aria-label="Clear search"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                  ) : null}
                </div>
                <input
                  type="text"
                  value={skillFilter}
                  onChange={(e) => setSkillFilter(e.target.value)}
                  placeholder="Filter by skill"
                  aria-label="Filter by skill"
                  className={cn(
                    "h-8 w-32 px-2.5 rounded-md border border-stroke bg-surface",
                    "font-body text-[12.5px] text-foreground placeholder:text-text-disabled",
                    "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
                  )}
                />
              </div>
            </div>

            <nav aria-label="Filter by type" className="flex flex-wrap gap-x-1 -mb-px">
              {EVIDENCE_TYPE_TABS.map((tab) => {
                const active = typeFilter === tab.id;
                const count = typeCounts[tab.id] ?? 0;
                return (
                  <button
                    key={tab.id || "all"}
                    type="button"
                    onClick={() => setTypeFilter(tab.id)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative inline-flex items-center gap-1.5 px-3 py-2.5",
                      "font-body text-[13px] font-medium whitespace-nowrap",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-t-sm",
                      active ? "text-foreground" : "text-text-secondary hover:text-foreground",
                    )}
                  >
                    {tab.label}
                    <span
                      className={cn(
                        "font-body text-[10px] tabular-nums px-1.5 py-0.5 rounded-full",
                        active ? "bg-brand-subtle text-brand-text" : "bg-bg-subtle text-text-tertiary",
                      )}
                    >
                      {count}
                    </span>
                    {active ? (
                      <span
                        aria-hidden
                        className="absolute inset-x-0 -bottom-px h-0.5 bg-brand rounded-full"
                      />
                    ) : null}
                  </button>
                );
              })}
            </nav>
          </div>

          {rows.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <FolderOpen
                className="h-9 w-9 text-text-disabled mx-auto mb-3"
                strokeWidth={1.5}
                aria-hidden
              />
              <p className="font-body text-[13px] font-semibold text-foreground mb-1">
                No evidence found
              </p>
              <p className="font-body text-[12px] text-text-secondary mb-4">
                {debouncedQ || typeFilter || skillFilter
                  ? "Try different search terms or filters."
                  : "Add portfolio links, certificates, or GitHub repos to support your skill claims."}
              </p>
              {!debouncedQ && !typeFilter && !skillFilter ? (
                <button
                  type="button"
                  onClick={openAdd}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-brand text-on-brand font-body text-[13px] font-semibold hover:bg-brand-hover"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  Add evidence
                </button>
              ) : null}
            </div>
          ) : (
            <ul className="divide-y divide-stroke-subtle">
              {rows.map((item) => {
                const Icon = TYPE_ICONS[item.type];
                return (
                  <li
                    key={item.id}
                    className="group flex items-start gap-3 px-5 min-h-[56px] py-3.5 hover:bg-bg-subtle/60 transition-colors duration-fast"
                  >
                    <div
                      aria-hidden
                      className="mt-0.5 h-8 w-8 rounded-md bg-bg-subtle border border-stroke-subtle inline-flex items-center justify-center shrink-0"
                    >
                      <Icon className="h-3.5 w-3.5 text-text-secondary" strokeWidth={2} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-body text-[13px] font-semibold text-foreground">
                          {item.title}
                        </span>
                        <StatusChip status={evidenceTypeChipStatus(item.type)} size="sm">
                          {evidenceTypeLabel(item.type)}
                        </StatusChip>
                        {item.uploadedAt ? (
                          <span className="font-body text-[11px] text-text-tertiary">
                            {fmtEvidenceDate(item.uploadedAt)}
                          </span>
                        ) : null}
                      </div>
                      {item.description ? (
                        <p className="mt-0.5 font-body text-[12px] text-text-secondary line-clamp-2">
                          {item.description}
                        </p>
                      ) : null}
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {item.skillTags.map((tag) => (
                          <span
                            key={`${item.id}-${tag}`}
                            className="font-body text-[10px] font-medium text-text-secondary bg-bg-subtle px-1.5 py-0.5 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {item.url ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 font-body text-[11px] text-brand hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" strokeWidth={2} aria-hidden />
                            {hostFromUrl(item.url)}
                          </a>
                        ) : null}
                        {item.type === "file" && item.fileId ? (
                          <span className="font-mono text-[10px] text-text-tertiary truncate max-w-[180px]">
                            {item.fileId}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-md text-text-tertiary hover:text-foreground hover:bg-surface-hover"
                        title="Edit"
                        aria-label={`Edit ${item.title}`}
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteId(item.id)}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-md text-text-tertiary hover:text-error-text hover:bg-error-subtle"
                        title="Delete"
                        aria-label={`Delete ${item.title}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className={cn("space-y-4", "xl:sticky xl:top-[calc(var(--shell-topbar-height,52px)+1rem)] xl:self-start xl:max-h-[calc(100dvh-var(--shell-topbar-height,52px)-2rem)] xl:overflow-y-auto xl:overscroll-y-contain")}>
          <div className="rounded-xl border border-stroke-subtle bg-surface p-5">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-brand shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
              <div>
                <h3 className="font-body text-[13px] font-semibold text-foreground">Privacy</h3>
                <p className="mt-1 font-body text-[12px] text-text-secondary leading-relaxed">
                  Evidence is only visible to authorized platform reviewers — not other contributors
                  or the public.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-stroke-subtle bg-surface p-5 space-y-3">
            <h3 className="font-body text-[13px] font-semibold text-foreground">Tips</h3>
            <ul className="space-y-2 font-body text-[12px] text-text-secondary leading-relaxed list-disc pl-4">
              <li>Link live projects or case studies that show your work quality.</li>
              <li>Attach certificates with verifiable credentials when available.</li>
              <li>Tag skills so reviewers can cross-check against task submissions.</li>
            </ul>
          </div>

          <div className="rounded-xl border border-stroke-subtle bg-surface p-5 space-y-2">
            <h3 className="font-body text-[13px] font-semibold text-foreground">Related</h3>
            <Link
              href="/contributor/profile/skills"
              className="block font-body text-[12.5px] text-brand hover:underline"
            >
              Declared skills →
            </Link>
            <Link
              href="/contributor/profile"
              className="block font-body text-[12.5px] text-brand hover:underline"
            >
              Profile overview →
            </Link>
          </div>

          <p className="text-right font-body text-[11px] text-text-tertiary">
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-bg-subtle border border-stroke-subtle">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
              Persona: {personaLabel}
            </span>
          </p>
        </aside>
      </div>

      <EvidenceFormDialog
        open={formOpen}
        editingId={editingId}
        initialForm={initialForm}
        submitting={submitting}
        error={formError}
        onClose={() => !submitting && setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <ConfirmationDialog
        open={Boolean(deleteId)}
        onCancel={() => !deleteMutation.isPending && setDeleteId(null)}
        onConfirm={() => void handleConfirmDelete()}
        title="Remove evidence?"
        description="This item will be permanently removed from your profile. Reviewers will no longer see it."
        confirmLabel="Remove"
        confirmTone="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

function SummaryStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <dt className="font-body text-[11px] font-medium text-text-tertiary uppercase tracking-wide">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 font-body text-[22px] font-semibold tabular-nums tracking-[-0.02em]",
          highlight ? "text-foreground" : "text-text-secondary",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
