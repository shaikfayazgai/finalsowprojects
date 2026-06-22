"use client";

/**
 * Onboarding · Evidence — optional public links.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Link as LinkIcon, FileText } from "lucide-react";
import { AuthShell, AuthCard, inputCls, PrimaryButton, SecondaryButton } from "@/components/auth/auth-shell";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { patchOnboardingDraft } from "@/lib/contributor/onboarding-draft";
import { nextStepPath } from "@/lib/contributor/onboarding-steps";
import { useOnboardingTrack } from "@/lib/hooks/use-onboarding-track";
import { cn } from "@/lib/utils/cn";

interface EvidenceLink {
  id: string;
  kind: "github" | "portfolio" | "behance" | "dribbble" | "linkedin" | "scholar" | "other";
  url: string;
}

const KIND_LABEL: Record<EvidenceLink["kind"], string> = {
  github: "GitHub", portfolio: "Portfolio", behance: "Behance", dribbble: "Dribbble",
  linkedin: "LinkedIn", scholar: "Google Scholar", other: "Other link",
};

export default function EvidencePage() {
  return (
    <React.Suspense fallback={null}>
      <EvidenceInner />
    </React.Suspense>
  );
}

function EvidenceInner() {
  const router = useRouter();
  const { track, steps } = useOnboardingTrack();
  const [links, setLinks] = React.useState<EvidenceLink[]>([]);
  const [skip, setSkip] = React.useState(false);

  function add(kind: EvidenceLink["kind"]) {
    setLinks((cur) => [...cur, { id: crypto.randomUUID(), kind, url: "" }]);
  }
  function update(id: string, patch: Partial<EvidenceLink>) {
    setLinks((cur) => cur.map((l) => l.id === id ? { ...l, ...patch } : l));
  }
  function remove(id: string) { setLinks((cur) => cur.filter((l) => l.id !== id)); }

  const validUrl = (u: string) => /^https?:\/\//.test(u);
  const allValid = links.every((l) => validUrl(l.url));
  const can = skip || (links.length >= 1 && allValid);

  function continueNext() {
    patchOnboardingDraft({ evidenceSkipped: skip });
    const dest = nextStepPath(track, "/onboarding/evidence");
    if (dest) router.push(dest);
  }

  return (
    <AuthShell>
      <AuthCard
        eyebrow="Onboarding"
        title="Show your work"
        subtitle="Even one strong link helps matching surface the right tasks for you. You can add more later from your profile."
      >
        <OnboardingProgress steps={steps} current="/onboarding/evidence" />

        <div className="rounded-lg border border-stroke bg-surface shadow-xs">
          <header className="px-4 py-2.5 border-b border-stroke-subtle flex items-center justify-between">
            <h2 className="font-body text-[12.5px] font-semibold text-foreground">Public links</h2>
            <span className="font-mono text-[11px] text-text-tertiary tabular-nums">{links.length} added</span>
          </header>

          <div className="px-4 py-3 flex flex-wrap gap-1.5 border-b border-stroke-subtle">
            {(Object.keys(KIND_LABEL) as EvidenceLink["kind"][]).map((k) => (
              <button key={k} type="button" onClick={() => add(k)} className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-stroke bg-surface font-body text-[11.5px] text-text-secondary hover:bg-bg-subtle transition-colors duration-fast">
                <Plus className="h-3 w-3" strokeWidth={2} aria-hidden /> {KIND_LABEL[k]}
              </button>
            ))}
          </div>

          <ul className="divide-y divide-stroke-subtle">
            {links.length === 0 && <li className="px-4 py-6 text-center font-body text-[12px] text-text-tertiary">No links yet — pick a chip above or skip this step.</li>}
            {links.map((l) => (
              <li key={l.id} className="grid grid-cols-[1fr_2fr_auto] gap-2 px-4 py-2.5 items-center">
                <span className="inline-flex items-center gap-1 font-body text-[11px] text-text-tertiary"><LinkIcon className="h-3 w-3" strokeWidth={2} aria-hidden /> {KIND_LABEL[l.kind]}</span>
                <input type="url" value={l.url} onChange={(e) => update(l.id, { url: e.target.value })} placeholder="https://…" className={cn(inputCls, l.url && !validUrl(l.url) && "border-error-border focus:ring-error-border focus:border-error-border")} />
                <button type="button" onClick={() => remove(l.id)} aria-label="Remove" className="p-1.5 rounded text-text-tertiary hover:text-error-text hover:bg-bg-subtle">
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-md border border-stroke-subtle bg-bg-subtle/60 px-3 py-2 flex items-start gap-2">
          <FileText className="h-3.5 w-3.5 text-text-tertiary mt-0.5 shrink-0" strokeWidth={2} aria-hidden />
          <p className="font-body text-[11.5px] text-text-tertiary">File uploads (CVs, work samples) come from your profile after onboarding — keep this list focused on public links.</p>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={skip} onChange={(e) => setSkip(e.target.checked)} className="h-3.5 w-3.5 rounded border-stroke text-brand focus:ring-brand" />
          <span className="font-body text-[11.5px] text-text-secondary">Skip for now and add evidence from my profile later</span>
        </label>

        <div className="grid grid-cols-2 gap-2">
          <SecondaryButton onClick={() => router.push("/onboarding/availability")}>← Back</SecondaryButton>
          <PrimaryButton onClick={continueNext} disabled={!can}>Continue →</PrimaryButton>
        </div>
      </AuthCard>
    </AuthShell>
  );
}
