import { test, expect } from "@playwright/test";
import path from "node:path";
import { expectRouteLoads } from "./helpers/routes";

const authDir = path.join(__dirname, ".auth");

test.describe("Mentorship assignment @ui-real", () => {
  test("contributor opt-in → system assigns → mentor sees real session", async ({
    browser,
  }) => {
    const contribCtx = await browser.newContext({
      storageState: path.join(authDir, "contributor.json"),
    });
    const optIn = await contribCtx.request.post("/api/contributor/mentorship/opt-in", {
      data: { focus: "E2E mentorship — React portfolio review" },
    });
    expect(optIn.ok(), await optIn.text()).toBeTruthy();
    await contribCtx.close();

    const mentorCtx = await browser.newContext({
      storageState: path.join(authDir, "mentorLead.json"),
    });
    const mentorPage = await mentorCtx.newPage();
    await expectRouteLoads(mentorPage, "/mentor/mentorship");
    await expect(mentorPage.getByText(/Priya Raghav/i)).toBeVisible({ timeout: 15_000 });
    await mentorCtx.close();
  });
});
