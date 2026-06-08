"use client";

import * as React from "react";
import { CheckCircle2, FileText, Layers, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface StageCommitProps {
  title: string;
  client: string;
  portfolio: string;
  classification: string;
  reviewModel: string;
  frameworks: string[];
  estimatedTasks: number;
  readinessPct: number;
}

export const StageCommit: React.FC<StageCommitProps> = ({
  title,
  client,
  portfolio,
  classification,
  reviewModel,
  frameworks,
  estimatedTasks,
  readinessPct,
}) => (
  <section className="rounded-xl bg-surface ring-1 ring-stroke-subtle overflow-hidden">
    <header className="px-5 py-3.5 border-b border-stroke-subtle">
      <h2 className="font-body text-[14px] font-semibold text-foreground leading-tight">
        Review and commit
      </h2>
      <p className="font-body text-[12px] text-text-tertiary mt-0.5 leading-snug">
        Confirms the SOW into the pipeline, seeds the decomposition plan, and stamps the audit ledger.
      </p>
    </header>

    <div className="px-5 py-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Row icon={FileText} label="Title" value={title} />
      <Row icon={Users} label="Client · Portfolio" value={`${client} · ${portfolio || "—"}`} />
      <Row icon={Layers} label="Classification" value={classification} />
      <Row icon={Sparkles} label="Review model" value={reviewModel} />
      <Row icon={FileText} label="Frameworks" value={frameworks.length === 0 ? "—" : frameworks.join(" · ")} />
      <Row icon={Layers} label="Estimated tasks" value={`${estimatedTasks}`} />
    </div>

    <footer className="px-5 py-3.5 border-t border-stroke-subtle bg-[color-mix(in_oklab,var(--color-brand)_4%,transparent)] flex items-center gap-3 flex-wrap">
      <CheckCircle2 className="h-4 w-4 text-[var(--color-brand)]" strokeWidth={2} aria-hidden />
      <p className="font-body text-[12.5px] text-foreground flex-1">
        Ready to commit at <strong>{readinessPct}% readiness</strong>. Approval matrix seeds with default reviewers.
      </p>
    </footer>
  </section>
);

const Row: React.FC<{
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
}> = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 rounded-lg bg-bg-subtle/50 ring-1 ring-stroke-subtle px-3 py-2.5">
    <span
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md ring-1 shrink-0",
        "ring-[color-mix(in_oklab,var(--color-brand)_22%,transparent)] bg-[color-mix(in_oklab,var(--color-brand)_8%,transparent)] text-[var(--color-brand)]",
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
    </span>
    <div className="min-w-0 flex-1">
      <p className="font-body text-[10px] font-bold uppercase tracking-[0.12em] text-text-tertiary">
        {label}
      </p>
      <p className="font-body text-[12.5px] font-semibold text-foreground mt-1 leading-snug truncate">
        {value || "—"}
      </p>
    </div>
  </div>
);
