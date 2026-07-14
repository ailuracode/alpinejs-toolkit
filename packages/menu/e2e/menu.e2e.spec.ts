import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-menu", () => {
  test("opens the menu from the trigger", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.getByRole("menu")).toBeHidden();
    await page.getByRole("button", { name: "Account" }).click();
    await expect(page.getByRole("menu")).toBeVisible();
    await expect(page.locator("#menu-open")).toHaveText("true");
  });

  test("selects an item and closes the menu", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.getByRole("button", { name: "Account" }).click();
    await page.getByRole("menuitem", { name: "settings" }).click();
    await expect(page.getByRole("menu")).toBeHidden();
  });
});
