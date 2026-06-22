import type { Page } from "@playwright/test";

/** Reset client-side mock overlays so SOW/decomposition E2E starts from seed data. */
export async function clearGlimmoraMockStorage(page: Page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("glimmora.mock.")) localStorage.removeItem(key);
    }
  });
}
