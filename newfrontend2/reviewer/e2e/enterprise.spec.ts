import { test, expect } from "@playwright/test";
import { defineSmokeRouteTests, expectRouteLoads } from "./helpers/routes";

test.describe("Enterprise portal @ui-mock", () => {
  defineSmokeRouteTests("enterprise");

  test("SOW workspace renders list panel @ui-mock", async ({ page }) => {
    await expectRouteLoads(page, "/enterprise/sow");
    const hasContent =
      (await page.getByRole("heading").count()) > 0 ||
      (await page.getByText(/statement of work|sow/i).count()) > 0;
    expect(hasContent).toBeTruthy();
  });
});
