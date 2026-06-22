import { test, expect } from "@playwright/test";

test.describe("Auth register surfaces @partial", () => {
  test("mentor register page loads @partial", async ({ page }) => {
    await page.goto("/auth/register/mentor", { waitUntil: "domcontentloaded" });
    expect(page.url()).not.toContain("/auth/login");
    await expect(page.getByText(/invitation|mentor/i).first()).toBeVisible();
  });

  test("reviewer register page loads @partial", async ({ page }) => {
    await page.goto("/auth/register/reviewer", { waitUntil: "domcontentloaded" });
    expect(page.url()).not.toContain("/auth/login");
    await expect(page.getByText(/invitation|reviewer/i).first()).toBeVisible();
  });
});

test.describe("Auth lifecycle @blocked", () => {
  test.skip("OAuth Google login completes @blocked — criterion: auth SSO", async () => {
    // See docs/e2e/MANUAL-QA-CHECKLIST.md
  });

  test.skip("OAuth Microsoft login completes @blocked — criterion: auth SSO", async () => {
    // See docs/e2e/MANUAL-QA-CHECKLIST.md
  });
});
