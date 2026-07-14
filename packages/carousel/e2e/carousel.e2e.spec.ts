import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-carousel", () => {
  test("navigates slides with goTo", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.locator("#carousel-index")).toHaveText("0");
    await page.getByRole("button", { name: "Go to slide 2" }).click();
    await expect(page.locator("#carousel-index")).toHaveText("1");
  });
});
