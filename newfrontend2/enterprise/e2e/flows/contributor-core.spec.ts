import path from "node:path";
import { test, expect } from "@playwright/test";
import { expectRouteLoads } from "../helpers/routes";
import { expectNoLoginRedirect } from "../helpers/assertions";

const contributorAuth = path.join(__dirname, "..", ".auth", "contributor.json");

test.describe("Contributor core @ui-real", () => {
  test.use({ storageState: contributorAuth });

  test("dashboard shows tasks or empty state @ui-real", async ({ page }) => {
    await expectRouteLoads(page, "/contributor/dashboard");
    const err = await page.getByText(/could not load|internal server error/i).count();
    expect(err).toBe(0);
  });

  test("tasks workspace loads @ui-real", async ({ page }) => {
    await expectRouteLoads(page, "/contributor/tasks");
    expect(await page.getByText(/could not load|internal server error/i).count()).toBe(0);
  });

  test("mentorship settings page loads @ui-real", async ({ page }) => {
    await expectRouteLoads(page, "/contributor/settings/mentorship");
    await expectNoLoginRedirect(page);
  });
});

test.describe("Contributor settings navigation @ui-mock", () => {
  test.use({ storageState: contributorAuth });

  const settingsRoutes = [
    "/contributor/settings",
    "/contributor/settings/account",
    "/contributor/settings/notifications",
    "/contributor/settings/privacy",
  ];

  for (const route of settingsRoutes) {
    test(`loads ${route} @ui-mock`, async ({ page }) => {
      await expectRouteLoads(page, route);
    });
  }
});

test.describe("Contributor task loop @blocked", () => {
  test.skip("submit task reaches under_review in database @blocked — criterion #10", async () => {
    // Requires full submit pipeline + file scan — backend :4000 phase
  });

  test.skip("rework resubmit increments version @blocked — criterion #10", async () => {
    // Requires submission service E2E
  });
});
