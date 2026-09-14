import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  timeout: 45_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3111",
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
    viewport: { width: 1440, height: 900 },
    // The sandbox provides Chromium at a fixed path; Playwright must not
    // attempt to download its own build here. The browser only ever talks to
    // localhost: Supabase traffic rides the same-origin /supabase rewrite
    // (see next.config.ts and memory/lessons/004).
    launchOptions: {
      executablePath: process.env.PW_CHROMIUM_PATH ?? "/opt/pw-browsers/chromium",
    },
  },
  webServer: [
    {
      command: "pnpm dev --port 3111",
      url: "http://localhost:3111",
      reuseExistingServer: true,
      timeout: 120_000,
    },
    // The stand in for Google Classroom and Canvas (docs/CLASSWORK.md). The
    // dev server reaches it when .env.local sets CLASSWORK_PROVIDER_MODE=stub;
    // the classwork spec skips itself when that is not the case.
    {
      command: "node tests/stub-lms/server.mjs",
      url: "http://localhost:3112/__control",
      reuseExistingServer: true,
      timeout: 15_000,
    },
  ],
});
