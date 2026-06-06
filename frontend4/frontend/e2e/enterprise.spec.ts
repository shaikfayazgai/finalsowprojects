import { test, expect } from "@playwright/test";
import { expectRouteLoads } from "./helpers/routes";

test.describe("Enterprise portal @ui-mock", () => {
  const routes = [
    "/enterprise/dashboard",
    "/enterprise/sow",
    "/enterprise/sow/intake",
    "/enterprise/projects",
    "/enterprise/decomposition",
    "/enterprise/review",
    "/enterprise/reviewer/review-queue",
    "/enterprise/billing",
    "/enterprise/analytics/economic",
    "/enterprise/compliance/documents",
    "/enterprise/audit",
    "/enterprise/settings",
    "/enterprise/onboarding",
  ];

  for (const path of routes) {
    test(`loads ${path}`, async ({ page }) => {
      await expectRouteLoads(page, path);
    });
  }

  test("SOW workspace renders list panel", async ({ page }) => {
    await expectRouteLoads(page, "/enterprise/sow");
    const hasContent =
      (await page.getByRole("heading").count()) > 0 ||
      (await page.getByText(/statement of work|sow/i).count()) > 0;
    expect(hasContent).toBeTruthy();
  });
});
