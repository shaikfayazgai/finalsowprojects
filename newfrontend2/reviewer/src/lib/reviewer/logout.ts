"use client";

/**
 * Reviewer sign-out / session teardown.
 *
 * Used on an explicit logout AND when the session expires. Clears all
 * client-side state so nothing leaks into the next session:
 *   - localStorage + sessionStorage
 *   - the Cache Storage API (any cached responses)
 *   - non-HttpOnly cookies (best-effort; the NextAuth session cookie is
 *     HttpOnly and is cleared by signOut on the server)
 * then ends the NextAuth session and lands on /reviewer/login.
 */

import { signOut } from "next-auth/react";

const REVIEWER_LOGIN = "/reviewer/login";

function clearWebStorage(): void {
  try {
    localStorage.clear();
  } catch {
    /* storage may be unavailable (private mode / SSR) */
  }
  try {
    sessionStorage.clear();
  } catch {
    /* ignore */
  }
}

async function clearCacheStorage(): Promise<void> {
  try {
    if (typeof caches !== "undefined") {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    /* Cache API unavailable — ignore */
  }
}

function clearClientCookies(): void {
  try {
    const cookies = document.cookie ? document.cookie.split(";") : [];
    for (const cookie of cookies) {
      const name = cookie.split("=")[0]?.trim();
      if (!name) continue;
      // Expire on the current path and root so it's removed regardless of where it was set.
      document.cookie = `${name}=; Max-Age=0; path=/`;
      document.cookie = `${name}=; Max-Age=0; path=${window.location.pathname}`;
    }
  } catch {
    /* HttpOnly cookies aren't visible here; signOut clears the session cookie server-side */
  }
}

/**
 * Tear down the reviewer session and return to the login page.
 * @param returnTo optional path to land on after the next sign-in.
 */
export async function reviewerLogout(returnTo?: string): Promise<void> {
  clearWebStorage();
  await clearCacheStorage();
  clearClientCookies();

  const callbackUrl =
    returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")
      ? `${REVIEWER_LOGIN}?returnTo=${encodeURIComponent(returnTo)}`
      : REVIEWER_LOGIN;

  // signOut clears the HttpOnly NextAuth session cookie on the server, then we
  // hard-navigate so no stale in-memory React/query state survives.
  try {
    await signOut({ redirect: false });
  } catch {
    /* even if signOut fails, still leave the portal */
  }
  window.location.assign(callbackUrl);
}
