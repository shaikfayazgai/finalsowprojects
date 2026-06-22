"use client";

/**
 * Payout detail — scorecard cockpit.
 *   BackLink → identity header card (icon chip + eyebrow + amount + status Chip + meta)
 *   → 4-StatCard vital-signs strip → alert banner (conditional)
 *   → tabbed sections card (Ledger · Computation · Details · Lineage)
 */

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  AlertCircle,
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Clock,
  Hash,
  Layers,
} from "lucide-react";
import { useTenantPayouts } from "@/lib/hooks/use-enterprise-billing";
import { PayoutDetailSkeleton } from "@/components/enterprise/page-skeletons";
import {
  ComputationSection,
  fmtINRMinor,
  formatContributor,
  LedgerSection,
  LineageSection,
  PayoutFactsSection,
  statusLabel,
  statusTone,
} from "./components/detail-sections";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD, GLASS_GRADIENT } from "@/app/admin/_shell/aurora";
import {
  Chip,
  StatCard,
  TONE,
  type Tone,
} from "@/app/admin/_shell/aurora-ui";

type TabKey = "ledger" | "computation" | "details" | "lineage";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "ledger", label: "Ledger trail" },
  { key: "computation", label: "Amount breakdown" },
  { key: "details", label: "Payout details" },
  { key: "lineage", label: "Lineage" },
];

function TabPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      style={active ? GLASS_GRADIENT : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg font-body text-[13px] font-semibold whitespace-nowrap transition-colors",
        active
          ? "text-white"
          : "text-text-secondary hover:text-foreground hover:bg-bg-subtle",
      )}
    >
      {label}
    </button>
  );
}

export default function PayoutDetailPage() {
  const params = useParams<{ payoutId: string }>();
  const payoutId = params?.payoutId ?? "";
  const [tab, setTab] = React.useState<TabKey>("ledger");

  const { data, isLoading, error } = useTenantPayouts({});
  const payout = (data?.items ?? []).find((p) => p.id === payoutId);

  if (isLoading) {
    return <PayoutDetailSkeleton />;
  }

  if (error || !payout) {
    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        <BackLink />
        <div className="rounded-lg border border-error-border bg-error-subtle px-4 py-3 flex items-start gap-2.5">
          <AlertCircle
            className="h-4 w-4 text-error-text shrink-0 mt-0.5"
            strokeWidth={2}
            aria-hidden
          />
          <p className="font-body text-[12.5px] text-error-text flex-1">
            {error instanceof Error ? error.message : "Payout not found"}
            {payoutId ? (
              <span className="block mt-1 font-mono text-[11px] opacity-80">
                {payoutId}
              </span>
            ) : null}
          </p>
        </div>
      </div>
    );
  }

  /* Alert banner config */
  type AlertDef = { tone: Tone; title: string; body: React.ReactNode };
  const alert: AlertDef | null =
    payout.status === "eligible"
      ? {
          tone: "ai",
          title: "Ready for batch release",
          body: "This payout is eligible — it will move when you release the pending batch from the payouts ledger.",
        }
      : payout.status === "on_hold"
        ? {
            tone: "error",
            title: "Payout on hold",
            body: "Compliance or KYC review is blocking release. Resolve the hold before batch release.",
          }
        : payout.status === "failed"
          ? {
              tone: "error",
              title: "Payout failed",
              body:
                payout.failureReason ??
                "Transfer failed — contributor may need to update payout method.",
            }
          : payout.status === "sent"
            ? {
                tone: "success",
                title: "Funds sent",
                body: (
                  <>
                    Payout completed successfully
                    {payout.externalRef ? (
                      <>
                        {" "}
                        — reference{" "}
                        <span className="font-mono tabular-nums">
                          {payout.externalRef}
                        </span>
                      </>
                    ) : (
                      "."
                    )}
                  </>
                ),
              }
            : payout.status === "requested" || payout.status === "processing"
              ? {
                  tone: "warning",
                  title: "Payout in flight",
                  body: "Funds are being processed. The ledger trail updates as each stage completes.",
                }
              : null;

  const bucket =
    payout.status === "eligible"
      ? "eligible"
      : payout.status === "sent"
        ? "paid"
        : payout.status === "failed"
          ? "reversed"
          : payout.status === "on_hold"
            ? "on hold"
            : "in flight";

  const computationHint = `${payout.computation.hoursBilled}h × rate`;

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <BackLink />

      {/* Identity header card */}
      <header className={cn(DASH_CARD, "p-5 flex items-start gap-4")}>
        <span
          className="grid place-items-center h-12 w-12 rounded-lg text-white shrink-0"
          style={GLASS_GRADIENT}
          aria-hidden
        >
          <Banknote className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
            Finance · Payout · {payout.id}
          </p>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-[22px] sm:text-[24px] font-bold text-foreground tracking-[-0.025em] leading-none tabular-nums">
              {fmtINRMinor(payout.amountMinor, payout.currency)}
            </h1>
            <Chip tone={statusTone(payout.status)} className="capitalize">
              {statusLabel(payout.status)}
            </Chip>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-[12px] text-text-tertiary">
            <span>
              Contributor{" "}
              <span className="font-medium text-text-secondary">
                {formatContributor(payout.contributorId)}
              </span>
            </span>
            <span aria-hidden>·</span>
            <span className="font-mono tabular-nums">
              {payout.taskDefinitionId}
            </span>
            <span aria-hidden>·</span>
            <span className="capitalize">{bucket}</span>
          </div>
          <RecordLinks payoutId={payout.id} submissionId={payout.submissionId} />
        </div>
      </header>

      {/* Vital-signs scorecard */}
      <section
        aria-label="Payout scorecard"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          label="Amount"
          value={fmtINRMinor(payout.amountMinor, payout.currency)}
          icon={Banknote}
          hint={computationHint}
          hintTone="neutral"
        />
        <StatCard
          label="Status"
          value={statusLabel(payout.status)}
          icon={CheckCircle2}
          hintTone={statusTone(payout.status)}
          hint={
            payout.sentAt
              ? `sent ${new Date(payout.sentAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
              : payout.eligibleAt
                ? `eligible ${new Date(payout.eligibleAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
                : undefined
          }
        />
        <StatCard
          label="Hours billed"
          value={String(payout.computation.hoursBilled)}
          icon={Clock}
          hint={`${fmtINRMinor(payout.computation.ratePerHour * payout.computation.minorMultiplier, payout.currency)} / hr`}
          hintTone="neutral"
        />
        <StatCard
          label="Payout ID"
          value={payout.id.slice(0, 12) + "…"}
          icon={Hash}
          hint={payout.tenantId}
          hintTone="neutral"
        />
      </section>

      {/* Conditional alert */}
      {alert && (
        <div
          className="rounded-lg border px-4 py-3 flex items-start gap-2.5"
          style={{
            background: TONE[alert.tone].soft,
            borderColor: TONE[alert.tone].border,
          }}
        >
          {alert.tone === "error" ? (
            <AlertTriangle
              className="h-4 w-4 shrink-0 mt-0.5"
              strokeWidth={2}
              style={{ color: TONE.error.text }}
              aria-hidden
            />
          ) : alert.tone === "success" ? (
            <CheckCircle2
              className="h-4 w-4 shrink-0 mt-0.5"
              strokeWidth={2}
              style={{ color: TONE.success.text }}
              aria-hidden
            />
          ) : (
            <Layers
              className="h-4 w-4 shrink-0 mt-0.5"
              strokeWidth={2}
              style={{ color: TONE[alert.tone].text }}
              aria-hidden
            />
          )}
          <p className="font-body text-[12.5px] text-text-secondary">
            <span className="font-semibold text-foreground">{alert.title}</span>{" "}
            — {alert.body}
          </p>
        </div>
      )}

      {/* Tabbed sections */}
      <div className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="border-b border-stroke-subtle px-3 sm:px-4 py-2.5">
          <nav aria-label="Payout sections" className="flex flex-wrap gap-1.5">
            {TABS.map((t) => (
              <TabPill
                key={t.key}
                label={t.label}
                active={tab === t.key}
                onClick={() => setTab(t.key)}
              />
            ))}
          </nav>
        </div>

        <div className="px-5 sm:px-6 py-5">
          {tab === "ledger" && <LedgerSection payout={payout} />}
          {tab === "computation" && <ComputationSection payout={payout} />}
          {tab === "details" && <PayoutFactsSection payout={payout} />}
          {tab === "lineage" && <LineageSection payout={payout} />}
        </div>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/enterprise/billing/payouts"
      className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-sm"
    >
      <ArrowLeft className="h-4 w-4" strokeWidth={2.2} aria-hidden />
      Back to payouts
    </Link>
  );
}

function RecordLinks({
  payoutId,
  submissionId,
}: {
  payoutId: string;
  submissionId: string;
}) {
  const auditHref = `/enterprise/audit?resourceType=payout&resourceId=${encodeURIComponent(payoutId)}`;

  return (
    <p className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-[12px]">
      <Link
        href="/enterprise/billing"
        className="font-semibold text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors"
      >
        Billing overview
      </Link>
      <span aria-hidden className="text-text-disabled">
        ·
      </span>
      <Link
        href={`/enterprise/review/${submissionId}`}
        className="font-semibold text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors"
      >
        Acceptance record
      </Link>
      <span aria-hidden className="text-text-disabled">
        ·
      </span>
      <Link
        href={auditHref}
        className="font-semibold text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors"
      >
        Audit trail
      </Link>
    </p>
  );
}
