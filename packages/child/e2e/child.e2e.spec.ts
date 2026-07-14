import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-child", () => {
  test("unwraps the wrapper and keeps the child element", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.locator("#wrapper")).toHaveCount(0);
    await expect(page.locator("#child-button")).toBeVisible();
  });

  test("transfers bindings and click handlers to the child", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.locator("#click-state")).toHaveText("idle");
    await page.getByRole("button", { name: "Child action" }).click();
    await expect(page.locator("#click-state")).toHaveText("clicked");
  });
});
