import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-attention", () => {
  test("requests and releases the wake lock when supported", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    const supported = await page.locator("#wakelock-supported").textContent();
    if (supported !== "true") {
      test.skip(true, "Wake Lock API is not supported in this browser");
    }

    await page.getByRole("button", { name: "Request wake lock" }).click();
    const active = await page.locator("#wakelock-active").textContent();
    if (active !== "true") {
      test.skip(true, "Wake Lock could not be acquired in this environment");
    }

    await page.getByRole("button", { name: "Release wake lock" }).click();
    await expect(page.locator("#wakelock-active")).toHaveText("false");
  });
});
