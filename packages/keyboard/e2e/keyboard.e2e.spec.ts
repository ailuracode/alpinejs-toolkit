import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-keyboard", () => {
  test("fires a registered mod+k shortcut", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.locator("#shortcut-state")).toHaveText("idle");
    const modifier = process.platform === "darwin" ? "Meta" : "Control";
    await page.keyboard.press(`${modifier}+KeyK`);
    await expect(page.locator("#shortcut-state")).toHaveText("palette");
  });
});
