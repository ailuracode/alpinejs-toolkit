import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-permissions", () => {
  test("queries adapter state without auto-requesting", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.locator("#permission-state")).toHaveText("prompt");
  });

  test("requests permission after explicit user interaction", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.getByRole("button", { name: "Request notifications" }).click();
    await expect(page.locator("#permission-state")).toHaveText("granted");
  });
});
