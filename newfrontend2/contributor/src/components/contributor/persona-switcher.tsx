"use client";

/**
 * Dev-time persona switcher — demo override only (NEXT_PUBLIC_CONTRIBUTOR_DEMO=1).
 * Production persona comes from ContributorProfile.contribType.
 */

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PERSONAS, type Persona } from "@/mocks/contributor/personas";
import { useActivePersona } from "@/lib/hooks/use-active-persona";
import { cn } from "@/lib/utils/cn";

export function PersonaSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { persona } = useActivePersona();
  const [open, setOpen] = React.useState(false);

  const setPersona = (p: Persona) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("persona", p);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    setOpen(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-popover">
      {open && (
        <div className="mb-2 rounded-lg border border-stroke bg-surface shadow-lg p-1 w-56">
          <p className="px-2 py-1.5 font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
            Mock persona
          </p>
          {PERSONAS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPersona(p.key)}
              className={cn(
                "flex items-center justify-between w-full px-2.5 py-1.5 rounded font-body text-[12.5px]",
                "transition-colors duration-fast",
                persona === p.key
                  ? "bg-brand-subtle text-foreground font-semibold"
                  : "text-text-secondary hover:bg-bg-subtle hover:text-foreground",
              )}
            >
              <span>{p.label}</span>
              {persona === p.key && (
                <span aria-hidden className="text-brand">●</span>
              )}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "inline-flex items-center gap-1.5 h-8 px-3 rounded-full shadow-xs",
          "bg-surface border border-stroke",
          "font-body text-[11.5px] font-semibold text-foreground",
          "hover:bg-surface-hover transition-colors duration-fast",
        )}
      >
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brand" />
        Persona: {PERSONAS.find((p) => p.key === persona)?.shortLabel ?? "—"}
      </button>
    </div>
  );
}
