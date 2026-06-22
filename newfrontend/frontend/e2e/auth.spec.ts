import { test, expect } from "@playwright/test";
import { loginAs, logout, USERS } from "./helpers/auth";

test.describe("Auth @ui-real", () => {
  test("wrong password stays on login", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel("Email").fill(USERS.contributor.email);
    await page.locator("#login-password").fill("wrongpassword123");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.waitForTimeout(1500);
    expect(page.url()).toContain("/auth/login");
  });

  test("unauthenticated user redirected from protected route", async ({ page }) => {
    await logout(page);
    await page.goto("/contributor/dashboard");
    await page.waitForTimeout(800);
    expect(page.url()).toContain("/auth/login");
  });

  for (const role of Object.keys(USERS) as Array<keyof typeof USERS>) {
    test(`login redirects ${role} to portal`, async ({ page }) => {
      await logout(page);
      const { url, portalPrefix } = await loginAs(page, role);
      expect(url).toContain(portalPrefix);
    });
  }

  test("enterprise user blocked from mentor portal", async ({ page }) => {
    await logout(page);
    await loginAs(page, "enterprise");
    await page.goto("/mentor/queue");
    await page.waitForTimeout(1200);
    const url = page.url();
    expect(url.includes("portal_mismatch") || url.includes("/enterprise")).toBeTruthy();
  });
});
