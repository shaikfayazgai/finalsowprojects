"use client";

/**
 * Mentor · SOW detail — full scope, files and decomposition task statuses for one
 * assigned SOW. Reached by clicking a SOW from the Assigned SOWs list.
 */

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SowWorkContextPanel } from "@/components/delivery/sow-work-context-panel";

export default function MentorSowDetailPage() {
  const params = useParams<{ sowId: string }>();
  const sowId = params?.sowId ?? "";

  return (
    <div className="space-y-5 animate-fade-in">
      <Link
        href="/mentor/sows"
        className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to assigned SOWs
      </Link>
      <SowWorkContextPanel sowId={sowId} role="mentor" />
    </div>
  );
}
