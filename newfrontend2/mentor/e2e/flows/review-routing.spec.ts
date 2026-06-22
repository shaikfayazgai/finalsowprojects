import path from "node:path";
import { test, expect } from "@playwright/test";
import { contributorMentorshipOptIn } from "../helpers/seeds";

const contributorAuth = path.join(__dirname, "..", ".auth", "contributor.json");
const entReviewerAuth = path.join(__dirname, "..", ".auth", "entReviewer.json");
const mentorLeadAuth = path.join(__dirname, "..", ".auth", "mentorLead.json");

test.describe("Review routing Flow A @ui-real", () => {
  test("mentorship assignment regression @ui-real", async ({ browser }) => {
    const contribCtx = await browser.newContext({ storageState: contributorAuth });
    const first = await contributorMentorshipOptIn(contribCtx.request);
    expect(first.ok, first.body).toBeTruthy();
    const second = await contributorMentorshipOptIn(contribCtx.request);
    expect(second.ok, second.body).toBeTruthy();
    await contribCtx.close();

    const mentorCtx = await browser.newContext({ storageState: mentorLeadAuth });
    const page = await mentorCtx.newPage();
    await page.goto("/mentor/mentorship", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/Priya Raghav/i)).toBeVisible({ timeout: 15_000 });
    await mentorCtx.close();
  });
});

test.describe("Review routing Flow B @blocked", () => {
  test.skip("contributor UI submit appears in mentor queue @blocked — criterion #10", async () => {
    // Requires workroom submit + listMentorQueue wired to UI
  });
});

test.describe("Review routing Flow C @partial", () => {
  test.use({ storageState: entReviewerAuth });

  test("enterprise reviewer queue loads mentor-approved mock items @partial", async ({ page }) => {
    await page.goto("/enterprise/reviewer/queue", { waitUntil: "domcontentloaded" });
    expect(page.url()).toContain("/enterprise/reviewer");
    expect(await page.getByText(/could not load|internal server error/i).count()).toBe(0);
  });

  test.skip("mentor accept routes item to enterprise reviewer queue @blocked — criterion #12", async () => {
    // Requires twoStageReviewEnabled UI + notify on mentor accept
  });
});

test.describe("Review routing Flow D @blocked", () => {
  test.skip("internal reviewPath skips mentor queue @blocked — doc 09 §5.1", async () => {
    // Requires seeded internal submission + API assertion against listMentorQueue
  });
});
