import { existsSync } from "node:fs";
import path from "node:path";
import { devices, type PlaywrightTestConfig } from "@playwright/test";

export interface PackagePlaywrightOptions {
  /** Workspace folder name, for example `theme`. */
  packageName: string;
  /** Absolute path to `packages/<name>`. */
  packageDir: string;
  /** Optional fixed port; defaults to `E2E_PORT` or `4173`. */
  port?: number;
}

type BrowserProfile = "pr" | "full";

function resolveBrowserProfile(): BrowserProfile {
  const profile = process.env.E2E_BROWSER_PROFILE;
  if (profile === "full") {
    return "full";
  }
  return "pr";
}

function resolveProjects(profile: BrowserProfile): PlaywrightTestConfig["projects"] {
  const chromium = {
    name: "chromium",
    use: { ...devices["Desktop Chrome"] },
  };

  if (profile === "pr") {
    return [chromium];
  }

  return [
    chromium,
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
  ];
}

/**
 * Shared Playwright defaults for package-owned E2E projects.
 * Each package keeps its own `playwright.config.ts` that calls this helper.
 */
export function definePackagePlaywrightConfig(
  options: PackagePlaywrightOptions
): PlaywrightTestConfig {
  const { packageName, packageDir } = options;
  const e2eDir = path.join(packageDir, "e2e");
  const fixtureDir = path.join(e2eDir, "fixture");
  const port = options.port ?? Number(process.env.E2E_PORT ?? 4173);
  const baseURL = `http://127.0.0.1:${port}`;
  const serverEntry = path.resolve(packageDir, "../../e2e/server/start-fixture-server.mjs");

  if (!existsSync(fixtureDir)) {
    throw new Error(`Missing E2E fixture directory: ${fixtureDir}`);
  }

  if (!existsSync(serverEntry)) {
    throw new Error(`Missing shared fixture server entry: ${serverEntry}`);
  }

  return {
    testDir: e2eDir,
    testMatch: "**/*.spec.ts",
    outputDir: path.join(e2eDir, "test-results"),
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: process.env.CI
      ? [
          ["github"],
          ["html", { open: "never", outputFolder: path.join(e2eDir, "playwright-report") }],
        ]
      : [
          ["list"],
          ["html", { open: "on-failure", outputFolder: path.join(e2eDir, "playwright-report") }],
        ],
    use: {
      baseURL,
      trace: "on-first-retry",
      screenshot: "only-on-failure",
      video: "retain-on-failure",
      actionTimeout: 10_000,
      navigationTimeout: 15_000,
    },
    expect: {
      timeout: 10_000,
    },
    webServer: {
      command: `node "${serverEntry}"`,
      cwd: packageDir,
      env: {
        ...process.env,
        PACKAGE_DIR: packageDir,
        PACKAGE_NAME: packageName,
        E2E_PORT: String(port),
      },
      url: `${baseURL}/__health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      stdout: "pipe",
      stderr: "pipe",
    },
    projects: resolveProjects(resolveBrowserProfile()),
  };
}
