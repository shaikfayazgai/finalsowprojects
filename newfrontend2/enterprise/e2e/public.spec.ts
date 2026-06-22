import { test, expect } from "@playwright/test";
import { SMOKE_ROUTES, expectRouteLoads } from "./helpers/routes";

test.describe("Public portal @ui-mock", () => {
  for (const path of SMOKE_ROUTES.public) {
    test(`loads ${path} without login`, async ({ page }) => {
      await page.goto(path, { waitUntil: "domcontentloaded", timeout: 45_000 });
      expect(page.url()).not.toContain("/auth/login");
    });
  }
});
