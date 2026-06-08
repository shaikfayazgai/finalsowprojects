"use client";

import * as React from "react";
import { Mail, User, Globe2 } from "lucide-react";
import { AVATAR_COLOR_HEX, type ProfileEditableState } from "@/types/profile";

type AvatarColor = ProfileEditableState["avatarColor"];

interface IdentityCardProps {
  displayName: string;
  setDisplayName: (v: string) => void;
  email: string;
  timezone: string;
  setTimezone: (v: string) => void;
  avatarColor: AvatarColor;
  setAvatarColor: (v: AvatarColor) => void;
}

const SWATCHES: AvatarColor[] = ["brand", "violet", "teal", "amber", "rose"];

export function IdentityCard({
  displayName,
  setDisplayName,
  email,
  timezone,
  setTimezone,
  avatarColor,
  setAvatarColor,
}: IdentityCardProps) {
  const initials =
    (displayName || "Operator")
      .split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase() || "OP";

  return (
    <section className="rounded-xl bg-surface ring-1 ring-stroke-subtle overflow-hidden">
      <header className="px-5 py-4 border-b border-stroke-subtle">
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.12em] text-text-tertiary">
          Step 1 of 1
        </p>
        <h2 className="font-body text-[15px] font-semibold text-foreground leading-tight mt-0.5">
          Confirm your identity
        </h2>
        <p className="font-body text-[12.5px] text-text-secondary mt-1 leading-snug">
          This is what shows up on your Profile and across audit logs. You can change it any time from <span className="font-semibold text-foreground">Profile → Edit profile</span>.
        </p>
      </header>

      <div className="px-5 py-5 space-y-5">
        {/* Avatar + display name */}
        <div className="flex items-start gap-4">
          <div
            className="shrink-0 w-16 h-16 rounded-full flex items-center justify-center font-body text-[20px] font-semibold text-white tabular-nums"
            style={{ backgroundColor: AVATAR_COLOR_HEX[avatarColor] }}
            aria-label="Your avatar"
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <Field label="Display name" icon={User}>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Kavi Singh"
                className={inputClass}
              />
            </Field>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.12em] text-text-tertiary">
                Avatar colour
              </p>
              <div className="flex items-center gap-1.5">
                {SWATCHES.map((c) => {
                  const active = avatarColor === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAvatarColor(c)}
                      aria-label={`Avatar colour ${c}`}
                      aria-pressed={active}
                      className={`w-6 h-6 rounded-full transition-all ${
                        active
                          ? "ring-2 ring-offset-2 ring-offset-surface"
                          : "ring-1 ring-stroke-subtle hover:scale-110"
                      }`}
                      style={{
                        backgroundColor: AVATAR_COLOR_HEX[c],
                        boxShadow: active
                          ? `0 0 0 2px ${AVATAR_COLOR_HEX[c]}`
                          : undefined,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Email + Timezone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Email" icon={Mail}>
            <div
              className={`${inputClass} flex items-center text-text-secondary bg-bg-subtle cursor-not-allowed select-none`}
              aria-readonly="true"
            >
              {email || "operator@glimmora.ai"}
            </div>
            <p className="mt-1 font-body text-[10.5px] text-text-tertiary leading-snug">
              From your sign-in. Cannot be changed here.
            </p>
          </Field>
          <Field label="Timezone" icon={Globe2}>
            <input
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="e.g. Asia/Kolkata"
              className={inputClass}
            />
            <p className="mt-1 font-body text-[10.5px] text-text-tertiary leading-snug">
              Auto-detected · used for local timestamps across surfaces.
            </p>
          </Field>
        </div>
      </div>
    </section>
  );
}

const inputClass =
  "w-full h-9 px-3 rounded-md bg-bg ring-1 ring-stroke-subtle font-body text-[13px] text-foreground placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus transition-shadow";

interface FieldProps {
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>;
  children: React.ReactNode;
}

function Field({ label, icon: Icon, children }: FieldProps) {
  return (
    <label className="block">
      <span className="inline-flex items-center gap-1.5 mb-1.5 font-body text-[10.5px] font-bold uppercase tracking-[0.12em] text-text-tertiary">
        <Icon className="w-3 h-3" strokeWidth={2} aria-hidden />
        {label}
      </span>
      {children}
    </label>
  );
}
