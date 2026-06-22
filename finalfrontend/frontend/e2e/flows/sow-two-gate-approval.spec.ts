import { expect, test } from "@playwright/test";
import { loginAs, logout, gotoPortal } from "../helpers/auth";
import { clearGlimmoraMockStorage } from "../helpers/mock-storage";

const COMMERCIAL_COMMENT =
  "E2E commercial approval: rates align with MSA, staffing pool confirmed for rollout.";

test.describe("SOW two-gate approval golden path @e2e", () => {
  test.describe.configure({ mode: "serial", timeout: 180_000 });

  test("author → Glimmora Commercial → enterprise final → decompose → plan approve → project", async ({
    page,
  }) => {
    await clearGlimmoraMockStorage(page);

    const uniqueTitle = `E2E Two-Gate ${Date.now()}`;

    // ── 1. Enterprise: author + submit ─────────────────────────────
    await loginAs(page, "enterprise");
    await gotoPortal(page, "/enterprise/sow/intake?mode=author");
    await expect(page.getByRole("heading", { name: /Author a SOW/i })).toBeVisible({
      timeout: 30_000,
    });
    await page.locator("#title").fill(uniqueTitle);
    await page.getByRole("button", { name: /Continue · pick approvers/i }).click();
    await expect(page.getByText("Two-step approval")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("Glimmora Commercial").first()).toBeVisible();
    await expect(page.getByText("Enterprise approval").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit for approval" })).toBeVisible({
      timeout: 20_000,
    });
    await page.getByRole("button", { name: "Submit for approval" }).click();
    await expect(page.getByRole("heading", { name: "Submitted for approval" })).toBeVisible({
      timeout: 30_000,
    });

    const viewHref = await page.getByRole("link", { name: "View SOW" }).getAttribute("href");
    expect(viewHref).toMatch(/\/enterprise\/sow\/sow-/);
    const sowId = viewHref!.split("/").filter(Boolean).pop()!;

    await gotoPortal(page, `/enterprise/sow/${sowId}/approve`);
    await expect(page.getByText("Awaiting Glimmora Commercial")).toBeVisible({ timeout: 15_000 });

    // ── 2. Platform admin: commercial gate ───────────────────────────
    await logout(page);
    await loginAs(page, "admin");
    await gotoPortal(page, `/admin/sow/${sowId}`);
    await expect(page.getByRole("button", { name: "Approve Commercial" })).toBeVisible({
      timeout: 20_000,
    });
    await page.getByRole("button", { name: "Approve Commercial" }).click();

    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible({ timeout: 10_000 });
    for (const item of [
      "Rate cards apply to the in-scope skill set",
      "Effort estimates fall within ±15% of historical",
      "Payment terms align with master agreement",
    ]) {
      await modal.getByRole("checkbox", { name: item }).check();
    }
    await modal.locator("textarea").fill(COMMERCIAL_COMMENT);
    await modal.getByRole("button", { name: "Approve Commercial" }).click();
    await expect(page).toHaveURL(/\/admin\/sow/, { timeout: 30_000 });

    // ── 3. Sponsor cannot self-approve at final ──────────────────────
    await logout(page);
    await loginAs(page, "enterprise");
    await gotoPortal(page, `/enterprise/sow/${sowId}/approve`);
    await expect(page.getByText("Awaiting enterprise admin sign-off")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("button", { name: "Approve stage" })).toHaveCount(0);

    // ── 4. Enterprise admin (not owner): final sign-off ──────────────
    await logout(page);
    await loginAs(page, "enterpriseAdmin");
    await gotoPortal(page, `/enterprise/sow/${sowId}/approve`);
    await expect(page.getByText(/Enterprise approval/i).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("Step 2 of 2")).toBeVisible();
    await page.getByRole("button", { name: "Approve stage" }).click();
    await expect(
      page.getByText(/This SOW is.*Approved|fully approved/i).first(),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("link", { name: "Decompose SOW" })).toBeVisible();

    // ── 5. PMO: decomposition (not sponsor/admin-only) ───────────────
    await logout(page);
    await loginAs(page, "enterprisePmo");
    await gotoPortal(page, "/enterprise/decomposition");
    const sowRow = page.getByRole("listitem").filter({ hasText: uniqueTitle });
    await expect(sowRow).toBeVisible({ timeout: 15_000 });
    await sowRow.getByRole("button", { name: "Decompose" }).click();
    await page.waitForURL(/\/enterprise\/decomposition\/plan-/, { timeout: 30_000 });
    const planId = page.url().split("/").pop()!;
    expect(planId).toMatch(/^plan-/);

    // ── 6. Enterprise admin: approve decomposition plan ────────────────
    await logout(page);
    await loginAs(page, "enterpriseAdmin");
    await gotoPortal(page, `/enterprise/decomposition/${planId}/approve`);
    await expect(page).toHaveURL(new RegExp(`/enterprise/decomposition/${planId}/approve$`), {
      timeout: 30_000,
    });
    await expect(page.getByText(/could not load|internal server error|not found/i)).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Approve plan" })).toBeVisible();
    await page.getByRole("button", { name: "Approve plan" }).click();
    await page.waitForURL(new RegExp(`/enterprise/decomposition/${planId}$`), {
      timeout: 30_000,
    });

    // ── 7. Delivery project provisioned with starter tasks ─────────────
    const projectId = `prj-${planId.replace(/^plan-/, "")}`;
    await gotoPortal(page, `/enterprise/projects/${projectId}`);
    await expect(page.getByText(/could not load|internal server error|not found/i)).toHaveCount(0);
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/provisioned from approved plan/i).first()).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole("button", { name: "Delivery" }).click();
    await expect(page.getByText(/Kickoff \+ requirements|Core implementation/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
