"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

interface UseNavigationGuardOptions {
  isActive: boolean;
  allowedPathPrefixes?: string[];
}

interface NavigationGuardResult {
  showModal: boolean;
  pendingUrl: string | null;
  /** Navigate to the pending URL (data stays in storage) */
  onConfirmLeave: () => void;
  /** Close modal and stay on the current page */
  onStay: () => void;
}

export function useNavigationGuard({
  isActive,
  allowedPathPrefixes = [],
}: UseNavigationGuardOptions): NavigationGuardResult {
  const router = useRouter();

  const [showModal, setShowModal] = React.useState(false);
  const [pendingUrl, setPendingUrl] = React.useState<string | null>(null);

  // Keep refs so event listeners always see the latest values without re-registering
  const isActiveRef = React.useRef(isActive);
  React.useEffect(() => { isActiveRef.current = isActive; }, [isActive]);

  const allowedRef = React.useRef(allowedPathPrefixes);
  React.useEffect(() => { allowedRef.current = allowedPathPrefixes; }, [allowedPathPrefixes]);

  // Check whether a given href should be blocked
  const shouldBlock = (href: string): boolean => {
    if (!isActiveRef.current || !href || href === "#") return false;
    const path = href.split("?")[0].split("#")[0];
    return !allowedRef.current.some(
      (prefix) => path.startsWith(prefix) || href.startsWith(prefix),
    );
  };

  // ── Click interceptor (capture phase) ──────────────────────────────────────
  // Fires BEFORE Next.js <Link>'s bubble-phase handler so stopPropagation()
  // prevents the Link from calling router.push() at all.
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Skip external, mailto, tel, javascript links
      if (
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:") ||
        href.startsWith("http") ||
        href.startsWith("//")
      ) return;

      if (!shouldBlock(href)) return;

      e.preventDefault();
      e.stopPropagation();
      setPendingUrl(href);
      setShowModal(true);
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── router.push() interceptor ──────────────────────────────────────────────
  // Handles programmatic navigation (e.g. sidebar buttons that call router.push
  // directly instead of rendering an <a> tag).
  React.useEffect(() => {
    const originalPush = router.push.bind(router);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (router as any).push = (href: string, options?: unknown) => {
        if (shouldBlock(href)) {
          setPendingUrl(href);
          setShowModal(true);
          return;
        }
        return originalPush(href, options as Parameters<typeof originalPush>[1]);
      };
    } catch {
      // Silently skip if the property is not writable (safe fallback)
    }

    return () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (router as any).push = originalPush;
      } catch { /* ignore */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // ── Browser close / refresh ────────────────────────────────────────────────
  React.useEffect(() => {
    if (!isActive) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isActive]);

  // ── Confirm leave ──────────────────────────────────────────────────────────
  const onConfirmLeave = React.useCallback(() => {
    setShowModal(false);
    const url = pendingUrl;
    setPendingUrl(null);
    if (url) {
      // Disable guard before navigating so the push isn't intercepted again
      isActiveRef.current = false;
      router.push(url);
    }
  }, [pendingUrl, router]);

  // ── Stay on page ───────────────────────────────────────────────────────────
  const onStay = React.useCallback(() => {
    setShowModal(false);
    setPendingUrl(null);
  }, []);

  return { showModal, pendingUrl, onConfirmLeave, onStay };
}
