import { test, expect } from "@playwright/test";
import path from "node:path";
import { defineSmokeRouteTests, expectRouteLoads } from "./helpers/routes";

const mentorBaseAuth = path.join(__dirname, ".auth", "mentorBase.json");

test.describe("Mentor portal @ui-mock", () => {
  defineSmokeRouteTests("mentor");

  test("onboarding is standalone (no portal sidebar) @ui-mock", async ({ page }) => {
    await expectRouteLoads(page, "/mentor/onboarding");
    expect(await page.locator('nav[aria-label="Main navigation"]').count()).toBe(0);
    expect(await page.getByText(/Mentor agreements|Agreements/i).count()).toBeGreaterThan(0);
  });
});

test.describe("Mentor role gating @ui-real", () => {
  test.use({ storageState: mentorBaseAuth });

  test("amelia: escalations nav hidden @ui-real", async ({ page }) => {
    await page.goto("/mentor/dashboard", { waitUntil: "domcontentloaded" });
    expect(await page.locator("aside").getByRole("link", { name: /escalation/i }).count()).toBe(0);
  });
});
