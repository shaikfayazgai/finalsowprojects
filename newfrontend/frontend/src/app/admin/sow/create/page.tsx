"use client";

/**
 * Platform admin — Raise a SOW on behalf of a tenant.
 * One step: pick the tenant + enter SOW details (budget, scope, skills, file).
 * Submits to POST /api/admin/sow/create → /api/v1/sow/admin/create (enterprise
 * backend, admin-only) which owns the SOW by the tenant and enters the pipeline.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { Button, Input, Textarea, Label } from "@/components/ui";
import { useAdminTenants } from "@/lib/hooks/use-admin-tenants";
import { useAdminSectionGuard } from "@/lib/hooks/use-admin-section-guard";
import { toast } from "@/lib/stores/toast-store";

const SELECT_CLS =
  "flex h-10 w-full rounded-md border border-stroke-subtle bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus";

const PRIORITY = [
  { v: "low", l: "Low" },
  { v: "medium", l: "Medium" },
  { v: "high", l: "High" },
  { v: "urgent", l: "Urgent" },
];
const ENGAGEMENT = [
  { v: "fixed", l: "Fixed price" },
  { v: "hourly", l: "Hourly" },
];
const CURRENCY = [
  { v: "INR", l: "₹ INR" },
  { v: "USD", l: "$ USD" },
];
const CONFIDENTIALITY = [
  { v: "internal", l: "Internal" },
  { v: "confidential", l: "Confidential" },
  { v: "restricted", l: "Restricted" },
];

export default function AdminCreateSowPage() {
  const allowed = useAdminSectionGuard("commercialGate");
  const router = useRouter();
  const { tenants, loading: tenantsLoading } = useAdminTenants();

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [tenantId, setTenantId] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [clientOrg, setClientOrg] = React.useState("");
  const [confidentiality, setConfidentiality] = React.useState("internal");
  const [priority, setPriority] = React.useState("medium");
  const [engagementType, setEngagementType] = React.useState("fixed");
  const [budgetAmount, setBudgetAmount] = React.useState("");
  const [budgetCurrency, setBudgetCurrency] = React.useState("INR");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [effortHours, setEffortHours] = React.useState("");
  const [durationWeeks, setDurationWeeks] = React.useState("");
  const [skills, setSkills] = React.useState("");
  const [objectives, setObjectives] = React.useState("");
  const [deliverables, setDeliverables] = React.useState("");
  const [acceptanceCriteria, setAcceptanceCriteria] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [fileError, setFileError] = React.useState<string | null>(null);

  const onPickFile = (f: File | null) => {
    setFileError(null);
    if (f && f.size > 20 * 1024 * 1024) {
      setFileError("File exceeds 20 MB.");
      return;
    }
    setFile(f);
  };

  const submit = async () => {
    setError(null);
    if (!tenantId) {
      setError("Select the tenant this SOW is for.");
      return;
    }
    if (!title.trim()) {
      setError("A SOW title is required.");
      return;
    }
    if (startDate && endDate && endDate < startDate) {
      setError("End date can't be before the start date.");
      return;
    }
    setSubmitting(true);
    try {
      // Attach a document to Blob first, if provided.
      let fileInfo: { fileName?: string; fileUrl?: string; fileSize?: number } = {};
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        const up = await fetch("/api/sow/upload-file", { method: "POST", body: fd });
        if (!up.ok) {
          setError("Couldn't upload the document. Try again or create without it.");
          setSubmitting(false);
          return;
        }
        const upData = await up.json().catch(() => ({}));
        const d = upData?.data ?? upData;
        fileInfo = { fileName: d.fileName, fileUrl: d.fileUrl, fileSize: d.fileSize };
      }
      const payload = {
        ...fileInfo,
        tenantId,
        title: title.trim(),
        clientOrganisation: clientOrg.trim() || undefined,
        confidentiality,
        priority,
        engagementType,
        budgetAmount: budgetAmount ? Number(budgetAmount) : undefined,
        budgetCurrency,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        effortHours: effortHours ? Number(effortHours) : undefined,
        durationWeeks: durationWeeks ? Number(durationWeeks) : undefined,
        requiredSkills: skills.split(",").map((s) => s.trim()).filter(Boolean),
        objectives: objectives.trim() || undefined,
        deliverables: deliverables.split("\n").map((s) => s.trim()).filter(Boolean),
        acceptanceCriteria: acceptanceCriteria.trim() || undefined,
        pricing: {
          enterpriseProposed: budgetAmount ? Number(budgetAmount) : undefined,
          currency: budgetCurrency,
          mode: "manual",
        },
      };
      const res = await fetch("/api/admin/sow/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail || err?.message || `Create failed (${res.status})`);
      }
      const data = await res.json().catch(() => ({}));
      const sow = data?.data ?? data?.sow ?? data;
      const id = sow?.id;
      const tName = tenants?.find((t) => t.id === tenantId)?.name ?? "tenant";
      toast.success("SOW raised", `Created for ${tName} — enterprise gates run next.`);
      router.push(id ? `/admin/sow/${id}` : "/admin/sow");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the SOW.");
      setSubmitting(false);
    }
  };

  if (!allowed) return null;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <header className="flex items-center gap-3">
        <Link
          href="/admin/sow"
          className="grid h-9 w-9 place-items-center rounded-lg border border-stroke-subtle text-text-secondary hover:bg-surface-hover"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Raise a SOW</h1>
          <p className="text-sm text-text-secondary">Create a SOW on behalf of a tenant — it enters their approval pipeline.</p>
        </div>
      </header>

      {error ? (
        <p className="rounded-md border border-error-border bg-error-subtle px-3 py-2 text-sm text-error-text">{error}</p>
      ) : null}

      <div className="rounded-2xl border border-stroke-subtle bg-surface p-5 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="tenant">Tenant *</Label>
          {tenantsLoading ? (
            <p className="text-sm text-text-secondary">Loading tenants…</p>
          ) : (
            <select id="tenant" className={SELECT_CLS} value={tenantId} onChange={(e) => setTenantId(e.target.value)}>
              <option value="">— Select a tenant —</option>
              {(tenants ?? []).map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
              ))}
            </select>
          )}
          <p className="text-xs text-text-tertiary">The SOW is owned by this tenant&apos;s enterprise admin and appears in their workspace.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="title">SOW title *</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Analytics warehouse migration" maxLength={200} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="client">Client / business unit</Label>
          <Input id="client" value={clientOrg} onChange={(e) => setClientOrg(e.target.value)} placeholder="Optional" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="confid">Confidentiality</Label>
            <select id="confid" className={SELECT_CLS} value={confidentiality} onChange={(e) => setConfidentiality(e.target.value)}>
              {CONFIDENTIALITY.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prio">Priority</Label>
            <select id="prio" className={SELECT_CLS} value={priority} onChange={(e) => setPriority(e.target.value)}>
              {PRIORITY.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="eng">Engagement</Label>
            <select id="eng" className={SELECT_CLS} value={engagementType} onChange={(e) => setEngagementType(e.target.value)}>
              {ENGAGEMENT.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="budget">Budget</Label>
            <Input id="budget" type="number" min="0" value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} placeholder="0" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cur">Currency</Label>
            <select id="cur" className={SELECT_CLS} value={budgetCurrency} onChange={(e) => setBudgetCurrency(e.target.value)}>
              {CURRENCY.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="effort">Est. effort (hrs)</Label>
            <Input id="effort" type="number" min="0" value={effortHours} onChange={(e) => setEffortHours(e.target.value)} placeholder="0" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="start">Start date</Label>
            <Input id="start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="end">End date</Label>
            <Input id="end" type="date" value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dur">Duration (weeks)</Label>
            <Input id="dur" type="number" min="0" value={durationWeeks} onChange={(e) => setDurationWeeks(e.target.value)} placeholder="0" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="skills">Required skills <span className="text-text-tertiary">(comma-separated)</span></Label>
          <Input id="skills" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, Node.js, Postgres" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="obj">Objectives / scope</Label>
          <Textarea id="obj" rows={3} value={objectives} onChange={(e) => setObjectives(e.target.value)} placeholder="What this SOW must achieve." />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="deliv">Deliverables <span className="text-text-tertiary">(one per line)</span></Label>
          <Textarea id="deliv" rows={3} value={deliverables} onChange={(e) => setDeliverables(e.target.value)} placeholder={"Migration runbook\nValidated data pipeline"} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="accept">Acceptance criteria</Label>
          <Textarea id="accept" rows={3} value={acceptanceCriteria} onChange={(e) => setAcceptanceCriteria(e.target.value)} placeholder="How completion will be judged." />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="doc">SOW document <span className="text-text-tertiary">(optional, PDF/DOC ≤ 20 MB)</span></Label>
          <input
            id="doc"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-text-secondary file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-2 file:text-sm file:font-semibold file:text-on-brand hover:file:opacity-90 file:cursor-pointer"
          />
          {file ? (
            <p className="text-xs text-text-secondary">
              Attached: <span className="font-medium text-foreground">{file.name}</span> ({Math.round(file.size / 1024)} KB)
            </p>
          ) : null}
          {fileError ? <p className="text-xs text-error-text">{fileError}</p> : null}
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={submit} disabled={submitting} className="gap-2">
            <Send className="h-4 w-4" /> {submitting ? "Raising…" : "Raise SOW"}
          </Button>
        </div>
      </div>
    </div>
  );
}
