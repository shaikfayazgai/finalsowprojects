import path from "node:path";
import { test, expect } from "@playwright/test";
import { expectRouteLoads } from "../helpers/routes";

const entReviewerAuth = path.join(__dirname, "..", ".auth", "entReviewer.json");
const enterpriseAuth = path.join(__dirname, "..", ".auth", "enterprise.json");

test.describe("Enterprise reviewer @ui-real", () => {
  test.use({ storageState: entReviewerAuth });

  test("reviewer lands on QA queue with header @ui-real", async ({ page }) => {
    await expectRouteLoads(page, "/enterprise/reviewer/queue");
    await expect(page.getByText(/QA Review|Pending reviews|quality sign-off/i).first()).toBeVisible();
  });

  test("reviewer queue lists items or empty state @ui-mock", async ({ page }) => {
    await expectRouteLoads(page, "/enterprise/reviewer/queue");
    await expect(
      page
        .locator("a[href*='/enterprise/reviewer/queue/']")
        .or(page.getByText(/Queue clear|No matches|Review queue/i))
        .first(),
    ).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Enterprise reviewer access @ui-real", () => {
  test.use({ storageState: enterpriseAuth });

  test("non-reviewer enterprise admin can open reviewer routes @partial", async ({ page }) => {
    await expectRouteLoads(page, "/enterprise/reviewer/queue");
    expect(page.url()).toContain("/enterprise/reviewer");
  });
});
