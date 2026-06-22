import { expect, test } from "@playwright/test";
import { loginAs, gotoPortal } from "../helpers/auth";

test.describe("Enterprise four roles — nav & gates @e2e", () => {
  test("sponsor: SOW yes, Decomposition hidden", async ({ page }) => {
    await loginAs(page, "enterprise");
    await expect(page.getByRole("link", { name: "New SOW" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("link", { name: "Decomposition" })).toHaveCount(0);
  });

  test("PMO: Decomposition yes, New SOW hidden", async ({ page }) => {
    await loginAs(page, "enterprisePmo");
    await expect(page.getByRole("link", { name: "Decomposition" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("link", { name: "New SOW" })).toHaveCount(0);
    await gotoPortal(page, "/enterprise/sow/intake");
    await page.waitForURL((u) => !u.pathname.startsWith("/enterprise/sow/intake"), {
      timeout: 15_000,
    });
    expect(page.url()).not.toContain("/enterprise/sow/intake");
  });

  test("enterprise admin: Decomposition + tenant settings", async ({ page }) => {
    await loginAs(page, "enterpriseAdmin");
    await expect(page.getByRole("link", { name: "Decomposition" })).toBeVisible({ timeout: 15_000 });
    await gotoPortal(page, "/enterprise/settings/tenant");
    await expect(page.getByRole("heading", { name: /Members|Tenant/i }).first()).toBeVisible({
      timeout: 20_000,
    });
  });
});
