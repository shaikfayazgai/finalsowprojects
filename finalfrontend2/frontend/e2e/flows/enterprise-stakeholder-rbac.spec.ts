import { expect, test } from "@playwright/test";
import { loginAs, gotoPortal, loginWithCredentials } from "../helpers/auth";

const STAKEHOLDERS = {
  finance: {
    email: "vikram@acme.com",
    password: "acme1234",
    home: "/enterprise/billing",
    forbidden: "/enterprise/decomposition",
    sidebarVisible: ["Billing", "Rate Cards"],
    sidebarHidden: ["Decomposition", "Compliance"],
    roleBand: /Your role · Finance/i,
  },
  compliance: {
    email: "meera@acme.com",
    password: "acme1234",
    home: "/enterprise/compliance",
    forbidden: "/enterprise/billing/rate-cards",
    sidebarVisible: ["Compliance", "Audit"],
    sidebarHidden: ["Decomposition", "Rate Cards"],
    roleBand: /Your role · Legal/i,
  },
  it: {
    email: "rohit@acme.com",
    password: "acme1234",
    home: "/enterprise/settings/security",
    forbidden: "/enterprise/sow",
    sidebarVisible: ["Audit"],
    sidebarHidden: ["SOW Workspace", "Billing"],
    roleBand: /Your role · Security/i,
  },
} as const;

test.describe("Enterprise stakeholder RBAC @ui-mock", () => {
  for (const [key, cfg] of Object.entries(STAKEHOLDERS)) {
    test(`${key} lands on role home and sees scoped sidebar`, async ({ page }) => {
      await loginWithCredentials(page, {
        email: cfg.email,
        password: cfg.password,
        portalPrefix: "/enterprise/",
      });
      await page.waitForURL((u) => u.pathname === cfg.home, { timeout: 45_000 });

      const nav = page.getByRole("complementary", { name: "Enterprise navigation" });
      for (const label of cfg.sidebarVisible) {
        await expect(nav.getByRole("link", { name: label })).toBeVisible();
      }
      for (const label of cfg.sidebarHidden) {
        await expect(nav.getByRole("link", { name: label })).toHaveCount(0);
      }

      await expect(page.getByRole("link", { name: "New SOW" })).toHaveCount(0);
    });

    test(`${key} cannot stay on forbidden route`, async ({ page }) => {
      await loginWithCredentials(page, {
        email: cfg.email,
        password: cfg.password,
        portalPrefix: "/enterprise/",
      });
      await page.waitForURL((u) => u.pathname === cfg.home, { timeout: 45_000 });

      await gotoPortal(page, cfg.forbidden);
      await page.waitForURL((u) => u.pathname === cfg.home, { timeout: 15_000 });
    });
  }

  test("enterprise admin sees full nav and New SOW", async ({ page }) => {
    await loginAs(page, "enterpriseAdmin");
    await expect(page.getByRole("link", { name: "Decomposition" })).toBeVisible();
    await expect(page.getByRole("link", { name: "New SOW" })).toBeVisible();
  });
});
