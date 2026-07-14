import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-command", () => {
  test("opens the palette and lists commands", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.getByRole("button", { name: "Open palette" }).click();
    await expect(page.locator("#palette")).toBeVisible();
    await expect(page.getByRole("listbox", { name: "Commands" })).toContainText("Copy");
    await expect(page.getByRole("listbox", { name: "Commands" })).toContainText("Paste");
  });

  test("filters commands while typing", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.getByRole("button", { name: "Open palette" }).click();
    await page.locator("#command-input").fill("paste");
    await expect(page.getByRole("listbox", { name: "Commands" })).toContainText("Paste");
    await expect(page.getByRole("listbox", { name: "Commands" })).not.toContainText("Copy");
  });
});
