import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-env", () => {
  test("exposes network and visibility magics", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.locator("#network-online")).toHaveText("true");
    await expect(page.locator("#visibility")).toHaveText("visible");
    await expect(page.locator("#platform")).not.toHaveText("");
  });

  test("reacts to offline events", async ({ page, context }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await context.setOffline(true);
    await expect(page.locator("#network-online")).toHaveText("false");
    await context.setOffline(false);
    await expect(page.locator("#network-online")).toHaveText("true");
  });
});
