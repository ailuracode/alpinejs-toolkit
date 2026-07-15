import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-theme smoke", () => {
  test("renders resolved theme and toggles through the store", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    const resolved = page.locator("#resolved-theme");
    const toggle = page.getByRole("button", { name: "Toggle theme" });

    await expect(resolved).toHaveText("light");
    await expect(page.locator("html")).toHaveClass(/theme-light/);

    await toggle.click();

    await expect(resolved).toHaveText("dark");
    await expect(page.locator("html")).toHaveClass(/theme-dark/);
  });
});
