import path from "node:path";
import { test, expect } from "@playwright/test";
import { createMentorInvite, createReviewerInvite } from "../helpers/seeds";

const adminAuth = path.join(__dirname, "..", ".auth", "admin.json");
const enterpriseAuth = path.join(__dirname, "..", ".auth", "enterprise.json");

test.describe("Mentor invite register @partial", () => {
  test("admin mints invite and register page loads with code @partial", async ({ browser }) => {
    const adminCtx = await browser.newContext({ storageState: adminAuth });
    const email = `e2e-mentor-${Date.now()}@test.dev`;
    const { code } = await createMentorInvite(adminCtx.request, email);
    await adminCtx.close();

    const page = await browser.newPage();
    await page.goto(`/auth/register/mentor?code=${encodeURIComponent(code)}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByLabel(/first name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await page.close();
  });
});

test.describe("Reviewer invite register @partial", () => {
  test("enterprise mints invite and register page loads with code @partial", async ({ browser }) => {
    const entCtx = await browser.newContext({ storageState: enterpriseAuth });
    const email = `e2e-reviewer-${Date.now()}@test.dev`;
    const { code } = await createReviewerInvite(entCtx.request, email);
    await entCtx.close();

    const page = await browser.newPage();
    await page.goto(`/auth/register/reviewer?code=${encodeURIComponent(code)}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByLabel(/first name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await page.close();
  });
});
