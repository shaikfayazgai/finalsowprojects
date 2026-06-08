"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Side-anchored workspace drawer. Used by Rework / Escalation / Hold list
 * pages to open the full operational workflow without leaving the queue.
 *
 * Width is opinionated: 720 px keeps the parent queue scannable and the
 * drawer itself wide enough for three columns inside.
 */
export function WorkspaceDrawer({
  open,
  onClose,
  title,
  eyebrow,
  badges,
  children,
  footer,
  width = 760,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  badges?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close drawer"
        onClick={onClose}
        className="absolute inset-0 bg-brown-950/40 backdrop-blur-sm"
      />
      <aside
        className={cn(
          "relative h-full bg-beige-50/95 border-l border-gray-200 shadow-2xl flex flex-col"
        )}
        style={{ width }}
      >
        <header className="shrink-0 border-b border-gray-200 bg-white px-6 py-4 flex items-start gap-3">
          <div className="flex-1 min-w-0">
            {eyebrow && (
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brown-600">
                {eyebrow}
              </p>
            )}
            <h2 className="font-heading text-xl font-semibold text-brown-950 mt-1 leading-tight truncate">
              {title}
            </h2>
            {badges && <div className="mt-2 flex items-center gap-1.5 flex-wrap">{badges}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
            aria-label="Close drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">{children}</div>

        {footer && (
          <footer className="shrink-0 border-t border-gray-200 bg-white px-6 py-3">{footer}</footer>
        )}
      </aside>
    </div>
  );
}
