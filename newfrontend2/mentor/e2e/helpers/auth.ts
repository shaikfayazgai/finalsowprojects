import { expect, type Page } from "@playwright/test";

/** Dev seed users — see frontend/scripts/ensure-*.ts */
export const USERS = {
  admin: { email: "admin@glimmora.ai", password: "admin1234", portalPrefix: "/admin/" },
  /** Acme sponsor — creates/submits SOWs, cannot final sign-off own SOWs. */
  enterprise: { email: "sandeep@acme.com", password: "acme1234", portalPrefix: "/enterprise/" },
  /** Acme enterprise admin — final sign-off (not SOW owner). */
  enterpriseAdmin: {
    email: "anjali@acme.com",
    password: "acme1234",
    portalPrefix: "/enterprise/",
  },
  /** Acme PMO — decomposition & projects; no SOW submit or final sign-off. */
  enterprisePmo: {
    email: "rahul@acme.com",
    password: "acme1234",
    portalPrefix: "/enterprise/",
  },
  entReviewer: {
    email: "karthik@acme.com",
    password: "acme1234",
    portalPrefix: "/enterprise/reviewer",
  },
  contributor: { email: "priya@glimmora.dev", password: "contrib1234", portalPrefix: "/contributor/" },
  mentorLead: { email: "priya@glimmora.team", password: "mentor1234", portalPrefix: "/mentor/" },
  mentorBase: { email: "amelia@glimmora.team", password: "mentor1234", portalPrefix: "/mentor/" },
} as const;

export type SeedUser = keyof typeof USERS;

export async function loginWithCredentials(
  page: Page,
  credentials: { email: string; password: string; portalPrefix: string },
) {
  const { email, password, portalPrefix } = credentials;
  await page.context().clearCookies();
  let loggedIn = false;
  for (let loginAttempt = 0; loginAttempt < 3 && !loggedIn; loginAttempt += 1) {
    await page.goto("/auth/login", { waitUntil: "load" });
    const loginForm = page.locator("form").filter({
      has: page.locator("input#login-email >> visible=true"),
    });
    const emailField = loginForm.locator("input#login-email >> visible=true");
    const passwordField = loginForm.locator("input#login-password >> visible=true");
    const btn = loginForm.getByRole("button", { name: "Continue", exact: true });
    await emailField.waitFor({ state: "visible" });
    for (let fillAttempt = 0; fillAttempt < 3; fillAttempt += 1) {
      await emailField.click();
      await emailField.fill("");
      await passwordField.click();
      await passwordField.fill("");
      await emailField.fill(email);
      await passwordField.fill(password);
      await expect(emailField).toHaveValue(email);
      await expect(passwordField).toHaveValue(password);
      if (await btn.isEnabled()) break;
      await page.waitForTimeout(250);
    }
    if (!(await btn.isEnabled())) continue;
    try {
      await Promise.all([
        page.waitForURL((u) => !u.pathname.includes("/auth/login"), { timeout: 45_000 }),
        btn.click(),
      ]);
      loggedIn = true;
    } catch {
      // Retry from a fresh login page when NextAuth callback is transiently slow.
    }
  }
  if (!loggedIn) {
    throw new Error(`Login failed for ${email}: Continue button remained disabled or submit did not navigate.`);
  }
  const url = page.url();
  if (url.includes("/auth/login")) {
    throw new Error(`Login failed for ${email}`);
  }
  if (!url.includes(portalPrefix)) {
    throw new Error(`Login for ${email} expected ${portalPrefix}* but got ${url}`);
  }
  return { email, portalPrefix, url };
}

export async function loginAs(page: Page, user: SeedUser) {
  return loginWithCredentials(page, USERS[user]);
}

/** Navigate to a portal route after login. */
export async function gotoPortal(page: Page, path: string) {
  try {
    await page.goto(path, { waitUntil: "domcontentloaded", timeout: 45_000 });
    return;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const retryable =
      msg.includes("net::ERR_ABORTED") ||
      msg.includes("net::ERR_CONNECTION_REFUSED") ||
      msg.includes("net::ERR_NETWORK_CHANGED");
    if (!retryable || msg.includes("Target page, context or browser has been closed")) {
      throw error;
    }
  }

  await page.waitForTimeout(250);
  await page.goto(path, { waitUntil: "domcontentloaded", timeout: 45_000 });
}

export async function logout(page: Page) {
  await page.context().clearCookies();
  await page.goto("about:blank");
}
