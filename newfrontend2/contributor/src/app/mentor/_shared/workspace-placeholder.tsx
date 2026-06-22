"use client";

import * as React from "react";
import { Construction, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";
import {
  OperationalPageHeader,
  ContextChip,
} from "../dashboard/components/operational-page-header";
import { OperationalCard } from "../dashboard/components/operational-primitives";

interface WorkspacePlaceholderProps {
  title: string;
  description: string;
  /** Section label shown above the title (e.g. "Reviews", "Governance"). */
  section: string;
  /** What this page will surface once built. */
  willInclude: string[];
  /** Related links to nudge the operator to existing surfaces. */
  relatedLinks?: { label: string; href: string }[];
}

/**
 * Shared placeholder used by every reorganized Mentor Workspace V2 route
 * that hasn't been built yet. Maintains the operational shell + header so
 * stakeholders can navigate the full IA during the demo.
 */
export function WorkspacePlaceholder({
  title,
  description,
  section,
  willInclude,
  relatedLinks,
}: WorkspacePlaceholderProps) {
  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      <OperationalPageHeader
        title={title}
        subtitle={description}
        contextFilters={
          <>
            <ContextChip label="Section" value={section} active />
            <ContextChip label="Phase" value="V2 · planned" />
          </>
        }
      />

      <OperationalCard>
        <div className="flex items-start gap-4">
          <div className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gold-200 bg-gold-50 text-gold-700">
            <Construction className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-gold-700">
              Planned · Mentor Workspace V2
            </p>
            <h2 className="font-heading text-lg font-semibold text-brown-950 mt-1">
              Surface scaffolded — implementation queued
            </h2>
            <p className="text-[13px] text-gray-600 mt-1 max-w-2xl leading-relaxed">
              This route is part of the reorganized Mentor Workspace information architecture. The
              UX contract is defined; full operational implementation lands in the next build phase.
            </p>

            <div className="mt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                Will include
              </p>
              <ul className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
                {willInclude.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-[12.5px] text-gray-700"
                  >
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-gray-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {relatedLinks && relatedLinks.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {relatedLinks.map((l) => (
                  <Button
                    key={l.href}
                    asChild
                    variant="ghost"
                    size="sm"
                    className="gap-1.5"
                  >
                    <a href={l.href}>
                      {l.label} <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </OperationalCard>
    </div>
  );
}
