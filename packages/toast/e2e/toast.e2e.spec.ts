import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-toast", () => {
  test("adds a toast through the magic API", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.locator("#toast-count")).toHaveText("0");
    await page.getByRole("button", { name: "Show toast" }).click();
    await expect(page.locator("#toast-count")).toHaveText("1");
    await expect(page.getByText("Hello toast")).toBeVisible();
  });

  test("dismisses all toasts", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.getByRole("button", { name: "Show toast" }).click();
    await page.getByRole("button", { name: "Dismiss all" }).click();
    await expect(page.locator("#toast-count")).toHaveText("0");
  });
});
