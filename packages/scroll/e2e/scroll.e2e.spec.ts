import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-scroll", () => {
  test("tracks scroll position reactively", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.locator("#scroll-y")).toHaveText("0");
    await page.evaluate(() => window.scrollTo(0, 200));
    await expect(page.locator("#scroll-y")).not.toHaveText("0");
  });

  test("locks and unlocks body scroll", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await page.getByRole("button", { name: "Lock scroll", exact: true }).click();
    await expect(page.locator("#scroll-locked")).toHaveText("true");
    await page.getByRole("button", { name: "Unlock scroll", exact: true }).click();
    await expect(page.locator("#scroll-locked")).toHaveText("false");
  });
});
