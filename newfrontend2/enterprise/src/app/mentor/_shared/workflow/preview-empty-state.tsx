"use client";

import * as React from "react";
import { Inbox, type LucideIcon } from "lucide-react";
import { OperationalCard } from "@/app/mentor/dashboard/components/operational-primitives";

/**
 * Canonical empty state for side preview / investigation panels. Used when
 * no row is selected. Single rounded card, centered icon, concise prompt.
 */
export function PreviewEmptyState({
  title,
  description,
  icon: Icon = Inbox,
  className,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <OperationalCard className={`sticky top-2 self-start h-fit text-center ${className ?? ""}`}>
      <div className="py-8">
        <div className="mx-auto h-10 w-10 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-500">
          <Icon className="h-5 w-5" />
        </div>
        <p className="mt-3 text-[13px] font-semibold text-brown-950">{title}</p>
        <p className="mt-1 text-[11.5px] text-gray-500 leading-snug">{description}</p>
      </div>
    </OperationalCard>
  );
}
