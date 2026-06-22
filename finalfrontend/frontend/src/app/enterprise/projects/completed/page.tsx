"use client";

/**
 * Completed projects — spec doc 02 §5.E.9.
 *
 * Closed projects with summary metrics. Mock-backed.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { listCompletedProjectsMock } from "@/lib/projects/projects-mock";
import { cn } from "@/lib/utils/cn";
import { GLASS_CARD, GLASS_SHADOW } from "@/app/admin/_shell/aurora";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function CompletedProjectsPage() {
  const router = useRouter();
  const projects = React.useMemo(() => listCompletedProjectsMock(), []);

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 font-body text-[12px] text-text-tertiary"
      >
        <Link
          href="/enterprise/projects"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:text-foreground hover:bg-white/50 transition-colors duration-fast"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          <span>Projects</span>
        </Link>
        <span aria-hidden className="opacity-60">
          /
        </span>
        <span className="text-text-secondary">Completed</span>
      </nav>

      <header>
        <p className="font-body text-[11px] font-bold uppercase tracking-[0.12em] text-text-tertiary mb-1">
          Enterprise · Projects
        </p>
        <h1 className="font-display text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Completed projects
        </h1>
        <p className="mt-1.5 font-body text-[13px] text-text-secondary">
          Closed projects with their key metrics.
        </p>
      </header>

      {projects.length === 0 ? (
        <div className={cn(GLASS_CARD, "overflow-hidden px-4 py-10 text-center")} style={GLASS_SHADOW}>
          <p className="font-body text-[13px] font-semibold text-foreground">
            No completed projects yet
          </p>
        </div>
      ) : (
        <div className={cn(GLASS_CARD, "overflow-hidden")} style={GLASS_SHADOW}>
          <table className="w-full" aria-label="Completed projects">
            <thead className="bg-white/40">
              <tr>
                <Th>Name</Th>
                <Th>Sponsor</Th>
                <Th>Started</Th>
                <Th align="right">Closed</Th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => {
                const href = `/enterprise/projects/${p.id}`;
                const go = () => router.push(href);
                return (
                <tr
                  key={p.id}
                  role="link"
                  tabIndex={0}
                  onClick={go}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      go();
                    }
                  }}
                  aria-label={`Open ${p.name}`}
                  className={cn(
                    "cursor-pointer border-t border-white/55 hover:bg-white/50 transition-colors duration-fast",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
                  )}
                >
                  <td className="px-4 py-2.5 max-w-0">
                    <div className="inline-flex items-center gap-1.5 max-w-full" title={p.name}>
                      <span className="font-body text-[13px] font-medium text-foreground truncate">
                        {p.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap font-body text-[12.5px] text-text-secondary truncate">
                    {p.sponsor}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap font-mono text-[11px] text-text-tertiary tabular-nums">
                    {fmtDate(p.startedAt)}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-right font-mono text-[11px] text-text-tertiary tabular-nums">
                    {p.completedAt ? fmtDate(p.completedAt) : "—"}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      scope="col"
      className={cn(
        "font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary",
        "px-4 py-2.5",
        align === "right" ? "text-right" : "text-left",
      )}
    >
      {children}
    </th>
  );
}
