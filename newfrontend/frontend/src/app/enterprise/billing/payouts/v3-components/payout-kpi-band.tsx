"use client";

import * as React from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Send,
  Users,
} from "lucide-react";
import { formatMoney } from "@/mocks/data/enterprise-v2-orchestration";
import type { PayoutOverview } from "@/lib/enterprise/use-payout-overview";
import { StatCard } from "@/app/admin/_shell/aurora-ui";

interface PayoutKpiBandProps {
  overview: PayoutOverview;
}

export const PayoutKpiBand: React.FC<PayoutKpiBandProps> = ({ overview }) => {
  return (
    <section
      aria-label="Payout overview"
      className="grid grid-cols-2 lg:grid-cols-5 gap-4"
    >
      <StatCard
        label="Ready to send"
        value={String(overview.readyCount)}
        icon={CheckCircle2}
        hint={formatMoney(overview.readyCents)}
        hintTone={overview.readyCount > 0 ? "success" : "neutral"}
      />
      <StatCard
        label="In flight"
        value={String(overview.inFlightCount)}
        icon={Send}
        hint={formatMoney(overview.inFlightCents)}
        hintTone={overview.inFlightCount > 0 ? "warning" : "neutral"}
      />
      <StatCard
        label="Failed"
        value={String(overview.failedCount)}
        icon={AlertCircle}
        hint={overview.failedCount === 0 ? "No failed transfers" : "Action needed"}
        hintTone={overview.failedCount > 0 ? "error" : "neutral"}
      />
      <StatCard
        label="On hold"
        value={String(overview.onHoldCount)}
        icon={AlertTriangle}
        hint={overview.onHoldCount === 0 ? "No holds" : "KYC / compliance"}
        hintTone={overview.onHoldCount > 0 ? "warning" : "neutral"}
      />
      <StatCard
        label="Contributors"
        value={String(overview.totalContributors)}
        icon={Users}
        hint="Touched this cycle"
        hintTone="neutral"
      />
    </section>
  );
};
