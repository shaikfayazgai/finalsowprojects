"use client";

/**
 * SOW intake — commercial pricing section.
 *
 * Captures the three-price model inputs the enterprise is allowed to set:
 *   - Manual mode: enterprise proposed value + Glimmora platform fee.
 *   - AI mode: AI base price + SOW processing cost + uplift.
 *
 * In both modes we compute and display ONLY the `clientPrice` (+ GST line) —
 * margin / cost basis are platform-admin scope and stay invisible here.
 *
 * Returns a SowPricing record (or null) via `onChange`. `actualCost` is left
 * at 0 at intake time; platform admin sets it during commercial review,
 * or it auto-rolls up from decomposed task pricing later.
 */

import * as React from "react";
import { Calculator, IndianRupee, Sparkles } from "lucide-react";
import {
  buildSowPricingAi,
  buildSowPricingManual,
  computeClientPriceFromAi,
  computeClientPriceFromManual,
  formatINR,
  gstOnTop,
  type PricingMode,
  type SowPricing,
} from "@/lib/pricing";
import { cn } from "@/lib/utils/cn";
import { AURORA_ACCENT } from "@/app/admin/_shell/aurora";
import { GLASS_FIELD_STYLE } from "@/app/admin/_shell/aurora-ui";

interface Props {
  value: SowPricing | null;
  onChange: (next: SowPricing | null) => void;
}

interface ManualState {
  enterpriseProposed: string;
  platformFeeAmount: string;
}

interface AiState {
  aiBasePrice: string;
  sowProcessingCost: string;
  uplift: string;
}

const initialManual: ManualState = { enterpriseProposed: "", platformFeeAmount: "" };
const initialAi: AiState = { aiBasePrice: "", sowProcessingCost: "", uplift: "" };

function toNumber(s: string): number {
  const n = Number(s.replace(/[,\s]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function PricingSection({ value, onChange }: Props) {
  const [mode, setMode] = React.useState<PricingMode>(value?.mode ?? "manual");
  const [manual, setManual] = React.useState<ManualState>(() =>
    value?.mode === "manual" && value.manual
      ? {
          enterpriseProposed: String(value.manual.enterpriseProposed || ""),
          platformFeeAmount: String(value.manual.platformFeeAmount || ""),
        }
      : initialManual,
  );
  const [ai, setAi] = React.useState<AiState>(() =>
    value?.mode === "ai" && value.ai
      ? {
          aiBasePrice: String(value.ai.aiBasePrice || ""),
          sowProcessingCost: String(value.ai.sowProcessingCost || ""),
          uplift: String(value.ai.uplift || ""),
        }
      : initialAi,
  );

  const manualInputs = React.useMemo(
    () => ({
      enterpriseProposed: toNumber(manual.enterpriseProposed),
      platformFeeAmount: toNumber(manual.platformFeeAmount),
    }),
    [manual],
  );
  const aiInputs = React.useMemo(
    () => ({
      aiBasePrice: toNumber(ai.aiBasePrice),
      sowProcessingCost: toNumber(ai.sowProcessingCost),
      uplift: toNumber(ai.uplift),
    }),
    [ai],
  );

  const clientPrice =
    mode === "manual"
      ? computeClientPriceFromManual(manualInputs)
      : computeClientPriceFromAi(aiInputs);
  const gst = gstOnTop(clientPrice);

  // Emit pricing upward whenever inputs change.
  React.useEffect(() => {
    if (clientPrice <= 0) {
      onChange(null);
      return;
    }
    const next =
      mode === "manual"
        ? buildSowPricingManual(manualInputs, 0)
        : buildSowPricingAi(aiInputs, 0);
    onChange(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, clientPrice, manualInputs.enterpriseProposed, manualInputs.platformFeeAmount, aiInputs.aiBasePrice, aiInputs.sowProcessingCost, aiInputs.uplift]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <IndianRupee className="h-3.5 w-3.5 text-brand-emphasis" strokeWidth={2} aria-hidden />
        <h3 className="font-display text-[12.5px] font-semibold text-foreground">Commercial pricing</h3>
      </div>

      <div className="inline-flex rounded-lg border border-stroke-subtle bg-bg-subtle p-1" role="tablist" aria-label="Pricing mode">
        <ModeButton
          active={mode === "manual"}
          onClick={() => setMode("manual")}
          icon={<Calculator className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />}
          label="Manual price"
          description="Enterprise proposes a value, Glimmora adds the fee."
        />
        <ModeButton
          active={mode === "ai"}
          onClick={() => setMode("ai")}
          icon={<Sparkles className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />}
          label="AI quote"
          description="Auditable components: base + SOW cost + uplift."
        />
      </div>

      {mode === "manual" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <RupeeInput
            id="pricing-enterprise-proposed"
            label="Enterprise proposed value"
            hint="What you consider fair work value (excl. fee, excl. GST)."
            value={manual.enterpriseProposed}
            onChange={(v) => setManual((m) => ({ ...m, enterpriseProposed: v }))}
          />
          <RupeeInput
            id="pricing-platform-fee"
            label="Glimmora platform fee"
            hint="Fixed-amount fee (negotiated separately or per rate card)."
            value={manual.platformFeeAmount}
            onChange={(v) => setManual((m) => ({ ...m, platformFeeAmount: v }))}
          />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <RupeeInput
            id="pricing-ai-base"
            label="AI base price"
            hint="Auto-quoted from scope + effort."
            value={ai.aiBasePrice}
            onChange={(v) => setAi((s) => ({ ...s, aiBasePrice: v }))}
          />
          <RupeeInput
            id="pricing-sow-cost"
            label="SOW processing cost"
            hint="Parsing / governance overhead."
            value={ai.sowProcessingCost}
            onChange={(v) => setAi((s) => ({ ...s, sowProcessingCost: v }))}
          />
          <RupeeInput
            id="pricing-uplift"
            label="Uplift"
            hint="Margin uplift component."
            value={ai.uplift}
            onChange={(v) => setAi((s) => ({ ...s, uplift: v }))}
          />
        </div>
      )}

      <div className="rounded-lg border border-stroke-subtle bg-bg-subtle px-3 py-2.5">
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
          Quote preview · what the platform stores
        </p>
        <dl className="grid grid-cols-3 gap-3 text-[12.5px] font-body">
          <PreviewCell label="Client price (excl. GST)" value={formatINR(clientPrice)} emphasis />
          <PreviewCell label="GST (18%)" value={formatINR(gst.gst)} />
          <PreviewCell label="Enterprise total payable" value={formatINR(gst.total)} />
        </dl>
        <p className="mt-2 font-body text-[11px] text-text-tertiary">
          You only see the client price. Glimmora margin and contributor payouts are managed separately.
        </p>
      </div>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
  description,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      title={description}
      className={cn(
        "h-8 px-3 rounded-lg font-body text-[12px] font-semibold inline-flex items-center gap-1.5 transition-colors duration-fast",
        active
          ? "text-white"
          : "text-text-secondary hover:text-foreground hover:bg-bg-subtle",
      )}
      style={active ? { backgroundImage: AURORA_ACCENT, boxShadow: "0 8px 18px -10px rgba(108,76,230,0.6)" } : undefined}
    >
      {icon}
      {label}
    </button>
  );
}

function RupeeInput({
  id,
  label,
  hint,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1"
      >
        {label}
      </label>
      <div className="relative">
        <span className="absolute inset-y-0 left-2 flex items-center font-body text-[13px] text-text-tertiary pointer-events-none">
          ₹
        </span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder="0"
          style={GLASS_FIELD_STYLE}
          className="w-full h-9 pl-6 pr-3 rounded-lg font-body text-[13px] text-foreground placeholder:text-text-disabled focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.18)]"
        />
      </div>
      <p className="mt-1 font-body text-[10.5px] text-text-tertiary">{hint}</p>
    </div>
  );
}

function PreviewCell({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div>
      <dt className="font-body text-[10.5px] text-text-tertiary mb-0.5">{label}</dt>
      <dd
        className={cn(
          "font-body tabular-nums",
          emphasis ? "text-[14px] font-semibold text-foreground" : "text-[13px] text-text-secondary",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
