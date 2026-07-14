import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-tabs", () => {
  test("switches panels when a tab is clicked", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.locator("#panel-a")).toBeVisible();
    await expect(page.locator("#panel-b")).toBeHidden();
    await page.getByRole("tab", { name: "Tab B" }).click();
    await expect(page.locator("#panel-b")).toBeVisible();
    await expect(page.locator("#active-tab")).toHaveText("tab-b");
  });

  test("navigates tabs with arrow keys", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.getByRole("tab", { name: "Tab A" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#active-tab")).toHaveText("tab-b");
    await expect(page.locator("#panel-b")).toBeVisible();
  });
});
