import path from "node:path";
import { test, expect } from "@playwright/test";
import { logout, loginAs } from "./helpers/auth";
import { expectRouteLoads } from "./helpers/routes";

const mentorBaseAuth = path.join(__dirname, ".auth", "mentorBase.json");
const mentorLeadAuth = path.join(__dirname, ".auth", "mentorLead.json");

type EdgeCase = {
  id: string;
  portal: string;
  name: string;
  run: (args: { page: import("@playwright/test").Page }) => Promise<void>;
};

const RBAC_CASES: EdgeCase[] = [
  {
    id: "E-RBAC-01",
    portal: "auth",
    name: "unauthenticated contributor dashboard redirects to login",
    run: async ({ page }) => {
      await logout(page);
      await page.goto("/contributor/dashboard");
      await page.waitForTimeout(800);
      expect(page.url()).toContain("/auth/login");
    },
  },
  {
    id: "E-RBAC-02",
    portal: "auth",
    name: "enterprise blocked from mentor queue",
    run: async ({ page }) => {
      await logout(page);
      await loginAs(page, "enterprise");
      await page.goto("/mentor/queue");
      await page.waitForTimeout(1000);
      expect(page.url().includes("/enterprise") || page.url().includes("portal_mismatch")).toBeTruthy();
    },
  },
];

test.describe("Edge cases — RBAC @ui-real", () => {
  for (const c of RBAC_CASES) {
    test(`${c.id} ${c.name}`, async ({ page }) => {
      await c.run({ page });
    });
  }
});

test.describe("Edge cases — mentor @ui-real", () => {
  test.use({ storageState: mentorBaseAuth });

  test("E-MENTOR-10 base mentor escalation access denied", async ({ page }) => {
    await expectRouteLoads(page, "/mentor/escalation");
    await expect(page.getByRole("heading", { name: "Escalation access" })).toBeVisible();
  });
});

test.describe("Edge cases — mentor queue @partial", () => {
  test.use({ storageState: mentorLeadAuth });

  test("E-MENTOR-18 empty filter shows no matches or clear affordance", async ({ page }) => {
    await page.goto("/mentor/queue", { waitUntil: "domcontentloaded" });
    const search = page.getByPlaceholder(/search|filter/i);
    if ((await search.count()) > 0) {
      await search.fill("zzz-no-match-xyz-999");
      await page.waitForTimeout(500);
      const empty =
        (await page.getByText(/no matches|no results|clear filter/i).count()) > 0 ||
        (await page.locator('a[href*="/mentor/queue/rev-"]').count()) === 0;
      expect(empty).toBeTruthy();
    } else {
      test.skip(true, "No search filter on queue");
    }
  });
});

test.describe("Edge cases — mobile viewport @ui-mock", () => {
  test.use({ storageState: mentorLeadAuth });

  test("E-UX-01 mentor dashboard loads on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/mentor/dashboard", { waitUntil: "domcontentloaded" });
    expect(page.url()).toContain("/mentor/dashboard");
    expect(await page.getByText(/could not load|internal server error/i).count()).toBe(0);
  });
});

test.describe("Edge cases — mobile contributor @ui-mock", () => {
  test.use({ storageState: path.join(__dirname, ".auth", "contributor.json") });

  test("E-UX-02 contributor dashboard loads on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/contributor/dashboard", { waitUntil: "domcontentloaded" });
    expect(page.url()).toContain("/contributor/dashboard");
  });
});

test.describe("Edge cases — contributor @partial", () => {
  test.use({ storageState: path.join(__dirname, ".auth", "contributor.json") });

  test("E-CONTRIB-29 mentorship settings under settings not main nav", async ({ page }) => {
    await page.goto("/contributor/dashboard", { waitUntil: "domcontentloaded" });
    const mainNavMentorship = page.locator("aside").getByRole("link", { name: /^mentorship$/i });
    expect(await mainNavMentorship.count()).toBe(0);
    await page.goto("/contributor/settings/mentorship");
    expect(page.url()).toContain("/contributor/settings/mentorship");
  });
});
