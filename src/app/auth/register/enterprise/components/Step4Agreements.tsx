"use client";

import Link from "next/link";
import {
  AlertCircle, ArrowLeft, ArrowRight, RefreshCw,
  Shield, CheckCircle, Upload,
} from "lucide-react";
import {
  GlassCard, GlassCardContent, Button, Checkbox,
} from "@/components/ui";

const LEGAL_AGREEMENTS = [
  {
    id: "tos" as const,
    label: "Terms of Use",
    note: undefined as string | undefined,
    desc: "Governs your use of the GlimmoraTeam platform and all enterprise features.",
    link: "#",
  },
  {
    id: "pp" as const,
    label: "Privacy Policy",
    note: "GDPR / DPDP compliant",
    desc: "Explains how we collect, use, and protect personal and organisational data.",
    link: "#",
  },
  {
    id: "esa" as const,
    label: "Enterprise Service Agreement",
    note: "SLA included",
    desc: "Defines service levels, support commitments, and billing terms for enterprise accounts.",
    link: "#",
  },
  {
    id: "ahp" as const,
    label: "Anti-Harassment & Workplace Policy",
    note: undefined,
    desc: "Sets the standard for professional conduct across all tasks and team interactions.",
    link: "#",
  },
] as const;

type AgreementId = (typeof LEGAL_AGREEMENTS)[number]["id"];

interface Props {
  incorporationFile: File | null;
  setIncorporationFile: (v: File | null) => void;
  incorporationDrag: boolean;
  setIncorporationDrag: (v: boolean) => void;
  acceptTos: boolean; setAcceptTos: (v: boolean) => void;
  acceptPp: boolean; setAcceptPp: (v: boolean) => void;
  acceptEsa: boolean; setAcceptEsa: (v: boolean) => void;
  acceptAhp: boolean; setAcceptAhp: (v: boolean) => void;
  marketingOptIn: boolean; setMarketingOptIn: (v: boolean) => void;
  isLoading: boolean;
  error: string;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

export function Step4Agreements({
  incorporationFile, setIncorporationFile, incorporationDrag, setIncorporationDrag,
  acceptTos, setAcceptTos,
  acceptPp, setAcceptPp,
  acceptEsa, setAcceptEsa,
  acceptAhp, setAcceptAhp,
  marketingOptIn, setMarketingOptIn,
  isLoading, error,
  onSubmit, onBack,
}: Props) {
  const agreementState: Record<AgreementId, { checked: boolean; set: (v: boolean) => void }> = {
    tos: { checked: acceptTos, set: setAcceptTos },
    pp:  { checked: acceptPp, set: setAcceptPp },
    esa: { checked: acceptEsa, set: setAcceptEsa },
    ahp: { checked: acceptAhp, set: setAcceptAhp },
  };

  const allRequired = acceptTos && acceptPp && acceptEsa && acceptAhp;

  return (
    <GlassCard variant="heavy" padding="lg">
      <GlassCardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="pb-1 border-b border-beige-100">
            <p className="text-[11px] font-semibold text-beige-400 uppercase tracking-widest">Step 4 of 4</p>
            <p className="font-heading font-semibold text-brown-950 text-lg mt-0.5">Agreements & Account Creation</p>
            <p className="text-xs text-beige-500 mt-0.5">
              Upload your incorporation certificate and accept all agreements to create your enterprise account
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-md bg-beige-100 flex items-center justify-center shrink-0">
                <Upload className="w-3 h-3 text-beige-500" />
              </div>
              <p className="text-xs font-semibold text-brown-700 uppercase tracking-wide">Certification of Incorporation</p>
              <span className="text-[10px] text-beige-400 font-medium">(optional - PDF - max 10 MB)</span>
            </div>
            <label
              onDragOver={e => { e.preventDefault(); setIncorporationDrag(true); }}
              onDragLeave={() => setIncorporationDrag(false)}
              onDrop={e => {
                e.preventDefault();
                setIncorporationDrag(false);
                const file = e.dataTransfer.files[0];
                if (file && file.type === "application/pdf") setIncorporationFile(file);
              }}
              className={`flex items-center gap-3 w-full rounded-xl border-2 border-dashed px-4 py-3.5 cursor-pointer transition-all ${
                incorporationDrag
                  ? "border-brown-400 bg-brown-50"
                  : incorporationFile
                  ? "border-teal-400 bg-teal-50"
                  : "border-beige-300 hover:border-beige-400 bg-white"
              }`}
            >
              <input
                type="file"
                accept=".pdf"
                className="sr-only"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) setIncorporationFile(file);
                }}
              />
              {incorporationFile ? (
                <>
                  <CheckCircle className="w-5 h-5 text-teal-500 shrink-0" />
                  <p className="text-sm font-medium text-teal-700 flex-1 truncate">{incorporationFile.name}</p>
                  <button
                    type="button"
                    onClick={e => { e.preventDefault(); setIncorporationFile(null); }}
                    className="text-xs text-beige-400 hover:text-red-500 transition-colors shrink-0"
                  >
                    Remove
                  </button>
                </>
              ) : (
                <>
                  <div className="w-9 h-9 rounded-lg bg-beige-100 flex items-center justify-center shrink-0">
                    <Upload className="w-4 h-4 text-beige-400" />
                  </div>
                  <div>
                    <p className="text-sm text-brown-700 font-medium">
                      Drop the certificate here or <span className="text-teal-600 underline">browse files</span>
                    </p>
                    <p className="text-xs text-beige-400 mt-0.5">PDF only - Maximum 10 MB</p>
                  </div>
                </>
              )}
            </label>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-md bg-brown-100 flex items-center justify-center shrink-0">
                <Shield className="w-3 h-3 text-brown-500" />
              </div>
              <p className="text-xs font-semibold text-brown-700 uppercase tracking-wide">Legal Agreements</p>
              <span className="text-[10px] text-red-400 font-medium">All required</span>
            </div>

            <div className="rounded-xl border border-beige-200 overflow-hidden divide-y divide-beige-100">
              {LEGAL_AGREEMENTS.map(({ id, label, note, desc, link }) => {
                const { checked, set } = agreementState[id];
                return (
                  <label
                    key={id}
                    htmlFor={`ent-${id}`}
                    className={`flex items-start gap-3 px-4 py-3.5 transition-colors cursor-pointer ${
                      checked ? "bg-brown-50" : "bg-white hover:bg-beige-50"
                    }`}
                  >
                    <Checkbox
                      id={`ent-${id}`}
                      checked={checked}
                      onCheckedChange={v => set(!!v)}
                      onClick={e => e.stopPropagation()}
                      className="mt-0.5 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-brown-800">
                          I agree to the{" "}
                          <Link
                            href={link}
                            className="text-teal-600 hover:underline"
                            onClick={e => e.stopPropagation()}
                          >
                            {label}
                          </Link>
                        </span>
                        {note && (
                          <span className="text-[10px] text-beige-400 font-medium px-1.5 py-0.5 rounded-md bg-beige-100">
                            {note}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-beige-500 mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                    {checked && <CheckCircle className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />}
                  </label>
                );
              })}
            </div>
          </div>

          <label
            htmlFor="ent-mkt"
            className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
              marketingOptIn
                ? "border-teal-300 bg-teal-50"
                : "border-beige-200 hover:border-beige-300 bg-white"
            }`}
          >
            <Checkbox
              id="ent-mkt"
              checked={marketingOptIn}
              onCheckedChange={v => setMarketingOptIn(!!v)}
              onClick={e => e.stopPropagation()}
              className="mt-0.5 shrink-0"
            />
            <span className="text-sm flex-1 leading-relaxed">
              <span className={marketingOptIn ? "text-teal-800" : "text-beige-600"}>
                Send me enterprise product updates, feature announcements, and workforce intelligence reports
              </span>{" "}
              <span className="text-xs text-beige-400 font-medium">(optional)</span>
            </span>
            {marketingOptIn && <CheckCircle className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />}
          </label>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          <div className="space-y-3 pt-1">
            <Button
              type="submit"
              variant="gradient-forest"
              size="lg"
              className="w-full"
              disabled={isLoading || !allRequired}
            >
              {isLoading ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Creating Enterprise Account...</>
              ) : (
                <>Create Enterprise Account <ArrowRight className="w-4 h-4" /></>
              )}
            </Button>

            <button
              type="button"
              onClick={onBack}
              className="w-full text-sm text-beige-600 hover:text-beige-800 flex items-center justify-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          </div>
        </form>
      </GlassCardContent>
    </GlassCard>
  );
}
