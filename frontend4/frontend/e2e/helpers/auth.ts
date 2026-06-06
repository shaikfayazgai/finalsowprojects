import { expect, type Page } from "@playwright/test";

/**
 * Real backend dev accounts (FastAPI auth-service seed + seed_test_accounts.py).
 * Each role signs in at its OWN per-portal login page (the generic /auth/login
 * was removed — it now redirects to "/").
 */
export const USERS = {
  admin: { email: "superadmin@glimmora.dev", password: "glimmora123", loginPath: "/admin/login", portalPrefix: "/admin/" },
  enterprise: { email: "sfayazmr@gmail.com", password: "Fayaz@123", loginPath: "/enterprise/login", portalPrefix: "/enterprise/" },
  contributor: { email: "contributor@glimmora.dev", password: "glimmora123", loginPath: "/contributor/login", portalPrefix: "/contributor/" },
  mentorLead: { email: "mentor@glimmora.dev", password: "glimmora123", loginPath: "/mentor/login", portalPrefix: "/mentor/" },
  mentorBase: { email: "mentor@glimmora.dev", password: "glimmora123", loginPath: "/mentor/login", portalPrefix: "/mentor/" },
  reviewer: { email: "reviewer@glimmora.dev", password: "glimmora123", loginPath: "/reviewer/login", portalPrefix: "/enterprise/reviewer" },
} as const;

export type SeedUser = keyof typeof USERS;

export async function loginAs(page: Page, user: SeedUser) {
  const { email, password, loginPath, portalPrefix } = USERS[user];
  await page.context().clearCookies();
  await page.goto(loginPath, { waitUntil: "domcontentloaded" });
  const emailField = page.locator("#login-email");
  const passwordField = page.locator("#login-password");
  await emailField.waitFor({ state: "visible" });
  // Give React a moment to hydrate + attach onChange handlers before typing —
  // otherwise the controlled-input state misses keystrokes and "Continue"
  // never enables (flaky on cold-compiled pages).
  await page.waitForTimeout(400);

  // Type key-by-key so React's controlled-input onChange fires for every char
  // (a bare .fill() can set the DOM value without React updating its state, so
  // the "Continue" button never enables). Retry until the button is enabled —
  // that's the real signal that React captured the input.
  const btnProbe = page.getByRole("button", { name: "Continue", exact: true });
  for (let attempt = 0; attempt < 3; attempt++) {
    await emailField.click({ clickCount: 3 });
    await emailField.press("Backspace");
    await emailField.pressSequentially(email, { delay: 25 });
    await passwordField.click({ clickCount: 3 });
    await passwordField.press("Backspace");
    await passwordField.pressSequentially(password, { delay: 25 });
    if (await btnProbe.isEnabled().catch(() => false)) break;
    await page.waitForTimeout(600);
  }

  const btn = page.getByRole("button", { name: "Continue", exact: true });
  await expect(btn).toBeEnabled({ timeout: 20_000 });
  await btn.click();

  // Wait to leave the login page. If we're still here after a while, the submit
  // raced ahead of NextAuth's client — re-ensure the fields and click once more
  // (only while the button is enabled, so we never hang on a disabled button).
  try {
    await page.waitForURL((u) => !u.pathname.endsWith("/login"), { timeout: 30_000 });
  } catch {
    if (page.url().endsWith("/login")) {
      await emailField.click({ clickCount: 3 });
      await emailField.pressSequentially(email, { delay: 25 });
      await passwordField.click({ clickCount: 3 });
      await passwordField.pressSequentially(password, { delay: 25 });
      if (await btn.isEnabled().catch(() => false)) {
        await btn.click();
        await page.waitForURL((u) => !u.pathname.endsWith("/login"), { timeout: 30_000 });
      }
    }
  }
  const url = page.url();
  if (url.endsWith("/login")) {
    throw new Error(`Login failed for ${email} (still on a login page: ${url})`);
  }
  // super_admin can roam every portal, so only assert portal match for scoped roles.
  if (user !== "admin" && !url.includes(portalPrefix)) {
    throw new Error(`Login for ${email} expected ${portalPrefix}* but got ${url}`);
  }
  return { email, portalPrefix, url };
}

/** Navigate to a portal route after login. */
export async function gotoPortal(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded", timeout: 45_000 });
}

export async function logout(page: Page) {
  await page.context().clearCookies();
}
