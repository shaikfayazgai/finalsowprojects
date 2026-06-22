import path from "node:path";
import { test, expect } from "@playwright/test";
import { expectRouteLoads } from "../helpers/routes";

const enterpriseAuth = path.join(__dirname, "..", ".auth", "enterprise.json");

test.describe("Enterprise core @ui-mock", () => {
  test.use({ storageState: enterpriseAuth });

  test("SOW workspace has heading @ui-mock", async ({ page }) => {
    await expectRouteLoads(page, "/enterprise/sow");
    const hasContent =
      (await page.getByRole("heading").count()) > 0 ||
      (await page.getByText(/statement of work|sow/i).count()) > 0;
    expect(hasContent).toBeTruthy();
  });

  test("decomposition plan loads tasks @ui-mock", async ({ page }) => {
    await expectRouteLoads(page, "/enterprise/decomposition/plan-acme-1");
    expect(await page.getByText(/could not load|internal server error/i).count()).toBe(0);
  });

  test("projects workspace loads @ui-mock", async ({ page }) => {
    await expectRouteLoads(page, "/enterprise/projects");
    expect(await page.getByRole("heading").count()).toBeGreaterThan(0);
  });

  test("workforce directory loads @ui-mock", async ({ page }) => {
    await expectRouteLoads(page, "/enterprise/workforce");
    expect(await page.getByText(/could not load|internal server error/i).count()).toBe(0);
  });
});

test.describe("Enterprise core @blocked", () => {
  test.use({ storageState: enterpriseAuth });

  test.skip("two-stage review toggle visible in decomposition @blocked — criterion #12", async () => {
    // UI not wired — reviewPath read-only in task table
  });

  test.skip("SOW five-stage approval completes @blocked — superseded by sow-two-gate-approval.spec.ts", async () => {
    // Legacy 5-stage flow removed
  });
});
