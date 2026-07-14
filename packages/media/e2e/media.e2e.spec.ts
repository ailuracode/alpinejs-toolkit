import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-media", () => {
  test("reports the current breakpoint in markup", async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 600 });
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.locator("#breakpoint")).toHaveText("md");
  });

  test("updates breakpoint when the viewport changes", async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.locator("#breakpoint")).toHaveText("lg");
    await page.setViewportSize({ width: 400, height: 600 });
    await expect(page.locator("#breakpoint")).toHaveText("sm");
  });
});
