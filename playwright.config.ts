import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 2,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [["html", { open: "never" }], ["list"]],
  timeout: 60000,
  expect: {
    timeout: 15000,
  },
  use: {
    baseURL: process.env.TEST_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm.cmd run dev",
    port: 3000,
    reuseExistingServer: true,
    timeout: 120000,
  },
});
