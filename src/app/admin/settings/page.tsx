"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  User, Mail, Shield, KeyRound,
  IndianRupee, Clock3, Save, Loader2, RefreshCw,
} from "lucide-react";
import { toast } from "@/lib/stores/toast-store";
import {
  usePlatformSettingsStore,
  type ExperienceRateTable,
} from "@/lib/stores/platform-settings-store";
import {
  getContributorPricing,
  updateContributorPricing,
  WOMEN_SLABS,
  GENERAL_SLABS,
  RATE_KEYS,
  type ContributorPricingSlab,
  type ContributorPricingStudentConfig,
} from "@/lib/api/settings";

// ── Constants ─────────────────────────────────────────────────────────────────

const RATE_FIELDS: { key: keyof ExperienceRateTable; label: string }[] = [
  { key: "exp0to1",   label: "0-1 Years"  },
  { key: "exp1to3",   label: "1-3 Years"  },
  { key: "exp3to5",   label: "3-5 Years"  },
  { key: "exp5to10",  label: "5-10 Years" },
  { key: "exp10plus", label: "10+ Years"  },
];

type SaveStatus = "idle" | "saving" | "saved";

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildSlabs(
  templates: typeof WOMEN_SLABS,
  currency: string,
  rates: ExperienceRateTable,
): ContributorPricingSlab[] {
  return templates.map((slab, idx) => ({
    ...slab,
    currency: currency.trim().toUpperCase() || "INR",
    rate: Math.max(1, Number(rates[RATE_KEYS[idx]]) || 1),
  }));
}

/** Convert a flat slab list → ExperienceRateTable, matched by minYears. */
function slabsToRateTable(slabs: ContributorPricingSlab[]): ExperienceRateTable {
  const byMin: Record<number, number> = {};
  for (const s of slabs) byMin[s.minYears] = s.rate;
  return {
    exp0to1:   String(byMin[0]  ?? 1000),
    exp1to3:   String(byMin[1]  ?? 1500),
    exp3to5:   String(byMin[3]  ?? 2000),
    exp5to10:  String(byMin[5]  ?? 2500),
    exp10plus: String(byMin[10] ?? 3000),
  };
}

const DEFAULT_RATE_TABLE: ExperienceRateTable = {
  exp0to1: "1000", exp1to3: "1500", exp3to5: "2000",
  exp5to10: "2500", exp10plus: "3000",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const { data: session } = useSession();

  // ── Store (used as initial seed & write-back target) ─────────────────────
  const studentCurrency          = usePlatformSettingsStore((s) => s.studentCurrency);
  const studentHourlyRate        = usePlatformSettingsStore((s) => s.studentHourlyRate);
  const womenWorkforceCurrency   = usePlatformSettingsStore((s) => s.womenWorkforceCurrency);
  const womenWorkforceRates      = usePlatformSettingsStore((s) => s.womenWorkforceRates);
  const generalWorkforceCurrency = usePlatformSettingsStore((s) => s.generalWorkforceCurrency);
  const generalWorkforceRates    = usePlatformSettingsStore((s) => s.generalWorkforceRates);
  const setStudentRateConfig          = usePlatformSettingsStore((s) => s.setStudentRateConfig);
  const setWomenWorkforceRateConfig   = usePlatformSettingsStore((s) => s.setWomenWorkforceRateConfig);
  const setGeneralWorkforceRateConfig = usePlatformSettingsStore((s) => s.setGeneralWorkforceRateConfig);

  // ── Page-level loading (initial fetch) ───────────────────────────────────
  const [pageLoading, setPageLoading] = useState(true);
  const [fetchError,  setFetchError]  = useState("");

  // ── Draft state (seeded from store, overwritten by API response) ─────────
  const [currencyDraft,    setCurrencyDraft]    = useState(studentCurrency);
  const [hourlyRateDraft,  setHourlyRateDraft]  = useState(studentHourlyRate);

  const [womenCurrencyDraft, setWomenCurrencyDraft] = useState(womenWorkforceCurrency);
  const [womenRateDraft,     setWomenRateDraft]     = useState<ExperienceRateTable>({
    ...DEFAULT_RATE_TABLE, ...womenWorkforceRates,
  });

  const [generalCurrencyDraft, setGeneralCurrencyDraft] = useState(generalWorkforceCurrency);
  const [generalRateDraft,     setGeneralRateDraft]     = useState<ExperienceRateTable>({
    ...DEFAULT_RATE_TABLE, ...generalWorkforceRates,
  });

  // ── Save button states ───────────────────────────────────────────────────
  const [saveStatus,        setSaveStatus]        = useState<SaveStatus>("idle");
  const [womenSaveStatus,   setWomenSaveStatus]   = useState<SaveStatus>("idle");
  const [generalSaveStatus, setGeneralSaveStatus] = useState<SaveStatus>("idle");

  // ── Profile info from session ────────────────────────────────────────────
  const name     = session?.user?.name ?? "—";
  const email    = session?.user?.email ?? "—";
  const role     = (session?.user as { role?: string })?.role ?? "—";
  const provider = (session?.user as { provider?: string })?.provider ?? "credentials";
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  // ── Fetch current config from backend on mount ───────────────────────────
  async function fetchConfig() {
    setPageLoading(true);
    setFetchError("");
    try {
      const res = await getContributorPricing();
      const { student, workforceSlabs } = res.data;

      // Split slabs by id prefix
      const wwSlabs = workforceSlabs.filter((s) => s.id.startsWith("ww-"));
      const gwSlabs = workforceSlabs.filter((s) => s.id.startsWith("gw-"));
      const wSlabs  = wwSlabs.length > 0 ? wwSlabs : workforceSlabs;
      const gSlabs  = gwSlabs.length > 0 ? gwSlabs : workforceSlabs;

      const womenCur   = wSlabs[0]?.currency ?? "INR";
      const generalCur = gSlabs[0]?.currency ?? "INR";
      const womenRates   = slabsToRateTable(wSlabs);
      const generalRates = slabsToRateTable(gSlabs);

      // Seed drafts
      setCurrencyDraft(student.currency || "INR");
      setHourlyRateDraft(String(student.hourlyRate ?? 1000));
      setWomenCurrencyDraft(womenCur);
      setWomenRateDraft(womenRates);
      setGeneralCurrencyDraft(generalCur);
      setGeneralRateDraft(generalRates);

      // Keep the Zustand store in sync
      setStudentRateConfig(student.currency || "INR", String(student.hourlyRate ?? 1000));
      setWomenWorkforceRateConfig(womenCur, womenRates);
      setGeneralWorkforceRateConfig(generalCur, generalRates);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load pricing config.";
      setFetchError(msg);
      // Drafts remain seeded from the Zustand store — no data is lost
    } finally {
      setPageLoading(false);
    }
  }

  useEffect(() => { fetchConfig(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Dirty checks ─────────────────────────────────────────────────────────
  const hasPricingChanges = useMemo(
    () =>
      currencyDraft.trim().toUpperCase() !== studentCurrency ||
      hourlyRateDraft.trim() !== studentHourlyRate,
    [currencyDraft, hourlyRateDraft, studentCurrency, studentHourlyRate],
  );

  const hasWomenPricingChanges = useMemo(
    () =>
      womenCurrencyDraft.trim().toUpperCase() !== womenWorkforceCurrency ||
      RATE_FIELDS.some(({ key }) => (womenRateDraft[key] ?? "").trim() !== (womenWorkforceRates[key] ?? "")),
    [womenCurrencyDraft, womenRateDraft, womenWorkforceCurrency, womenWorkforceRates],
  );

  const hasGeneralPricingChanges = useMemo(
    () =>
      generalCurrencyDraft.trim().toUpperCase() !== generalWorkforceCurrency ||
      RATE_FIELDS.some(({ key }) => (generalRateDraft[key] ?? "").trim() !== (generalWorkforceRates[key] ?? "")),
    [generalCurrencyDraft, generalRateDraft, generalWorkforceCurrency, generalWorkforceRates],
  );

  // ── Payload builder ───────────────────────────────────────────────────────
  function buildPayload(
    overrideStudent?: ContributorPricingStudentConfig,
    overrideWomen?: { currency: string; rates: ExperienceRateTable },
    overrideGeneral?: { currency: string; rates: ExperienceRateTable },
  ) {
    const studentCur  = (overrideStudent?.currency  ?? currencyDraft).trim().toUpperCase() || "INR";
    const studentRate = overrideStudent?.hourlyRate  ?? (Number(hourlyRateDraft.trim()) || 1000);

    const womenCur   = (overrideWomen?.currency   ?? womenCurrencyDraft).trim().toUpperCase()   || "INR";
    const womenRates = overrideWomen?.rates   ?? womenRateDraft;

    const generalCur   = (overrideGeneral?.currency  ?? generalCurrencyDraft).trim().toUpperCase() || "INR";
    const generalRates = overrideGeneral?.rates ?? generalRateDraft;

    return {
      student: { currency: studentCur, hourlyRate: studentRate },
      workforceSlabs: [
        ...buildSlabs(WOMEN_SLABS,   womenCur,   womenRates),
        ...buildSlabs(GENERAL_SLABS, generalCur, generalRates),
      ],
    };
  }

  // ── Save handlers ─────────────────────────────────────────────────────────
  async function savePricing() {
    const cleanedCurrency   = currencyDraft.trim().toUpperCase() || "INR";
    const cleanedHourlyRate = hourlyRateDraft.trim() || "1000";

    setSaveStatus("saving");
    try {
      await updateContributorPricing(
        buildPayload({ currency: cleanedCurrency, hourlyRate: Number(cleanedHourlyRate) }),
      );
      setStudentRateConfig(cleanedCurrency, cleanedHourlyRate);
      setCurrencyDraft(cleanedCurrency);
      setHourlyRateDraft(cleanedHourlyRate);
      setSaveStatus("saved");
      toast.success("Student pricing updated", "Pricing saved successfully.");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      setSaveStatus("idle");
      toast.error("Save failed", err instanceof Error ? err.message : "Failed to save pricing.");
    }
  }

  async function saveWomenPricing() {
    const cleanedCurrency = womenCurrencyDraft.trim().toUpperCase() || "INR";
    const cleanedRates: ExperienceRateTable = {
      exp0to1:   womenRateDraft.exp0to1.trim()   || "1000",
      exp1to3:   womenRateDraft.exp1to3.trim()   || "1500",
      exp3to5:   womenRateDraft.exp3to5.trim()   || "2000",
      exp5to10:  womenRateDraft.exp5to10.trim()  || "2500",
      exp10plus: womenRateDraft.exp10plus.trim() || "3000",
    };

    setWomenSaveStatus("saving");
    try {
      await updateContributorPricing(
        buildPayload(undefined, { currency: cleanedCurrency, rates: cleanedRates }),
      );
      setWomenWorkforceRateConfig(cleanedCurrency, cleanedRates);
      setWomenCurrencyDraft(cleanedCurrency);
      setWomenRateDraft(cleanedRates);
      setWomenSaveStatus("saved");
      toast.success("Women workforce pricing updated", "Pricing saved successfully.");
      setTimeout(() => setWomenSaveStatus("idle"), 2000);
    } catch (err) {
      setWomenSaveStatus("idle");
      toast.error("Save failed", err instanceof Error ? err.message : "Failed to save pricing.");
    }
  }

  async function saveGeneralPricing() {
    const cleanedCurrency = generalCurrencyDraft.trim().toUpperCase() || "INR";
    const cleanedRates: ExperienceRateTable = {
      exp0to1:   generalRateDraft.exp0to1.trim()   || "1000",
      exp1to3:   generalRateDraft.exp1to3.trim()   || "1500",
      exp3to5:   generalRateDraft.exp3to5.trim()   || "2000",
      exp5to10:  generalRateDraft.exp5to10.trim()  || "2500",
      exp10plus: generalRateDraft.exp10plus.trim() || "3000",
    };

    setGeneralSaveStatus("saving");
    try {
      await updateContributorPricing(
        buildPayload(undefined, undefined, { currency: cleanedCurrency, rates: cleanedRates }),
      );
      setGeneralWorkforceRateConfig(cleanedCurrency, cleanedRates);
      setGeneralCurrencyDraft(cleanedCurrency);
      setGeneralRateDraft(cleanedRates);
      setGeneralSaveStatus("saved");
      toast.success("General workforce pricing updated", "Pricing saved successfully.");
      setTimeout(() => setGeneralSaveStatus("idle"), 2000);
    } catch (err) {
      setGeneralSaveStatus("idle");
      toast.error("Save failed", err instanceof Error ? err.message : "Failed to save pricing.");
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-brown-950">Settings</h1>
        <p className="text-sm text-beige-600 mt-1">Account details and preferences</p>
      </div>

      {/* Profile card */}
      <div className="rounded-2xl bg-white border border-beige-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-beige-100">
          <h2 className="font-heading font-semibold text-brown-950">Profile</h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0"
              style={{ background: "linear-gradient(135deg, #A67763, #D0B060)" }}
            >
              {initials}
            </div>
            <div>
              <p className="text-lg font-semibold text-brown-950">{name}</p>
              <p className="text-sm text-beige-500">{email}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailRow icon={User}     label="Full Name"      value={name} />
            <DetailRow icon={Mail}     label="Email"          value={email} />
            <DetailRow icon={Shield}   label="Role"           value={role.charAt(0).toUpperCase() + role.slice(1)} />
            <DetailRow
              icon={KeyRound}
              label="Auth Provider"
              value={provider === "credentials" ? "Email / Password" : provider.charAt(0).toUpperCase() + provider.slice(1)}
            />
          </div>
        </div>
      </div>

      {/* Fetch error banner */}
      {fetchError && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start justify-between gap-3">
          <p className="text-sm text-red-700">{fetchError}</p>
          <button
            type="button"
            onClick={fetchConfig}
            className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-800 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Student pricing */}
      <PricingCard
        title="Student Pricing Controls"
        description="Configure the default student currency and hourly rate shown in onboarding."
        loading={pageLoading}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-beige-500">
              Student Currency
            </label>
            <div className="relative">
              <IndianRupee className="w-4 h-4 text-beige-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={currencyDraft}
                onChange={(e) => setCurrencyDraft(e.target.value)}
                placeholder="INR"
                maxLength={4}
                className="h-10 w-full rounded-xl border border-beige-200 bg-white pl-9 pr-3 text-sm text-brown-950 focus:outline-none focus:ring-2 focus:ring-brown-200"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-beige-500">
              Student Hourly Rate
            </label>
            <div className="relative">
              <Clock3 className="w-4 h-4 text-beige-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min={1}
                step={1}
                value={hourlyRateDraft}
                onChange={(e) => setHourlyRateDraft(e.target.value)}
                placeholder="1000"
                className="h-10 w-full rounded-xl border border-beige-200 bg-white pl-9 pr-16 text-sm text-brown-950 focus:outline-none focus:ring-2 focus:ring-brown-200"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-beige-400">/hr</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-beige-500">
            Default values are INR and 1000. Changes are available immediately in contributor onboarding.
          </p>
          <SaveButton
            status={saveStatus}
            disabled={!hasPricingChanges || saveStatus === "saving" || pageLoading}
            onClick={savePricing}
          />
        </div>
      </PricingCard>

      {/* Women workforce pricing */}
      <PricingCard
        title="Women Workforce Pricing Controls"
        description="Configure women workforce rates by experience slab."
        loading={pageLoading}
      >
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-beige-500">Currency</label>
          <div className="relative max-w-sm">
            <IndianRupee className="w-4 h-4 text-beige-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={womenCurrencyDraft}
              onChange={(e) => setWomenCurrencyDraft(e.target.value)}
              placeholder="INR"
              maxLength={4}
              className="h-10 w-full rounded-xl border border-beige-200 bg-white pl-9 pr-3 text-sm text-brown-950 focus:outline-none focus:ring-2 focus:ring-brown-200"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {RATE_FIELDS.map(({ key, label }) => (
            <div key={key} className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-beige-500">{label}</label>
              <div className="relative">
                <Clock3 className="w-4 h-4 text-beige-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={womenRateDraft[key]}
                  onChange={(e) => setWomenRateDraft((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-beige-200 bg-white pl-9 pr-16 text-sm text-brown-950 focus:outline-none focus:ring-2 focus:ring-brown-200"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-beige-400">/hr</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <SaveButton
            status={womenSaveStatus}
            disabled={!hasWomenPricingChanges || womenSaveStatus === "saving" || pageLoading}
            onClick={saveWomenPricing}
          />
        </div>
      </PricingCard>

      {/* General workforce pricing */}
      <PricingCard
        title="General Workforce Pricing Controls"
        description="Configure general workforce rates by experience slab."
        loading={pageLoading}
      >
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-beige-500">Currency</label>
          <div className="relative max-w-sm">
            <IndianRupee className="w-4 h-4 text-beige-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={generalCurrencyDraft}
              onChange={(e) => setGeneralCurrencyDraft(e.target.value)}
              placeholder="INR"
              maxLength={4}
              className="h-10 w-full rounded-xl border border-beige-200 bg-white pl-9 pr-3 text-sm text-brown-950 focus:outline-none focus:ring-2 focus:ring-brown-200"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {RATE_FIELDS.map(({ key, label }) => (
            <div key={key} className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-beige-500">{label}</label>
              <div className="relative">
                <Clock3 className="w-4 h-4 text-beige-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={generalRateDraft[key]}
                  onChange={(e) => setGeneralRateDraft((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-beige-200 bg-white pl-9 pr-16 text-sm text-brown-950 focus:outline-none focus:ring-2 focus:ring-brown-200"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-beige-400">/hr</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <SaveButton
            status={generalSaveStatus}
            disabled={!hasGeneralPricingChanges || generalSaveStatus === "saving" || pageLoading}
            onClick={saveGeneralPricing}
          />
        </div>
      </PricingCard>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PricingCard({
  title,
  description,
  loading,
  children,
}: {
  title: string;
  description: string;
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white border border-beige-100 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-beige-100 flex items-center justify-between">
        <div>
          <h2 className="font-heading font-semibold text-brown-950">{title}</h2>
          <p className="text-xs text-beige-500 mt-1">{description}</p>
        </div>
        {loading && <Loader2 className="w-4 h-4 text-beige-400 animate-spin shrink-0" />}
      </div>
      <div className={`p-6 space-y-5 transition-opacity duration-300 ${loading ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
        {children}
      </div>
    </div>
  );
}

function SaveButton({
  status,
  disabled,
  onClick,
}: {
  status: SaveStatus;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="h-9 px-4 rounded-xl bg-brown-950 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brown-800 transition-colors inline-flex items-center gap-2 shrink-0"
    >
      {status === "saving" ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Save className="w-3.5 h-3.5" />
      )}
      {status === "saved" ? "Saved" : status === "saving" ? "Saving…" : "Save"}
    </button>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-beige-50/50">
      <Icon className="w-4 h-4 text-beige-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-beige-500 font-medium">{label}</p>
        <p className="text-sm text-brown-950 font-medium mt-0.5">{value}</p>
      </div>
    </div>
  );
}
