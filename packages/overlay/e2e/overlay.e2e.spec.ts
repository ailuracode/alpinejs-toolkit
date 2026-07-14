import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-overlay", () => {
  test("creates the portal root and registers overlays", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.locator("#overlay-root")).toBeAttached();
    await expect(page.locator("#stack-count")).toHaveText("1");
    await expect(page.locator("#open-state")).toHaveText("true");
    await expect(page.locator("#z-index")).toHaveText("1000");
  });

  test("unregisters overlays from the stack", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.getByRole("button", { name: "Unregister" }).click();
    await expect(page.locator("#stack-count")).toHaveText("0");
  });
});
