/**
 * SOW end-to-end flow — driven through the REAL browser (Playwright), logging
 * in via the per-portal login pages, not the API.
 *
 * Coverage:
 *  1. Enterprise signs in → SOW list, create/intake, decomposition pages render
 *     (no crash, no auth bounce), capturing any console/page errors.
 *  2. Superadmin signs in → admin SOW approval queue + detail render.
 *
 * Run: PLAYWRIGHT_SKIP_WEBSERVER=1 npx playwright test sow-flow --project=flows
 * (server already running on :3000)
 */

import { test, expect, type Page } from "@playwright/test";
import { loginAs } from "./helpers/auth";

// The dev server compiles each route on first hit (can take 30-60s cold), so
// give these browser walks plenty of headroom — they exercise many routes.
test.describe.configure({ timeout: 240_000 });

/** Attach console + pageerror listeners; returns a getter for collected errors. */
function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`[console] ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`[pageerror] ${err.message}`));
  page.on("response", (res) => {
    if (res.status() >= 500) errors.push(`[http ${res.status()}] ${res.url()}`);
  });
  return () => errors;
}

/** Navigate, assert no auth bounce + no blank/error screen, report errors. */
async function visit(page: Page, path: string, getErrors: () => string[]) {
  const before = getErrors().length;
  let status = 0;
  // A client-side redirect on the PREVIOUS page can abort this goto
  // (net::ERR_ABORTED). That's a navigation race, not an app failure — retry
  // once after the redirect settles.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const resp = await page.goto(path, { waitUntil: "domcontentloaded", timeout: 45_000 });
      status = resp?.status() ?? 0;
      break;
    } catch (err) {
      if (attempt === 0 && String(err).includes("ERR_ABORTED")) {
        await page.waitForTimeout(800);
        continue;
      }
      throw err;
    }
  }
  await page.waitForTimeout(1200); // let client render + data fetches settle
  const url = page.url();
  const bounced = url.endsWith("/login") || url.includes("/auth/");
  const bodyText = (await page.locator("body").innerText().catch(() => "")) || "";
  const looksError =
    /something went wrong|application error|unhandled|500 -|this page could not/i.test(bodyText);
  const newErrors = getErrors().slice(before);
  return { path, url, status, bounced, looksError, newErrors, hasBody: bodyText.trim().length > 0 };
}

test.describe("SOW flow (browser-driven)", () => {
  test("enterprise: SOW + decomposition pages render", async ({ page }) => {
    const getErrors = trackErrors(page);
    await loginAs(page, "enterprise");

    const paths = [
      "/enterprise/dashboard",
      "/enterprise/sow",
      "/enterprise/sow/new",
      "/enterprise/sow/intake",
      "/enterprise/decomposition",
      "/enterprise/projects",
    ];

    const results = [];
    for (const p of paths) results.push(await visit(page, p, getErrors));

    // Print a readable report into the test output.
    for (const r of results) {
      // eslint-disable-next-line no-console
      console.log(
        `  ${r.bounced ? "↩ BOUNCED" : r.looksError ? "✖ ERROR " : "✓ OK    "} ${r.path} -> ${r.url} [${r.status}]` +
          (r.newErrors.length ? `\n      errors: ${r.newErrors.join("\n      ")}` : ""),
      );
    }

    // Hard assertions: no page may bounce to login (we're authenticated).
    const bounced = results.filter((r) => r.bounced).map((r) => r.path);
    expect(bounced, `pages bounced to login: ${bounced.join(", ")}`).toHaveLength(0);
    // No page may show a crash/error screen.
    const errored = results.filter((r) => r.looksError).map((r) => r.path);
    expect(errored, `pages showed an error screen: ${errored.join(", ")}`).toHaveLength(0);
  });

  test("enterprise: upload auto-approves and jumps to Submit (no Review step)", async ({ page }) => {
    trackErrors(page);
    await loginAs(page, "enterprise");

    // Upload-only: the bare intake URL should land directly on the Upload
    // wizard (no mode chooser, no AI options).
    await page.goto("/enterprise/sow/intake", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    const chooserBody = (await page.locator("body").innerText().catch(() => "")) || "";
    // eslint-disable-next-line no-console
    console.log(
      `  intake shows AI/author wording: ${/generate with ai|start authoring|browse templates/i.test(chooserBody)}`,
    );
    expect(
      /generate with ai|browse templates/i.test(chooserBody),
      "intake should not surface AI/template entry points",
    ).toBeFalsy();

    // Upload your real lab-manual PDF via the hidden file input. Re-set the
    // file until "Upload + extract" enables (React onChange can miss the first
    // setInputFiles on a cold-compiled page).
    const pdf = "C:/Users/fayaz/Downloads/ADB lab programs_merged.pdf";
    const fileInput = page.locator('input[type="file"]');
    await fileInput.waitFor({ state: "attached", timeout: 15_000 });
    const cont = page.getByRole("button", { name: /upload \+ extract/i }).first();
    for (let attempt = 0; attempt < 3; attempt++) {
      await fileInput.setInputFiles([]);
      await fileInput.setInputFiles(pdf);
      await page.waitForTimeout(1200);
      if (await cont.isEnabled().catch(() => false)) break;
    }
    await expect(cont).toBeEnabled({ timeout: 15_000 });
    await cont.click();

    // It should NOT stop on the Review step — it should land on the Submit /
    // approvers step. Wait for the approver/submission UI to appear.
    await page.waitForTimeout(3000);
    const body = (await page.locator("body").innerText().catch(() => "")) || "";
    // eslint-disable-next-line no-console
    console.log(`  after upload+continue, page shows approver UI: ${/approver|approval|submit for/i.test(body)}`);
    expect(
      /approver|approval pipeline|submit for|reviewer|signatory|stage/i.test(body),
      "expected to land on the Submit/approvers step after auto-approve",
    ).toBeTruthy();
  });

  test("superadmin: admin SOW approval queue renders", async ({ page }) => {
    const getErrors = trackErrors(page);
    await loginAs(page, "admin");

    const paths = ["/admin/dashboard", "/admin/sow"];
    const results = [];
    for (const p of paths) results.push(await visit(page, p, getErrors));

    for (const r of results) {
      // eslint-disable-next-line no-console
      console.log(
        `  ${r.bounced ? "↩ BOUNCED" : r.looksError ? "✖ ERROR " : "✓ OK    "} ${r.path} -> ${r.url} [${r.status}]` +
          (r.newErrors.length ? `\n      errors: ${r.newErrors.join("\n      ")}` : ""),
      );
    }

    const bounced = results.filter((r) => r.bounced).map((r) => r.path);
    expect(bounced, `pages bounced to login: ${bounced.join(", ")}`).toHaveLength(0);
    const errored = results.filter((r) => r.looksError).map((r) => r.path);
    expect(errored, `pages showed an error screen: ${errored.join(", ")}`).toHaveLength(0);
  });
});
