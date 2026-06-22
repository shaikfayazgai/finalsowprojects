"use client";

/**
 * Meridian — EnvironmentBanner
 *
 * Renders a 4px-tall colored strip above the topbar when the current
 * environment is `production` or `preview`. Demo mode is signaled in
 * the topbar's Demo chip; development renders nothing.
 *
 * Driven by `NEXT_PUBLIC_APP_ENV`. Add to `.env`:
 *   NEXT_PUBLIC_APP_ENV=production
 *   NEXT_PUBLIC_APP_ENV=preview
 */

import * as React from "react";
import { cn } from "@/lib/utils/cn";

type EnvKind = "production" | "preview";

function readEnv(): EnvKind | null {
  const env = process.env.NEXT_PUBLIC_APP_ENV;
  if (env === "production" || env === "preview") return env;
  return null;
}

export const EnvironmentBanner: React.FC = () => {
  const env = readEnv();
  if (!env) return null;
  return (
    <div
      role="banner"
      aria-label={`Environment: ${env}`}
      className={cn(
        "sticky top-0 z-header h-1 w-full",
        env === "production"
          ? "bg-[var(--color-success-solid)]"
          : "bg-[var(--color-warning-solid)]",
      )}
      title={
        env === "production"
          ? "You are on PRODUCTION"
          : "You are on PREVIEW"
      }
    />
  );
};
