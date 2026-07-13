import { test as base, expect } from "@playwright/test";

/**
 * Shared Playwright fixtures for package-owned E2E suites.
 * Packages may import this module or extend it with package-specific helpers.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    page.on("pageerror", (error) => {
      throw new Error(`Uncaught page error: ${error.message}`);
    });
    await use(page);
  },
});

export { expect };

/**
 * Wait until Alpine has finished initializing the fixture page.
 * Prefer role- or test-id-based selectors in specs; this helper is for bootstrapping only.
 */
export async function waitForAlpineFixture(
  page: import("@playwright/test").Page,
  selector = "[data-e2e-ready='true']"
): Promise<void> {
  await expect(page.locator(selector)).toBeVisible();
}
