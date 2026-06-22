"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface OpsBreadcrumbItem {
  label: string;
  href?: string;
}

/**
 * Canonical operational breadcrumb. Sits below the OperationalPageHeader on
 * queue pages so the operator always knows their position in the Reviews IA.
 *
 * Convention: "Mentor Workspace" → "Reviews" → "{current page}".
 * Home glyph at the head; chevrons between segments; current segment is
 * non-link, brown-700, semibold.
 */
export function OpsBreadcrumb({ items, className }: { items: OpsBreadcrumbItem[]; className?: string }) {
  return (
    <nav
      aria-label="Operational breadcrumb"
      className={cn(
        "flex items-center gap-1.5 text-[11.5px] text-gray-500",
        className
      )}
    >
      <Link
        href="/mentor/dashboard"
        className="inline-flex items-center gap-1 hover:text-brown-700"
        title="Operational Dashboard"
      >
        <Home className="h-3 w-3" />
      </Link>
      {items.map((item, idx) => {
        const last = idx === items.length - 1;
        return (
          <React.Fragment key={`${item.label}-${idx}`}>
            <ChevronRight className="h-3 w-3 text-gray-400" />
            {last || !item.href ? (
              <span className="font-semibold text-brown-700">{item.label}</span>
            ) : (
              <Link href={item.href} className="hover:text-brown-700">
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
