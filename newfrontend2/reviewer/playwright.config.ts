import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const authDir = path.join(__dirname, "e2e", ".auth");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  globalSetup: "./e2e/global-setup.ts",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 1,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "e2e/report/html" }],
    ["json", { outputFile: "e2e/report/results.json" }],
  ],
  use: {
    baseURL,
    trace: "off",
    screenshot: "off",
    video: "off",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "auth",
      testMatch: /auth\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "smoke-admin",
      testMatch: /admin\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], storageState: path.join(authDir, "admin.json") },
      dependencies: ["setup"],
    },
    {
      name: "smoke-contributor",
      testMatch: /contributor\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], storageState: path.join(authDir, "contributor.json") },
      dependencies: ["setup"],
    },
    {
      name: "smoke-enterprise",
      testMatch: /enterprise\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], storageState: path.join(authDir, "enterprise.json") },
      dependencies: ["setup"],
    },
    {
      name: "smoke-mentor",
      testMatch: /mentor\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], storageState: path.join(authDir, "mentorLead.json") },
      dependencies: ["setup"],
    },
    {
      name: "smoke-reviewer",
      testMatch: /enterprise-reviewer-smoke\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], storageState: path.join(authDir, "entReviewer.json") },
      dependencies: ["setup"],
    },
    {
      name: "smoke-analytics",
      testMatch: /analytics\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], storageState: path.join(authDir, "enterprise.json") },
      dependencies: ["setup"],
    },
    {
      name: "smoke-public",
      testMatch: /public\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "flows",
      testMatch: /(?:flows\/.*\.spec\.ts|mentorship-assignment\.spec\.ts|edge-cases\.spec\.ts)/,
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
    {
      name: "stakeholder-rbac",
      testMatch: /enterprise-stakeholder-rbac\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: process.env.CI ? "npm run start -- -p 3000" : "npm run dev -- -p 3000",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
