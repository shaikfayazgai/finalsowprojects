"use client";

/**
 * Zone A · Context bar
 *
 * Calm 2-line entry. Eyebrow + greeting + 1-line operational summary.
 * No gradient, no emoji, no KPI band. The whole point is: orient the
 * contributor and let the focus area below do the work.
 */

import * as React from "react";
import { useSession } from "next-auth/react";
import { useContributorTaskList } from "@/lib/contributor/use-contributor-tasks";
import type { ContributorTask } from "@/mocks/data/contributor-workspace";

function isActiveTask(t: ContributorTask) {
  return (
    t.state !== "approved" &&
    t.state !== "completed" &&
    t.state !== "under_review"
  );
}

function isDueWithin24h(t: ContributorTask) {
  return (
    t.deadlineHoursRemaining > 0 &&
    t.deadlineHoursRemaining <= 24 &&
    isActiveTask(t)
  );
}

export function DashboardContextBar() {
  const { data: session } = useSession();
  const tasks = useContributorTaskList();

  const firstName =
    (session?.user?.name as string | undefined)?.split(" ")[0] ||
    (session?.user?.email as string | undefined)?.split("@")[0] ||
    "there";

  const active = tasks.filter(isActiveTask).length;
  const dueSoon = tasks.filter(isDueWithin24h).length;
  const revisions = tasks.filter((t) => t.state === "revision_requested").length;
  const blocked = tasks.filter((t) => t.state === "blocked").length;

  const [dateLabel, setDateLabel] = React.useState("");
  const [greeting, setGreeting] = React.useState("Hello");

  React.useEffect(() => {
    const now = new Date();
    const h = now.getHours();
    setGreeting(
      h < 5
        ? "Working late"
        : h < 12
          ? "Good morning"
          : h < 17
            ? "Good afternoon"
            : "Good evening",
    );
    setDateLabel(
      now.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    );
  }, []);

  return (
    <header className="space-y-1">
      <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.12em] text-text-tertiary">
        Today · {dateLabel}
      </p>
      <div className="flex items-baseline gap-x-3 gap-y-1 flex-wrap">
        <h1 className="font-body text-[22px] sm:text-[24px] font-semibold text-foreground tracking-[-0.02em] leading-tight">
          {greeting}, {firstName}
        </h1>
        {active > 0 && (
          <p className="font-body text-[13px] text-text-secondary">
            <StatusLine
              active={active}
              dueSoon={dueSoon}
              revisions={revisions}
              blocked={blocked}
            />
          </p>
        )}
      </div>
    </header>
  );
}

function StatusLine({
  active,
  dueSoon,
  revisions,
  blocked,
}: {
  active: number;
  dueSoon: number;
  revisions: number;
  blocked: number;
}) {
  // Single most-important fragment in the spoken-language form.
  if (revisions > 0) {
    return (
      <span className="text-foreground">
        <strong className="font-semibold">
          {revisions} revision{revisions === 1 ? "" : "s"}
        </strong>{" "}
        waiting for you
        {dueSoon > 0 && ` · ${dueSoon} due today`}
      </span>
    );
  }
  if (dueSoon > 0) {
    return (
      <span className="text-foreground">
        <strong className="font-semibold">
          {dueSoon} task{dueSoon === 1 ? "" : "s"}
        </strong>{" "}
        due in the next 24h
      </span>
    );
  }
  if (blocked > 0) {
    return (
      <span className="text-foreground">
        <strong className="font-semibold">
          {blocked} blocked
        </strong>{" "}
        — worth a look
      </span>
    );
  }
  return (
    <span className="text-text-secondary">
      <strong className="font-semibold text-foreground">{active}</strong> active —
      momentum looks steady
    </span>
  );
}
