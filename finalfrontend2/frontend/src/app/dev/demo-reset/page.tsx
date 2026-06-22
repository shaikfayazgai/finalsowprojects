"use client";

/**
 * Operator demo-reset utility.
 *
 * Hidden dev route — not in any sidebar. Operators paste
 * `/dev/demo-reset` into the address bar before a stakeholder demo to
 * restore the walkthrough to pristine seed state.
 *
 * What it does:
 *   1. Calls the unified task store's `reseed()` mutator — restores
 *      every task to its original seeded state (acceptance reverted,
 *      submissions reset, etc.).
 *   2. Wipes the persisted store keys from localStorage so a manual
 *      reload also restores fresh seed.
 *   3. Confirms with a success card + links into the V2 surfaces.
 *
 * No backend mutation — this is local-state only. Safe to run any
 * number of times.
 */

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useContributorTasksStore } from "@/lib/stores/contributor-tasks-store";

// Match by PREFIX so the reset survives store-key renames + covers every
// overlay. The old hardcoded list used stale names (e.g. "sow-store" — the real
// key is "gt-sow-list") and missed all the live "glimmora.mock.*"/"glimmora.demo.*"
// overlay keys, so a "reset" left essentially all demo state in place.
const PERSISTED_KEY_PREFIXES = [
  "gt-", // all Zustand persist stores (gt-sow-list, gt-auth, gt-rate-cards, …)
  "glimmora.mock.", // overlay layer (sows.v2, projects, payouts, reviews, admin.*)
  "glimmora.demo.", // cross-portal demo overlays (task-assignments, …)
  "contributor-tasks-store", // unified contributor task store (any version)
  "contributor-phone", // phone prefill
  "enterprise-sow-v3",
  "enterprise-projects-v3",
  "enterprise-decomp-v3",
  "reviewer-store-v3",
];

export default function DemoResetPage() {
  const reseed = useContributorTasksStore((s) => s.reseed);
  const [status, setStatus] = React.useState<"idle" | "running" | "done">("idle");
  const [resetAt, setResetAt] = React.useState<string | null>(null);

  const run = React.useCallback(() => {
    setStatus("running");
    // Wipe persisted store + overlay keys first so a refresh also lands on
    // fresh seed. Snapshot keys before mutating to avoid index shifting.
    try {
      const keys = Object.keys(window.localStorage);
      for (const key of keys) {
        if (PERSISTED_KEY_PREFIXES.some((p) => key.startsWith(p))) {
          try {
            window.localStorage.removeItem(key);
          } catch {
            /* ignore individual key errors */
          }
        }
      }
    } catch {
      /* ignore localStorage access errors */
    }
    // Reseed the unified task store in-place — synchronous, no network.
    reseed();
    setResetAt(new Date().toLocaleTimeString());
    setStatus("done");
  }, [reseed]);

  // Keyboard shortcut: Cmd/Ctrl+Shift+R triggers reset without clicking.
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "r") {
        e.preventDefault();
        run();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [run]);

  return (
    <div className="min-h-screen bg-beige-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-xl space-y-5">
        <section className="rounded-2xl border border-beige-200 bg-white p-6 shadow-[0_2px_22px_-8px_rgba(76,52,40,0.12)]">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl ring-4 ring-white ring-brown-200 bg-brown-50 shrink-0">
              <RotateCcw className="h-5 w-5 text-brown-800" />
            </span>
            <div className="min-w-0">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-brown-700">
                Operator utility · Demo reset
              </p>
              <h1 className="font-heading text-[20px] font-semibold text-brown-950 leading-tight mt-1">
                Restore pristine walkthrough state
              </h1>
              <p className="text-[12.5px] text-beige-700 mt-1.5 leading-relaxed">
                Clears every persisted store and reseeds the unified contributor task
                store. Use before every stakeholder demo to guarantee a clean cross-role
                propagation chain.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-beige-200 bg-beige-50/40 px-3.5 py-3 text-[11.5px] text-brown-900 leading-relaxed">
            <p className="font-semibold mb-1.5 inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-forest-700" />
              What this does:
            </p>
            <ul className="space-y-1 pl-5 list-disc text-beige-700">
              <li>Removes 16 localStorage keys for Zustand persisted stores</li>
              <li>Reseeds the unified task store with seed data + freshness pass</li>
              <li>Restores acceptance queue, mentor review queue, billing eligibility</li>
              <li>No backend mutation — local state only</li>
            </ul>
          </div>

          <button
            type="button"
            onClick={run}
            disabled={status === "running"}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brown-600 px-3 py-2.5 text-[13px] font-semibold text-white hover:bg-brown-700 disabled:bg-beige-300 disabled:cursor-not-allowed transition-colors"
          >
            {status === "running" ? (
              <>
                <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                Resetting…
              </>
            ) : (
              <>
                <RotateCcw className="h-3.5 w-3.5" />
                Reset demo state
              </>
            )}
          </button>
          <p className="text-[10.5px] text-beige-600 mt-2 text-center">
            Keyboard shortcut: <kbd className="px-1.5 py-0.5 rounded border border-beige-200 bg-beige-50 font-mono text-[10px]">⌘/Ctrl + Shift + R</kbd>
          </p>
        </section>

        {status === "done" && (
          <section className="rounded-2xl border border-forest-200 bg-forest-50/40 p-5">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl ring-2 ring-white ring-forest-200 bg-forest-50 shrink-0">
                <CheckCircle2 className="h-4 w-4 text-forest-700" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-brown-950">
                  Demo state restored
                </p>
                <p className="text-[11.5px] text-beige-700 mt-0.5">
                  Reset at {resetAt}. Cross-role propagation chain ready.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <DemoLink href="/enterprise/dashboard" label="Enterprise Dashboard" />
                  <DemoLink href="/enterprise/review" label="Acceptance Queue" />
                  <DemoLink href="/contributor/dashboard" label="Contributor Dashboard" />
                  <DemoLink href="/mentor/dashboard" label="Mentor Dashboard" />
                </div>
              </div>
            </div>
          </section>
        )}

        <p className="text-[10.5px] text-beige-600 text-center leading-relaxed">
          This route is intentionally not in any sidebar. Bookmark <span className="font-mono">/dev/demo-reset</span> on the demo browser.
        </p>
      </div>
    </div>
  );
}

function DemoLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 rounded-lg border border-beige-200 bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-brown-900 hover:border-beige-300"
    >
      {label}
      <ArrowRight className="h-3 w-3" />
    </Link>
  );
}
