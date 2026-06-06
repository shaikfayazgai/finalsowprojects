import { test, expect } from "@playwright/test";
import path from "node:path";
import { expectRouteLoads } from "./helpers/routes";

const mentorBaseAuth = path.join(__dirname, ".auth", "mentorBase.json");

test.describe("Mentor portal @ui-mock", () => {
  const routes = [
    "/mentor/dashboard",
    "/mentor/queue",
    "/mentor/history",
    "/mentor/history/metrics",
    "/mentor/mentorship",
    "/mentor/escalation",
    "/mentor/escalation/esc-001",
    "/mentor/profile",
    "/mentor/profile/edit",
    "/mentor/settings",
    "/mentor/settings/availability",
    "/mentor/notifications",
    "/mentor/onboarding",
    "/mentor/queue/rev-001",
    "/mentor/queue/rev-001/diff",
    "/mentor/queue/rev-001/audit",
  ];

  for (const path of routes) {
    test(`loads ${path}`, async ({ page }) => {
      await expectRouteLoads(page, path);
    });
  }

  test("onboarding is standalone (no portal sidebar)", async ({ page }) => {
    await expectRouteLoads(page, "/mentor/onboarding");
    expect(await page.locator('nav[aria-label="Main navigation"]').count()).toBe(0);
    expect(await page.getByText("Mentor agreements").count()).toBeGreaterThan(0);
  });
});

test.describe("Mentor role gating @ui-real", () => {
  test.use({ storageState: mentorBaseAuth });

  test("amelia: escalations nav hidden", async ({ page }) => {
    await page.goto("/mentor/dashboard", { waitUntil: "domcontentloaded" });
    expect(await page.locator("aside").getByRole("link", { name: /escalation/i }).count()).toBe(0);
  });
});

test.describe("Mentor decisions @partial", () => {
  test("accept removes review from queue (in-memory runtime)", async ({ page }) => {
    await expectRouteLoads(page, "/mentor/queue");
    const firstReview = page.locator('a[href*="/mentor/queue/rev-"]').first();
    if ((await firstReview.count()) === 0) {
      test.skip(true, "No open reviews in mock queue");
      return;
    }
    const href = await firstReview.getAttribute("href");
    const reviewId = href?.match(/rev-[^/]+/)?.[0];
    expect(reviewId).toBeTruthy();
    await expectRouteLoads(page, `/mentor/queue/${reviewId}`);
    await page.getByRole("button", { name: "Decide", exact: true }).click();
    await page.getByRole("button", { name: "Accept", exact: true }).click();
    await page.getByRole("dialog").waitFor();
    await page.getByRole("button", { name: /confirm accept/i }).click();
    await page.waitForURL("**/mentor/queue**", { timeout: 30_000 });
    await page.waitForTimeout(1000);
    expect(await page.locator(`a[href*="${reviewId}"]`).count()).toBe(0);
  });
});

test.describe("Mentor settings @partial", () => {
  test("availability save shows Saved", async ({ page }) => {
    await expectRouteLoads(page, "/mentor/settings/availability");
    await page
      .locator("section")
      .filter({ hasText: "Weekly review capacity" })
      .locator("select")
      .selectOption("30");
    const saveBtn = page.getByRole("button", { name: "Save changes" });
    await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes("/api/mentor/settings/availability") &&
          r.request().method() === "PATCH" &&
          r.ok(),
      ),
      saveBtn.click(),
    ]);
    await expect(page.getByText("Saved")).toBeVisible({ timeout: 5_000 });
  });
});
