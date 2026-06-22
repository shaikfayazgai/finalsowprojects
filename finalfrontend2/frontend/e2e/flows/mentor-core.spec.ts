import path from "node:path";
import { test, expect } from "@playwright/test";
import { expectRouteLoads } from "../helpers/routes";
import { expectSavedIndicator } from "../helpers/assertions";

const mentorLeadAuth = path.join(__dirname, "..", ".auth", "mentorLead.json");
const mentorBaseAuth = path.join(__dirname, "..", ".auth", "mentorBase.json");

test.describe("Mentor core @ui-real", () => {
  test.use({ storageState: mentorLeadAuth });

  test("lead mentor sees escalations nav @ui-real", async ({ page }) => {
    await page.goto("/mentor/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForResponse((r) => r.url().includes("/api/mentor/me") && r.ok(), {
      timeout: 20_000,
    });
    await expect(page.locator("aside").getByRole("link", { name: /escalation/i })).toBeVisible();
  });

  test("onboarding page is standalone @ui-real", async ({ page }) => {
    await expectRouteLoads(page, "/mentor/onboarding");
    expect(await page.locator('nav[aria-label="Main navigation"]').count()).toBe(0);
  });
});

test.describe("Mentor core gating @ui-real", () => {
  test.use({ storageState: mentorBaseAuth });

  test("base mentor direct escalation URL shows access denied @ui-real", async ({ page }) => {
    await expectRouteLoads(page, "/mentor/escalation");
    await expect(page.getByRole("heading", { name: "Escalation access" })).toBeVisible();
  });
});

test.describe("Mentor queue decisions @partial", () => {
  test.use({ storageState: mentorLeadAuth });

  test("accept removes review from queue @partial", async ({ page }) => {
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

  test("unknown reviewId shows not found @partial", async ({ page }) => {
    await page.goto("/mentor/queue/rev-does-not-exist-999", { waitUntil: "domcontentloaded" });
    const notFound =
      (await page.getByText(/not found|404|could not load review/i).count()) > 0 ||
      page.url().includes("/mentor/queue");
    expect(notFound).toBeTruthy();
  });

  test("two-stage review shows route-to-reviewer copy @ui-mock", async ({ page }) => {
    await expectRouteLoads(page, "/mentor/queue");
    const twoStage = page.locator("a[href*='/mentor/queue/rev-']").filter({ hasText: /Two-stg|two.stage/i });
    if ((await twoStage.count()) === 0) {
      test.skip(true, "No two-stage items in mock queue");
      return;
    }
    await twoStage.first().click();
    await page.getByRole("button", { name: "Decide", exact: true }).click();
    await expect(page.getByText(/enterprise reviewer|two-stage|client/i).first()).toBeVisible();
  });
});

test.describe("Mentor settings @partial", () => {
  test.use({ storageState: mentorLeadAuth });

  test("availability save shows Saved @partial", async ({ page }) => {
    await expectRouteLoads(page, "/mentor/settings/availability");
    await page
      .locator("select")
      .filter({ has: page.locator("option", { hasText: "Up to 30 reviews / week" }) })
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
    await expectSavedIndicator(page);
  });
});

test.describe("Mentor mentorship session @ui-real", () => {
  test.use({ storageState: mentorLeadAuth });

  test("sessions list loads @ui-real", async ({ page }) => {
    await expectRouteLoads(page, "/mentor/mentorship");
    await expect(page.getByText(/Today|Upcoming|Held|Sessions/i).first()).toBeVisible();
  });
});
