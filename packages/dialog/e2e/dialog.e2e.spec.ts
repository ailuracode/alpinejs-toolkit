import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-dialog", () => {
  test("opens and closes the dialog from markup", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.getByRole("dialog")).toBeHidden();
    await page.getByRole("button", { name: "Open dialog" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.locator("#dialog-open")).toHaveText("true");

    await page.getByRole("button", { name: "Close" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.locator("#dialog-open")).toHaveText("false");
  });

  test("closes the dialog on Escape", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.getByRole("button", { name: "Open dialog" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
  });
});
