import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-sidebar", () => {
  test("shows and hides the sidebar", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.locator("#sidebar-panel")).toBeHidden();
    await page.getByRole("button", { name: "Show sidebar" }).click();
    await expect(page.locator("#sidebar-panel")).toBeVisible();
    await expect(page.locator("#sidebar-visible")).toHaveText("true");

    await page.getByRole("button", { name: "Hide sidebar" }).click();
    await expect(page.locator("#sidebar-panel")).toBeHidden();
  });
});
