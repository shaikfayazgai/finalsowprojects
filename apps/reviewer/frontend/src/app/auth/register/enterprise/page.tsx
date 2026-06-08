"use client";

/**
 * Enterprise account self-register — Meridian redesign.
 * Phase 1: enterprises are admin-invited, but the public route stays
 * available for sales-led signup flows.
 */

import * as React from "react";
import Link from "next/link";
import { Building2, Mail, User as UserIcon, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { AuthShell, AuthCard, FieldLabel, inputCls, PrimaryButton } from "@/components/auth/auth-shell";
import { cn } from "@/lib/utils/cn";

export default function EnterpriseRegisterPage() {
  const [contactName, setContactName] = React.useState("");
  const [companyName, setCompanyName] = React.useState("");
  const [workEmail, setWorkEmail] = React.useState("");
  const [teamSize, setTeamSize] = React.useState("11-50");
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const canSubmit =
    contactName.trim().length >= 2 &&
    companyName.trim().length >= 2 &&
    workEmail.includes("@") &&
    !submitting;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null); setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register/enterprise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: contactName.trim(),
          companyName: companyName.trim(),
          workEmail: workEmail.trim().toLowerCase(),
          teamSize,
          notes: notes.trim(),
        }),
      });
      if (!res.ok && res.status >= 500) throw new Error();
      setSent(true);
    } catch {
      setError("Couldn't send your request. Try again, or email hello@glimmora.ai directly.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <AuthCard
        eyebrow="For enterprises"
        title={sent ? "Request received" : "Set up your enterprise tenant"}
        subtitle={sent
          ? `We'll reach out to ${workEmail} within one business day to start provisioning.`
          : "A Tenant Success Manager will reach out within one business day to set up your tenant, configure SSO, and import your team."}
        footer={
          <Link href="/auth/login" className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-brand-emphasis hover:underline underline-offset-2">
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Already have a tenant? Sign in
          </Link>
        }
      >
        {sent ? (
          <div className="rounded-md border border-success-border bg-success-subtle px-4 py-3 flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-success-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
            <p className="font-body text-[12.5px] text-success-text">Thanks — keep an eye on your inbox. Most provisioning is done within 24 hours.</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            {error && (
              <div role="alert" className="rounded-md border border-error-border bg-error-subtle px-3 py-2 flex items-start gap-2">
                <AlertCircle className="h-3.5 w-3.5 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
                <p className="font-body text-[12.5px] text-error-text flex-1">{error}</p>
              </div>
            )}
            <div>
              <FieldLabel htmlFor="contact">Your name</FieldLabel>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" strokeWidth={2} aria-hidden />
                <input id="contact" value={contactName} onChange={(e) => setContactName(e.target.value)} className={cn(inputCls, "pl-9")} placeholder="Your full name" autoComplete="name" required />
              </div>
            </div>
            <div>
              <FieldLabel htmlFor="company">Company</FieldLabel>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" strokeWidth={2} aria-hidden />
                <input id="company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={cn(inputCls, "pl-9")} placeholder="Your company name" autoComplete="organization" required />
              </div>
            </div>
            <div>
              <FieldLabel htmlFor="email">Work email</FieldLabel>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" strokeWidth={2} aria-hidden />
                <input id="email" type="email" value={workEmail} onChange={(e) => setWorkEmail(e.target.value)} className={cn(inputCls, "pl-9")} placeholder="you@company.com" autoComplete="email" required />
              </div>
            </div>
            <div>
              <FieldLabel htmlFor="size">Team size</FieldLabel>
              <select id="size" value={teamSize} onChange={(e) => setTeamSize(e.target.value)} className={inputCls}>
                <option>1-10</option><option>11-50</option><option>51-200</option><option>201-1000</option><option>1000+</option>
              </select>
            </div>
            <div>
              <FieldLabel htmlFor="notes">Anything we should know? (optional)</FieldLabel>
              <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={cn(inputCls, "h-auto py-2 resize-y")} placeholder="Use case, timeline, integrations…" />
            </div>
            <PrimaryButton type="submit" disabled={!canSubmit} loading={submitting}>Request enterprise setup</PrimaryButton>
          </form>
        )}
      </AuthCard>
    </AuthShell>
  );
}
