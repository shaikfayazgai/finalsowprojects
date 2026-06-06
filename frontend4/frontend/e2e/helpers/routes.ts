import { expect, type Page } from "@playwright/test";
import { gotoPortal } from "./auth";

/** Smoke: route loads without auth redirect. */
export async function expectRouteLoads(page: Page, path: string) {
  await gotoPortal(page, path);
  expect(page.url()).not.toContain("/auth/login");
}
