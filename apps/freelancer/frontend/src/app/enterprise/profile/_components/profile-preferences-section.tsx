"use client";

import * as React from "react";
import { Globe } from "lucide-react";
import { toast } from "@/lib/stores/toast-store";
import { cn } from "@/lib/utils/cn";

const LANGUAGES = [
  { value: "en-IN", label: "English (India)" },
  { value: "en-US", label: "English (United States)" },
  { value: "en-GB", label: "English (United Kingdom)" },
  { value: "hi-IN", label: "Hindi (India)" },
] as const;

export function ProfilePreferencesSection() {
  const [language, setLanguage] = React.useState("en-IN");

  const onSave = () => {
    const label = LANGUAGES.find((l) => l.value === language)?.label ?? language;
    toast.success("Preferences saved", `Language set to ${label}.`);
  };

  return (
    <div className="px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stroke-subtle bg-surface text-text-secondary shrink-0">
            <Globe className="h-4 w-4" strokeWidth={2} aria-hidden />
          </span>
          <div>
            <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
              Preferences
            </h2>
            <p className="mt-1 font-body text-[12.5px] text-text-secondary">
              Personal display language for this workspace
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onSave}
          className={cn(
            "inline-flex items-center h-8 px-3 rounded-md shrink-0",
            "bg-brand text-on-brand font-body text-[12px] font-semibold",
            "hover:bg-brand-hover transition-colors duration-fast",
          )}
        >
          Save
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 min-h-[52px] border border-stroke-subtle rounded-lg">
        <div>
          <p className="font-body text-[13px] font-medium text-foreground">Language</p>
          <p className="mt-0.5 font-body text-[11.5px] text-text-secondary">
            Applies to notifications and UI copy in your session
          </p>
        </div>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className={cn(
            "h-8 px-2.5 rounded-md border border-stroke bg-surface shrink-0",
            "font-body text-[12px] text-foreground",
            "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
          )}
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
