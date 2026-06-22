"use client";

import * as React from "react";
import { KeyRound, Network } from "lucide-react";
import { toast } from "@/lib/stores/toast-store";
import { AuroraSelect, secondaryBtnClass, primaryBtnClass, primaryStyle } from "@/app/admin/_shell/aurora-ui";

export function SecurityWorkspacePolicySection() {
  const [sessionTimeout, setSessionTimeout] = React.useState("30");
  const [ipAllowlist, setIpAllowlist] = React.useState(false);

  // Hydrate persisted workspace-security policies on mount. GET returns {} when
  // never saved — only override a default when the key is present in the response.
  React.useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      try {
        const res = await fetch("/api/prefs/ent_security", { cache: "no-store" });
        const data = res.ok ? await res.json() : {};
        if (cancelled) return;
        if (typeof data?.sessionTimeout === "string" && data.sessionTimeout) {
          setSessionTimeout(data.sessionTimeout);
        }
        if (typeof data?.ipAllowlist === "boolean") setIpAllowlist(data.ipAllowlist);
      } catch {
        // keep defaults
      }
    }
    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSave = async () => {
    try {
      await fetch("/api/prefs/ent_security", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionTimeout, ipAllowlist }),
      });
      toast.success("Workspace security saved", "Session and network policies updated for this tenant.");
    } catch {
      toast.error("Could not save", "Workspace security policies were not saved. Try again.");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 border-b border-stroke-subtle">
        <div>
          <h2 className="font-display text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
            Security policies
          </h2>
          <p className="mt-0.5 font-body text-[12.5px] text-text-secondary">
            Tenant-wide session timeout, IP allowlist, and audit signing
          </p>
        </div>
        <button
          type="button"
          onClick={onSave}
          className={primaryBtnClass}
          style={primaryStyle}
        >
          Save policies
        </button>
      </div>

      <dl className="divide-y divide-stroke-subtle">
        <PolicyRow
          icon={<Network className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />}
          label="Session timeout"
          hint="How long members stay signed in without activity"
        >
          <AuroraSelect
            size="sm"
            value={sessionTimeout}
            onChange={(e) => setSessionTimeout(e.target.value)}
          >
            <option value="8">8 hours</option>
            <option value="24">24 hours</option>
            <option value="7">7 days</option>
            <option value="30">30 days</option>
          </AuroraSelect>
        </PolicyRow>

        <PolicyRow
          icon={<Network className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />}
          label="IP allowlist"
          hint="Restrict sign-in to approved corporate IP ranges"
        >
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={ipAllowlist}
              onChange={(e) => setIpAllowlist(e.target.checked)}
              className="h-3.5 w-3.5 accent-[var(--c-violet-500)]"
            />
            <span className="font-body text-[12px] text-foreground">
              {ipAllowlist ? "Enabled" : "Off"}
            </span>
          </label>
        </PolicyRow>

        <PolicyRow
          icon={<KeyRound className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />}
          label="Audit signing keys"
          hint="Cryptographic keys for tamper-evident audit exports"
        >
          <button
            type="button"
            onClick={() =>
              toast.info("Audit keys", "Key rotation ships with the workspace security API.")
            }
            className={secondaryBtnClass}
          >
            Manage keys
          </button>
        </PolicyRow>
      </dl>

      <p className="px-5 py-3 font-body text-[11.5px] text-text-tertiary border-t border-stroke-subtle">
        Workspace policies require admin or IT role. SSO enforcement is configured under Integrations.
      </p>
    </div>
  );
}

function PolicyRow({
  icon,
  label,
  hint,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-3 min-h-[52px] hover:bg-bg-subtle/60 transition-colors">
      <div className="flex items-start gap-2.5 min-w-0 flex-1">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-stroke-subtle bg-bg-subtle text-text-secondary shrink-0 mt-0.5">
          {icon}
        </span>
        <div>
          <dt className="font-body text-[13px] font-medium text-foreground">{label}</dt>
          <dd className="mt-0.5 font-body text-[11.5px] text-text-secondary">{hint}</dd>
        </div>
      </div>
      <div className="shrink-0 sm:pl-4">{children}</div>
    </div>
  );
}
