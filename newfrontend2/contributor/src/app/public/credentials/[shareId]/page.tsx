"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import {
  ShieldCheck, Award, CheckCircle2, AlertCircle,
  RefreshCw, Tag, Briefcase, TrendingUp, Star,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { fetchPublicCredential, type PublicCredential } from "@/lib/api/contributor";

/* ═══ Helpers ═══ */

function Badge({ children, variant = "gray" }: { children: React.ReactNode; variant?: "green" | "teal" | "gold" | "blue" | "gray" }) {
  const styles = {
    green: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    teal:  "bg-teal-50 text-teal-700 border border-teal-200",
    gold:  "bg-amber-50 text-amber-700 border border-amber-200",
    blue:  "bg-blue-50 text-blue-700 border border-blue-200",
    gray:  "bg-gray-100 text-gray-600 border border-gray-200",
  };
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium", styles[variant])}>
      {children}
    </span>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3.5" style={{ borderBottom: "1px solid #f0ece6" }}>
      <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">{label}</div>
        <div className="text-[13px] font-medium text-gray-700">{value}</div>
      </div>
    </div>
  );
}

/* ═══ Skeleton ═══ */

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-teal-50/20 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden animate-pulse">
        <div className="h-40 bg-gradient-to-br from-gray-200 to-gray-300" />
        <div className="px-8 py-7 space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
          <div className="space-y-3 pt-4">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="flex gap-3">
                <div className="w-7 h-7 rounded-lg bg-gray-100 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-2 bg-gray-100 rounded w-16" />
                  <div className="h-3 bg-gray-200 rounded w-32" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══ PAGE ═══ */

export default function PublicCredentialPage() {
  const params = useParams();
  const shareId = params.shareId as string;

  const [credential, setCredential] = React.useState<PublicCredential | null>(null);
  const [loading, setLoading]       = React.useState(true);
  const [error, setError]           = React.useState<string | null>(null);
  const [notFound, setNotFound]     = React.useState(false);

  React.useEffect(() => {
    if (!shareId) return;
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    setNotFound(false);

    console.log(`[PublicCredential] → GET /api/public/credentials/${shareId}`);
    fetchPublicCredential(shareId)
      .then((data) => {
        if (ctrl.signal.aborted) return;
        console.log("[PublicCredential] ✓ 200 —", data);
        setCredential(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (ctrl.signal.aborted) return;
        console.error("[PublicCredential] ✗ —", err.message);
        if (err.message?.includes("404") || err.message?.toLowerCase().includes("not found")) {
          setNotFound(true);
        } else {
          setError(err.message);
        }
        setLoading(false);
      });

    return () => ctrl.abort();
  }, [shareId]);

  /* ── Loading ── */
  if (loading) return <PageSkeleton />;

  /* ── Not found ── */
  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-teal-50/20 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Award className="w-7 h-7 text-gray-300" />
          </div>
          <h2 className="text-[17px] font-semibold text-gray-800 mb-1">Link not found</h2>
          <p className="text-[12px] text-gray-400 leading-relaxed">
            This share link may have expired or the credential has been revoked.
          </p>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-teal-50/20 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-400" />
          </div>
          <h2 className="text-[17px] font-semibold text-gray-800 mb-1">Something went wrong</h2>
          <p className="text-[12px] text-gray-400 leading-relaxed mb-5">{error}</p>
          <button
            onClick={() => { setError(null); setLoading(true); fetchPublicCredential(shareId).then(setCredential).catch(e => setError(e.message)).finally(() => setLoading(false)); }}
            className="inline-flex items-center gap-2 text-[12px] font-medium text-gray-600 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Try again
          </button>
        </div>
      </div>
    );
  }

  if (!credential) return null;

  const seniorityColor =
    credential.seniority?.toLowerCase().includes("senior") ? "gold"
    : credential.seniority?.toLowerCase().includes("mid") ? "teal"
    : "gray";

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-teal-50/20 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">

          {/* Hero banner */}
          <div className="relative bg-gradient-to-br from-[#5c3d2e] via-[#7c5243] to-[#9c6b58] px-8 pt-10 pb-12">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 1px, transparent 1px), radial-gradient(circle at 20% 80%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-4 border border-white/20">
                <Award className="w-7 h-7 text-white" />
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {credential.platform_verified && (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-white/90 bg-white/15 border border-white/20 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Platform Verified
                  </span>
                )}
                {credential.seniority && (
                  <span className="inline-flex items-center text-[10px] font-semibold text-white/80 bg-white/10 border border-white/15 px-2.5 py-1 rounded-full">
                    {credential.seniority}
                  </span>
                )}
              </div>
              <h1 className="text-white text-[22px] font-bold leading-tight tracking-tight mb-1">
                Verified Credential
              </h1>
              <p className="text-white/60 text-[12px]">
                Shared via Glimmora · Share ID: <span className="font-mono">{shareId}</span>
              </p>
            </div>
          </div>

          {/* Verified strip */}
          <div className="flex items-center gap-2 px-8 py-3 bg-emerald-50 border-b border-emerald-100">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-[11px] font-medium text-emerald-700">
              This credential has been verified on the Glimmora Proof-of-Delivery system.
            </span>
          </div>

          {/* Body */}
          <div className="px-8 py-6">

            {/* Skill tags */}
            {credential.skills_evidenced?.length > 0 && (
              <div className="mb-5">
                <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Tag className="w-3 h-3" /> Skills Evidenced
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {credential.skills_evidenced.map((skill) => (
                    <Badge key={skill} variant="teal">{skill}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Info rows */}
            <div className="divide-y-0">
              <InfoRow icon={Briefcase} label="Task Type" value={credential.task_type || "—"} />
              <InfoRow icon={Star} label="Designation" value={credential.designation || "—"} />
              <InfoRow
                icon={TrendingUp}
                label="Seniority Level"
                value={
                  credential.seniority
                    ? <Badge variant={seniorityColor as "gold" | "teal" | "gray"}>{credential.seniority}</Badge>
                    : "—"
                }
              />
              <InfoRow
                icon={CheckCircle2}
                label="Quality Indicator"
                value={
                  credential.quality_indicator
                    ? <Badge variant="green">{credential.quality_indicator}</Badge>
                    : "—"
                }
              />
              <InfoRow
                icon={ShieldCheck}
                label="Platform Verified"
                value={
                  credential.platform_verified
                    ? <span className="flex items-center gap-1.5 text-emerald-600 font-semibold text-[13px]"><CheckCircle2 className="w-3.5 h-3.5" /> Yes</span>
                    : <span className="text-gray-400">No</span>
                }
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 pb-8">
            <div className="bg-gray-50 rounded-2xl px-5 py-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-[12px] font-semibold text-gray-700">Powered by Glimmora</div>
                <div className="text-[10px] text-gray-400 mt-0.5">Proof-of-Delivery credential system</div>
              </div>
              <a
                href="/"
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#7c5243] hover:text-[#5c3d2e] transition-colors"
              >
                Learn more <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-[10px] text-gray-400 mt-4 leading-relaxed px-4">
          This is a public view of a shared credential. Sensitive information such as personal details,
          PODL hashes, and certificate files are not shown.
        </p>

      </div>
    </div>
  );
}
