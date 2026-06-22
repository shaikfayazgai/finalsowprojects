import { test as setup } from "@playwright/test";
import { loginAs, type SeedUser } from "./helpers/auth";
import path from "node:path";

const AUTH_DIR = path.join(__dirname, ".auth");

const ROLES: SeedUser[] = [
  "admin",
  "enterprise",
  "enterpriseAdmin",
  "enterprisePmo",
  "entReviewer",
  "contributor",
  "mentorLead",
  "mentorBase",
];

for (const role of ROLES) {
  setup(`authenticate ${role}`, async ({ page }) => {
    await loginAs(page, role);
    await page.context().storageState({ path: path.join(AUTH_DIR, `${role}.json`) });
  });
}
