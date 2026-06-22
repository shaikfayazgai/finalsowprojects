"use client";

/**
 * Client session cleanup — used on logout AND on session expiry.
 *
 * Requirement: when a mentor logs out or their session expires, send them back
 * to the login page and wipe client state (localStorage, sessionStorage, JS
 * cookies, and Cache Storage). The NextAuth session cookie itself is httpOnly,
 * so JS can't delete it — `signOut()` clears it server-side on logout, and on
 * expiry it's already invalid.
 */

import { signOut } from "next-auth/react";

/** Wipe all client-readable state. Safe to call repeatedly; never throws. */
export async function clearClientState(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.clear();
  } catch {
    /* storage may be unavailable (private mode / blocked) */
  }
  try {
    window.sessionStorage.clear();
  } catch {
    /* ignore */
  }

  // Expire every JS-readable cookie (path + host variants). httpOnly cookies
  // (the NextAuth session) are not visible here — signOut handles those.
  try {
    const expired = "=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    for (const pair of document.cookie.split(";")) {
      const name = pair.split("=")[0]?.trim();
      if (!name) continue;
      document.cookie = `${name}${expired}; path=/`;
      document.cookie = `${name}${expired}; path=/; domain=${window.location.hostname}`;
      document.cookie = `${name}${expired}; path=/; domain=.${window.location.hostname}`;
    }
  } catch {
    /* ignore */
  }

  // Drop any Cache Storage entries (service-worker / PWA caches).
  try {
    if (typeof caches !== "undefined") {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    /* ignore */
  }
}

/** The login page for whichever portal the path belongs to. */
export function loginUrlForPath(pathname: string): string {
  return pathname.startsWith("/mentor") ? "/mentor/login" : "/auth/login";
}

/**
 * Full sign-out: wipe client state, then end the NextAuth session (which clears
 * the httpOnly session cookie) and land on the portal's login page.
 */
export async function signOutAndClear(callbackUrl?: string): Promise<void> {
  const dest =
    callbackUrl ??
    loginUrlForPath(typeof window !== "undefined" ? window.location.pathname : "");
  await clearClientState();
  await signOut({ callbackUrl: dest });
}
