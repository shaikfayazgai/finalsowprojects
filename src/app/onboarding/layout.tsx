"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";

const stepConfig = [
  { path: "/onboarding", label: "Welcome" },
  { path: "/onboarding/verify", label: "Verify Identity" },
  { path: "/onboarding/consent", label: "Agreements" },
  { path: "/onboarding/skills", label: "Skills" },
  { path: "/onboarding/evidence", label: "Portfolio" },
  { path: "/onboarding/availability", label: "Availability" },
  { path: "/onboarding/student", label: "Student Setup" },
  { path: "/onboarding/women", label: "Program Setup" },
  { path: "/onboarding/complete", label: "Complete" },
];

function getStepInfo(pathname: string) {
  // student and women are both step 7 (track setup)
  const normalPaths = [
    "/onboarding",
    "/onboarding/verify",
    "/onboarding/consent",
    "/onboarding/skills",
    "/onboarding/evidence",
    "/onboarding/availability",
  ];
  const trackPaths = ["/onboarding/student", "/onboarding/women"];
  const completePath = "/onboarding/complete";

  const totalSteps = 8;
  let currentIndex = normalPaths.indexOf(pathname);
  if (currentIndex === -1 && trackPaths.includes(pathname)) currentIndex = 6;
  if (pathname === completePath) currentIndex = 7;
  if (currentIndex === -1) currentIndex = 0;

  const stepEntry = stepConfig.find((s) => s.path === pathname) || stepConfig[0];
  const progress = ((currentIndex) / (totalSteps - 1)) * 100;

  return { currentIndex, totalSteps, label: stepEntry.label, progress };
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentIndex, totalSteps, label, progress } = getStepInfo(pathname);
  const isComplete = pathname === "/onboarding/complete";

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: `
          radial-gradient(ellipse 80% 50% at 80% -10%, color-mix(in srgb, var(--color-gold-200) 12%, transparent) 0%, transparent 70%),
          radial-gradient(ellipse 60% 60% at -5% 60%, color-mix(in srgb, var(--color-teal-200) 8%, transparent) 0%, transparent 60%),
          radial-gradient(ellipse 50% 40% at 50% 100%, color-mix(in srgb, var(--color-brown-200) 6%, transparent) 0%, transparent 50%),
          linear-gradient(180deg, var(--color-beige-50) 0%, #FFFFFF 40%, var(--color-gray-50) 100%)
        `,
      }}
    >
      {/* Top bar */}
      <div className="px-8 py-5 flex items-center justify-between">
        <Link href="/auth/login" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brown-400 to-brown-600 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-heading text-[15px] font-semibold text-gray-900 tracking-tight">
            Glimmora<span className="text-brown-500">Team</span>
          </span>
        </Link>

        {!isComplete && (
          <span className="text-[11px] text-gray-400 font-medium">
            {currentIndex + 1} of {totalSteps}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {!isComplete && (
        <div className="px-8">
          <div className="h-[3px] rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brown-400 to-brown-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-center mt-3 mb-1">
            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-widest">{label}</span>
          </div>
          {/* Decorative gold rule */}
          <div className="gold-rule mt-3" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-5">
        <div className="w-full max-w-xl py-10">
          {children}
        </div>
      </div>
    </div>
  );
}
