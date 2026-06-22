import { test, expect } from "@playwright/test";
import { defineSmokeRouteTests, expectRouteLoads } from "./helpers/routes";

test.describe("Contributor portal @ui-real", () => {
  defineSmokeRouteTests("contributor", "@ui-real");

  test("dashboard shows greeting or task content @ui-real", async ({ page }) => {
    await expectRouteLoads(page, "/contributor/dashboard");
    const ok =
      (await page.getByText(/good (morning|afternoon|evening)/i).count()) > 0 ||
      (await page.getByText(/task|dashboard/i).count()) > 0;
    expect(ok).toBeTruthy();
  });
});
