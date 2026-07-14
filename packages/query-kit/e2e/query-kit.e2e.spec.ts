import { expect, test, waitForAlpineFixture } from "../../../e2e/fixtures.js";

test.describe("@ailuracode/alpine-query-kit", () => {
  test("registers the query store and resolves data", async ({ page }) => {
    await page.goto("/");
    await waitForAlpineFixture(page);

    await expect(page.locator("#query-status")).toHaveText("success");
    await expect(page.locator("#query-data")).toHaveText("Ada");
  });
});
