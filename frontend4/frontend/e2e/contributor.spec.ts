import { test, expect } from "@playwright/test";
import { expectRouteLoads } from "./helpers/routes";

test.describe("Contributor portal @ui-real", () => {
  const routes = [
    "/contributor/dashboard",
    "/contributor/tasks",
    "/contributor/tasks/submissions",
    "/contributor/tasks/completed",
    "/contributor/earnings",
    "/contributor/profile",
    "/contributor/profile/digital-twin",
    "/contributor/credentials",
    "/contributor/support",
    "/contributor/notifications",
    "/contributor/settings",
    "/contributor/settings/mentorship",
  ];

  for (const path of routes) {
    test(`loads ${path}`, async ({ page }) => {
      await expectRouteLoads(page, path);
    });
  }

  test("dashboard shows greeting or task content", async ({ page }) => {
    await expectRouteLoads(page, "/contributor/dashboard");
    const ok =
      (await page.getByText(/good (morning|afternoon|evening)/i).count()) > 0 ||
      (await page.getByText(/task|dashboard/i).count()) > 0;
    expect(ok).toBeTruthy();
  });
});

test.describe("Contributor task loop @partial", () => {
  test("tasks page loads without hard error banner", async ({ page }) => {
    await expectRouteLoads(page, "/contributor/tasks");
    const err = await page.getByText(/could not load|internal server error/i).count();
    expect(err).toBe(0);
  });
});

test.describe("Contributor onboarding @partial", () => {
  test("public onboarding consent page loads", async ({ page }) => {
    await page.goto("/onboarding/consent", { waitUntil: "domcontentloaded", timeout: 45_000 });
    expect(page.url()).not.toContain("/auth/login");
    await expect(page.getByText(/agreements|consent/i).first()).toBeVisible({ timeout: 15_000 });
  });
});
