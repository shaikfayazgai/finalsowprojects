"use client";

/**
 * SOW templates — spec doc 02 §5.C.10.
 *
 * Phase 1: list of SOW intake templates (per client BU / project type).
 * Mock-backed until a templates endpoint ships.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface SowTemplateMock {
  id: string;
  name: string;
  useCase: string;
  approverChain: string;
  usedCount: number;
}

function listTemplatesMock(): SowTemplateMock[] {
  return [
    { id: "design-q-cycle", name: "Design System Q-cycle", useCase: "Design / DevX", approverChain: "5-stage", usedCount: 12 },
    { id: "marketing", name: "Marketing campaign", useCase: "MarTech", approverChain: "3-stage", usedCount: 8 },
    { id: "engineering", name: "Engineering project", useCase: "Default", approverChain: "5-stage", usedCount: 24 },
  ];
}

export default function SowTemplatesPage() {
  const router = useRouter();
  const templates = React.useMemo(() => listTemplatesMock(), []);

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 font-body text-[12px] text-text-tertiary"
      >
        <Link
          href="/enterprise/sow"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          <span>SOWs</span>
        </Link>
        <span aria-hidden className="opacity-60">/</span>
        <span className="text-text-secondary">Templates</span>
      </nav>

      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="font-body text-[11px] font-bold uppercase tracking-[0.12em] text-text-tertiary mb-1">
            Enterprise · SOW
          </p>
          <h1 className="font-body text-[22px] sm:text-[24px] font-semibold text-foreground tracking-[-0.02em] leading-tight">
            SOW templates
          </h1>
          <p className="mt-1.5 font-body text-[13px] text-text-secondary">
            Reusable intake templates per business unit or project type.
          </p>
        </div>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md",
            "bg-foreground text-text-inverse",
            "font-body text-[13px] font-semibold",
            "hover:opacity-90 transition-opacity duration-fast",
          )}
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          New template
        </button>
      </header>

      <section className="rounded-lg border border-stroke bg-surface overflow-hidden">
        <table className="w-full" aria-label="SOW templates">
          <thead className="bg-bg-subtle/30">
            <tr>
              <Th>Name</Th>
              <Th>Use case</Th>
              <Th>Approver chain</Th>
              <Th align="right">Used</Th>
            </tr>
          </thead>
          <tbody>
            {templates.map((t) => {
              const href = `/enterprise/sow/intake?template=${t.id}`;
              const go = () => router.push(href);
              return (
              <tr
                key={t.id}
                role="link"
                tabIndex={0}
                onClick={go}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    go();
                  }
                }}
                aria-label={`Use ${t.name}`}
                className={cn(
                  "cursor-pointer border-t border-stroke-subtle hover:bg-bg-subtle transition-colors duration-fast",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
                )}
              >
                <td className="px-4 py-2.5 max-w-0">
                  <div className="inline-flex items-center gap-1.5 max-w-full" title={t.name}>
                    <span className="font-body text-[13px] font-medium text-foreground truncate">
                      {t.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap font-body text-[12.5px] text-text-secondary">
                  {t.useCase}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-brand-subtle text-brand-subtle-text font-body text-[10.5px] font-semibold">
                    {t.approverChain}
                  </span>
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap text-right font-mono text-[11px] text-text-secondary tabular-nums">
                  {t.usedCount}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </section>
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
