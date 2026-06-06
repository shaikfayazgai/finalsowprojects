"use client";

/**
 * Project task drill-in — enterprise view.
 *
 * Drives the locked delivery flow: a PUBLISHED task shows its details +
 * interested contributors; the enterprise SELECTS one (→ assigned). Once
 * assigned, the enterprise can ASSIGN A REVIEWER (after the task is given to
 * the contributor). Mock-backed until /api/projects ships.
 */

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, IndianRupee, Layers, UserCheck } from "lucide-react";
import {
  getProjectTaskMock,
  assignProjectTaskMock,
  assignReviewerMock,
  setTaskPriceMock,
} from "@/lib/projects/projects-mock";
import { useTaskInterestStore } from "@/lib/stores/task-interest-store";
import { useDeliveryTaskStore } from "@/lib/stores/delivery-task-store";
import { listAdminMentors } from "@/lib/admin/mocks/mentors-service";
import { quote as priceQuote, inr } from "@/lib/pricing/pricing-engine";
import { cn } from "@/lib/utils/cn";

function formatINR(minor?: number): string {
  if (minor == null) return "—";
  return `₹${(minor / 100).toLocaleString("en-IN")}`;
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export default function ProjectTaskDetailPage() {
  const params = useParams<{ projectId: string; taskId: string }>();
  const projectId = params?.projectId ?? "";
  const taskId = params?.taskId ?? "";

  // This page reads localStorage-backed stores (project overlay + interest +
  // delivery). Those are empty during SSR but populated on the client, which
  // causes a hydration mismatch. Gate the data render on `mounted` so the first
  // client paint matches the server (placeholder), then hydrate.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // Local refresh tick so the page re-reads the mock after a mutation.
  const [tick, setTick] = React.useState(0);
  const result = React.useMemo(
    () => (projectId && taskId ? getProjectTaskMock(projectId, taskId) : undefined),
    [projectId, taskId, tick],
  );

  const listInterest = useTaskInterestStore((s) => s.listInterest);
  const interestsByTask = useTaskInterestStore((s) => s.interestsByTask);
  const selectContributor = useTaskInterestStore((s) => s.selectContributor);
  const selectedByTask = useTaskInterestStore((s) => s.selectedByTask);
  const initDeliveryTask = useDeliveryTaskStore((s) => s.initTask);
  const setDeliveryReviewer = useDeliveryTaskStore((s) => s.setReviewer);

  const [reviewerId, setReviewerId] = React.useState("");
  const [manualPrice, setManualPrice] = React.useState("");
  const reviewers = React.useMemo(() => {
    // Reuse the mentor pool list as the reviewer candidate pool for the demo.
    return listAdminMentors().map((m) => ({ id: m.id, name: m.name }));
  }, []);

  // Until mounted, render a stable placeholder identical on server + client.
  if (!mounted) {
    return (
      <div className="space-y-5 pb-12">
        <div className="rounded-lg border border-stroke bg-surface px-4 py-10 text-center">
          <p className="font-body text-[13px] text-text-tertiary">Loading task…</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="space-y-5 pb-12">
        <Link
          href="/enterprise/projects"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-body text-[12px] text-text-tertiary hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Back to projects
        </Link>
        <div className="rounded-lg border border-stroke bg-surface px-4 py-10 text-center">
          <p className="font-body text-[13px] font-semibold text-foreground">Task not found</p>
        </div>
      </div>
    );
  }

  const { project, task } = result;
  const interested = listInterest(taskId);
  // referencing the map keeps this subscribed to interest changes
  void interestsByTask[taskId];
  void selectedByTask[taskId];

  const onSelect = (c: { contributorId: string; name: string; email?: string }) => {
    assignProjectTaskMock(projectId, taskId, {
      id: c.contributorId,
      name: c.name,
      email: c.email ?? "",
    });
    selectContributor(taskId, c.contributorId);
    // Open the delivery lifecycle (submit → mentor → reviewer) for this task.
    initDeliveryTask({
      taskId,
      projectId,
      title: task.title,
      contributorId: c.contributorId,
      contributorName: c.name,
    });
    setTick((n) => n + 1);
  };

  const onAssignReviewer = () => {
    const r = reviewers.find((x) => x.id === reviewerId);
    if (!r) return;
    assignReviewerMock(projectId, taskId, r);
    setDeliveryReviewer(taskId, r.name);
    setTick((n) => n + 1);
  };

  const setAiPrice = () => {
    setTaskPriceMock(projectId, taskId, { mode: "ai" });
    setTick((n) => n + 1);
  };
  const setManualPriceMode = () => {
    const base = Math.round(parseFloat(manualPrice || "0") * 100);
    if (!base) return;
    setTaskPriceMock(projectId, taskId, { mode: "manual", manualBaseMinor: base });
    setManualPrice("");
    setTick((n) => n + 1);
  };

  // Pricing quote for this task (drives both the enterprise + Glimmora views).
  const q = priceQuote({
    mode: task.priceMode ?? "ai",
    hours: task.effortHours,
    manualPriceMinor: task.manualBaseMinor,
  });

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 font-body text-[12px] text-text-tertiary">
        <Link
          href={`/enterprise/projects/${project.id}`}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          <span>{project.name}</span>
        </Link>
        <span aria-hidden className="opacity-60">/</span>
        <span className="font-mono text-text-secondary">{task.id}</span>
      </nav>

      <header>
        <p className="font-body text-[11px] font-bold uppercase tracking-[0.12em] text-text-tertiary mb-1">
          Project · {project.name} · {task.milestone}
        </p>
        <h1 className="font-body text-[22px] sm:text-[24px] font-semibold text-foreground tracking-[-0.02em] leading-tight">
          {task.title}
        </h1>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 font-body text-[12.5px] text-text-secondary">
          <span>Assignee: <span className="text-foreground font-medium">{task.assignee}</span></span>
          <span aria-hidden className="opacity-50">·</span>
          <span className="font-mono tabular-nums">{task.effortHours}h</span>
          <span aria-hidden className="opacity-50">·</span>
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full font-body text-[10.5px] font-semibold whitespace-nowrap",
              task.state === "blocked"
                ? "bg-error-subtle text-error-text"
                : task.state === "submitted" || task.state === "reviewed"
                  ? "bg-warning-subtle text-warning-text"
                  : task.state === "accepted"
                    ? "bg-success-subtle text-success-text"
                    : task.state === "published"
                      ? "bg-brand-subtle text-brand-emphasis"
                      : "bg-bg-subtle text-text-tertiary",
            )}
          >
            {task.state.replace(/_/g, " ")}
          </span>
        </p>
      </header>

      {/* Task details */}
      <section className="rounded-lg border border-stroke bg-surface">
        <header className="px-4 py-2.5 border-b border-stroke-subtle">
          <h2 className="font-body text-[12.5px] font-semibold text-foreground">Task details</h2>
        </header>
        <div className="px-4 py-4 space-y-3">
          {task.description && (
            <p className="font-body text-[12.5px] text-text-secondary leading-relaxed">{task.description}</p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Detail label="Deal price" value={formatINR(task.priceMinor)} icon={<IndianRupee className="h-3.5 w-3.5" />} />
            <Detail label="Effort" value={`${task.effortHours}h`} icon={<Layers className="h-3.5 w-3.5" />} />
            <Detail label="Deadline" value={formatDate(task.deadline)} icon={<Clock className="h-3.5 w-3.5" />} />
            <Detail label="Reviewer" value={task.reviewerName ?? "Not assigned"} icon={<UserCheck className="h-3.5 w-3.5" />} />
          </div>
          {(task.technologies ?? task.requiredSkills ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(task.technologies ?? task.requiredSkills ?? []).map((tech) => (
                <span key={tech} className="inline-flex items-center rounded-md bg-bg-subtle px-2 py-0.5 font-body text-[11px] font-medium text-text-secondary">
                  {tech}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Pricing — mode toggle + enterprise invoice + Glimmora margin (internal) */}
      <section className="rounded-lg border border-stroke bg-surface">
        <header className="px-4 py-2.5 border-b border-stroke-subtle flex items-center justify-between">
          <h2 className="font-body text-[12.5px] font-semibold text-foreground">Pricing</h2>
          <span className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
            {q.mode === "ai" ? "AI-priced" : "Manual"}
          </span>
        </header>
        <div className="px-4 py-4 space-y-4">
          {/* Mode controls */}
          <div className="flex flex-wrap items-end gap-2">
            <button
              type="button"
              onClick={setAiPrice}
              className={cn(
                "h-9 px-3.5 rounded-md font-body text-[12.5px] font-semibold transition-colors duration-fast",
                q.mode === "ai" ? "bg-brand text-on-brand" : "bg-surface border border-stroke text-foreground hover:bg-bg-subtle",
              )}
            >
              Use AI price
            </button>
            <div className="flex items-end gap-1.5">
              <div>
                <span className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1">
                  Manual base (₹)
                </span>
                <input
                  value={manualPrice}
                  onChange={(e) => setManualPrice(e.target.value.replace(/[^0-9.]/g, ""))}
                  placeholder="e.g. 30000"
                  className="h-9 w-32 px-3 rounded-md bg-surface border border-stroke font-body text-[13px] text-foreground focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25"
                />
              </div>
              <button
                type="button"
                onClick={setManualPriceMode}
                disabled={!manualPrice}
                className="h-9 px-3.5 rounded-md bg-surface border border-stroke font-body text-[12.5px] font-semibold text-foreground hover:bg-bg-subtle disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Set manual price
              </button>
            </div>
          </div>

          {/* Enterprise-facing invoice */}
          <div className="rounded-md border border-stroke-subtle bg-bg-subtle/30 px-3 py-2.5">
            <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
              Enterprise invoice
            </p>
            <dl className="space-y-1 font-body text-[12.5px]">
              {q.mode === "manual" && (
                <>
                  <Row k="Your base price" v={inr(q.manualBaseMinor ?? 0)} />
                  <Row k="Platform markup (15%)" v={inr(q.markupMinor ?? 0)} />
                  <Row k="Platform fee" v={inr(q.flatFeeMinor ?? 0)} />
                </>
              )}
              <Row k={q.mode === "ai" ? "AI deal price" : "Deal price"} v={inr(q.enterprisePriceMinor)} bold />
              <Row k="GST (18%)" v={inr(q.enterpriseGstMinor)} />
              <Row k="Total payable to Glimmora" v={inr(q.enterpriseTotalMinor)} bold />
            </dl>
          </div>

          {/* Glimmora-internal margin — shown to platform; here for visibility */}
          <div className="rounded-md border border-brand/30 bg-brand-subtle/40 px-3 py-2.5">
            <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-brand-emphasis mb-1.5">
              Glimmora internal (not shown to contributor)
            </p>
            <dl className="space-y-1 font-body text-[12.5px]">
              <Row k="Actual cost (contributor gross)" v={inr(q.actualCostMinor)} />
              <Row k="Glimmora margin" v={inr(q.glimmoraMarginMinor)} bold />
              <Row k="Profit %" v={`${q.profitPct}%`} bold />
            </dl>
          </div>

          {/* Contributor-facing payout */}
          <div className="rounded-md border border-stroke-subtle bg-bg-subtle/30 px-3 py-2.5">
            <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
              Contributor payout
            </p>
            <dl className="space-y-1 font-body text-[12.5px]">
              <Row k={`Fixed task price (${q.hours}h × ${inr(q.contributorHourlyMinor)}/h)`} v={inr(q.contributorGrossMinor)} />
              <Row k="GST deducted (18%)" v={`− ${inr(q.contributorGstMinor)}`} />
              <Row k="Net payout" v={inr(q.contributorNetMinor)} bold />
            </dl>
          </div>
        </div>
      </section>

      {/* Interested contributors → select one (published only) */}
      {task.state === "published" && (
        <section className="rounded-lg border border-stroke bg-surface">
          <header className="px-4 py-2.5 border-b border-stroke-subtle flex items-center justify-between">
            <h2 className="font-body text-[12.5px] font-semibold text-foreground">
              Interested contributors
            </h2>
            <span className="font-body text-[11.5px] text-text-tertiary">{interested.length} interested</span>
          </header>
          {interested.length === 0 ? (
            <p className="px-4 py-6 font-body text-[12.5px] text-text-tertiary italic">
              No contributors have expressed interest yet. Published tasks appear on the contributor Opportunities board.
            </p>
          ) : (
            <ul className="divide-y divide-stroke-subtle">
              {interested.map((c) => (
                <li key={c.contributorId} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-body text-[13px] font-medium text-foreground">{c.name}</p>
                    {c.email && <p className="font-body text-[11.5px] text-text-tertiary">{c.email}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelect(c)}
                    className="inline-flex items-center justify-center h-8 px-3.5 rounded-md bg-brand text-on-brand font-body text-[12.5px] font-semibold hover:bg-brand-hover transition-colors duration-fast"
                  >
                    Select
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Assigned → show contributor + assign reviewer */}
      {task.state !== "published" && (
        <section className="rounded-lg border border-stroke bg-surface">
          <header className="px-4 py-2.5 border-b border-stroke-subtle">
            <h2 className="font-body text-[12.5px] font-semibold text-foreground">Assignment & review</h2>
          </header>
          <div className="px-4 py-4 space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded-md bg-success-subtle px-3 py-1.5 font-body text-[12px] font-semibold text-success-text">
              <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
              Assigned to {task.assignee}
            </div>

            {/* Enterprise assigns reviewer AFTER the task is given to the contributor */}
            {task.reviewerName ? (
              <p className="font-body text-[12.5px] text-text-secondary">
                Reviewer: <span className="text-foreground font-medium">{task.reviewerName}</span>
                <span className="text-text-tertiary"> (assigned by Enterprise)</span>
              </p>
            ) : (
              <div className="flex flex-wrap items-end gap-2">
                <div>
                  <span className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
                    Assign reviewer
                  </span>
                  <select
                    value={reviewerId}
                    onChange={(e) => setReviewerId(e.target.value)}
                    className="h-9 px-3 rounded-md bg-surface border border-stroke font-body text-[13px] text-foreground focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25"
                  >
                    <option value="">Select a reviewer…</option>
                    {reviewers.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={onAssignReviewer}
                  disabled={!reviewerId}
                  className="inline-flex items-center justify-center h-9 px-4 rounded-md bg-brand text-on-brand font-body text-[13px] font-semibold hover:bg-brand-hover transition-colors duration-fast disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Assign reviewer
                </button>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className={cn("text-text-secondary", bold && "text-foreground font-semibold")}>{k}</dt>
      <dd className={cn("tabular-nums text-foreground", bold && "font-semibold")}>{v}</dd>
    </div>
  );
}

function Detail({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div>
      <p className="inline-flex items-center gap-1 font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        <span className="text-text-tertiary" aria-hidden>{icon}</span>
        {label}
      </p>
      <p className="mt-0.5 font-body text-[13px] font-medium text-foreground">{value}</p>
    </div>
  );
}
