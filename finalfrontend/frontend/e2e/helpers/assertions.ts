import { expect, type Page } from "@playwright/test";

export async function expectNoLoginRedirect(page: Page) {
  expect(page.url()).not.toContain("/auth/login");
}

export async function expectToastOrText(page: Page, pattern: RegExp | string) {
  const re = typeof pattern === "string" ? new RegExp(pattern, "i") : pattern;
  await expect(page.getByText(re).first()).toBeVisible({ timeout: 10_000 });
}

export async function expectSavedIndicator(page: Page) {
  await expect(
    page.locator("footer, [role='status'], main").getByText(/^Saved$/).first(),
  ).toBeVisible({ timeout: 8_000 });
}
