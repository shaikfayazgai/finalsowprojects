"use client";

/**
 * Zone F · AI signals — subtle, operational
 *
 * 2–3 short observations. Never autonomous, never CTA-led. The AI tone
 * is "pattern noticer", not "agent". Always uses the AI surface tokens
 * (`var(--color-ai-surface)` / `var(--color-ai-text)`).
 */

import * as React from "react";
import { Sparkles } from "lucide-react";
import { useContributorTaskList } from "@/lib/contributor/use-contributor-tasks";

interface Signal {
  id: string;
  text: string;
}

function buildSignals(
  tasks: ReturnType<typeof useContributorTaskList>,
): Signal[] {
  const out: Signal[] = [];

  // Pattern 1 — recurring keyword in mentor feedback (correction labels)
  const correctionLabels = tasks
    .flatMap((t) => t.mentorFeedback?.requiredCorrections ?? [])
    .map((c) => c.description);
  const commonKeyword = pickKeyword(correctionLabels);
  if (commonKeyword) {
    out.push({
      id: "fb-pattern",
      text: `Reviewers keep flagging "${commonKeyword}" — addressing it up-front could lift your acceptance rate.`,
    });
  }

  // Pattern 2 — submissions likely to need clarification
  const fragile = tasks.filter(
    (t) => t.state === "in_progress" && (t.readinessScore ?? 0) < 60,
  ).length;
  if (fragile >= 2) {
    out.push({
      id: "fragile",
      text: `${fragile} submissions sit below 60% readiness — small gaps now may turn into revision rounds later.`,
    });
  }

  // Pattern 3 — momentum
  const accepted = tasks.filter(
    (t) => t.state === "approved" || t.state === "completed",
  ).length;
  if (accepted >= 3) {
    out.push({
      id: "momentum",
      text: `Momentum strong — ${accepted} clean accepts on record. Streaks compound your reviewer trust.`,
    });
  }

  // Pattern 4 — first-time-quality bonus is close
  const inReview = tasks.filter((t) => t.state === "under_review").length;
  if (inReview > 0) {
    out.push({
      id: "in-review",
      text: `${inReview} submission${inReview === 1 ? " is" : "s are"} in mentor review — typical turnaround is 6–18 hours.`,
    });
  }

  return out.slice(0, 3);
}

function pickKeyword(samples: string[]): string | null {
  const keywords = [
    "focus trap",
    "WCAG",
    "test coverage",
    "type definitions",
    "accessibility",
    "retry logic",
    "evidence",
  ];
  for (const k of keywords) {
    const matches = samples.filter((s) => s.toLowerCase().includes(k.toLowerCase())).length;
    if (matches >= 1) return k;
  }
  return null;
}

export function AiSignals() {
  const tasks = useContributorTaskList();
  const signals = React.useMemo(() => buildSignals(tasks), [tasks]);

  if (signals.length === 0) return null;

  return (
    <section
      aria-label="AI signals"
      className="rounded-xl bg-[var(--color-ai-surface)]/40 ring-1 ring-stroke-subtle overflow-hidden"
    >
      <div className="px-5 py-3 flex items-center justify-between gap-3 border-b border-stroke-subtle">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-flex items-center justify-center h-6 w-6 rounded bg-[var(--color-ai-surface)] text-[var(--color-ai-text)]"
          >
            <Sparkles className="h-3 w-3" strokeWidth={2} aria-hidden />
          </span>
          <h2 className="font-body text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--color-ai-text)]">
            AI signals
          </h2>
        </div>
        <p className="font-body text-[10.5px] text-text-tertiary">
          Patterns we noticed — not orders
        </p>
      </div>
      <ul className="divide-y divide-stroke-subtle">
        {signals.map((s) => (
          <li
            key={s.id}
            className="px-5 py-2.5 font-body text-[12.5px] text-foreground leading-snug"
          >
            <span aria-hidden className="text-[var(--color-ai-text)] mr-1.5">
              ›
            </span>
            {s.text}
          </li>
        ))}
      </ul>
    </section>
  );
}
