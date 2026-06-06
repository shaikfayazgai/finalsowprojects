import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const authDir = path.join(__dirname, "e2e", ".auth");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  globalSetup: "./e2e/global-setup.ts",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
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
      name: "admin",
      testMatch: /admin\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], storageState: path.join(authDir, "admin.json") },
      dependencies: ["setup"],
    },
    {
      name: "contributor",
      testMatch: /contributor\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], storageState: path.join(authDir, "contributor.json") },
      dependencies: ["setup"],
    },
    {
      name: "enterprise",
      testMatch: /enterprise\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], storageState: path.join(authDir, "enterprise.json") },
      dependencies: ["setup"],
    },
    {
      name: "mentor",
      testMatch: /mentor\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], storageState: path.join(authDir, "mentorLead.json") },
      dependencies: ["setup"],
    },
    {
      name: "flows",
      testMatch: /mentorship-assignment\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "sow",
      testMatch: /sow-flow\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: "npm run dev -- -p 3000",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
