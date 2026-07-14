import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-tooltip", () => {
  test("opens on hover and shows tooltip content", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.getByRole("tooltip")).toBeHidden();
    await page.getByRole("button", { name: "Help" }).hover();
    await expect(page.getByRole("tooltip")).toBeVisible();
    await expect(page.getByRole("tooltip")).toHaveText("Tooltip content");
    await expect(page.locator("#tooltip-open")).toHaveText("true");
  });

  test("closes on Escape", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.getByRole("button", { name: "Help" }).hover();
    await expect(page.getByRole("tooltip")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("tooltip")).toBeHidden();
  });
});
