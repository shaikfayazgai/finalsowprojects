import path from "node:path";
import { test, expect } from "@playwright/test";
import { expectRouteLoads } from "../helpers/routes";

const adminAuth = path.join(__dirname, "..", ".auth", "admin.json");

test.describe("Admin core @ui-mock", () => {
  test.use({ storageState: adminAuth });

  test("mentor pool list loads @ui-mock", async ({ page }) => {
    await expectRouteLoads(page, "/admin/mentors");
    expect(await page.getByText(/could not load|internal server error/i).count()).toBe(0);
  });

  test("email templates workspace loads @ui-mock", async ({ page }) => {
    await expectRouteLoads(page, "/admin/email-templates");
    await expect(page.getByRole("heading", { name: /email templates/i })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("tenant list loads @ui-mock", async ({ page }) => {
    await expectRouteLoads(page, "/admin/tenants");
    expect(await page.getByText(/could not load|internal server error/i).count()).toBe(0);
  });

  test("governance queue loads @ui-mock", async ({ page }) => {
    await expectRouteLoads(page, "/admin/governance");
    expect(await page.getByText(/could not load|internal server error/i).count()).toBe(0);
  });

  test("new mentor invite opens from list @ui-mock", async ({ page }) => {
    await page.goto("/admin/mentors/new");
    await expect(page).toHaveURL(/\/admin\/mentors(\?|$)/, { timeout: 15_000 });
    await expect(page.getByRole("dialog", { name: /invite mentor/i })).toBeVisible({
      timeout: 15_000,
    });
    expect(await page.getByText(/could not load|internal server error/i).count()).toBe(0);
  });
});
