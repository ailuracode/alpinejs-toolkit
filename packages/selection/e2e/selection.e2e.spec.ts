import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-selection", () => {
  test("selects an item through pointer interaction", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.getByRole("option", { name: "Alpha" }).click();
    await expect(page.locator("#selected")).toHaveText("a");
  });

  test("replaces selection in single mode", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.getByRole("option", { name: "Alpha" }).click();
    await page.getByRole("option", { name: "Beta" }).click();
    await expect(page.locator("#selected")).toHaveText("b");
  });
});
